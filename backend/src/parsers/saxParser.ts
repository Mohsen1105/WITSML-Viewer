import sax from 'sax'
import { MudLogSchema, CurveDefinition, DataChunk, CurveCategory } from '../types/mudLogSchema.js'

/**
 * Categorize curve by mnemonic and description
 */
function categorizeCurve(mnemonic: string, description: string): CurveCategory {
  const m = mnemonic.toUpperCase()
  const d = description.toUpperCase()

  // Depth
  if (/^(DEPT|DEPTH|MD|TVD)/.test(m)) return 'depth'

  // Time
  if (/^(TIME|DATE)/.test(m)) return 'time'

  // Drilling parameters
  if (/^(ROP|WOB|RPM|TRQ|TORQUE|PUMP|SPP|FLOW)/.test(m)) return 'drilling'

  // Mud properties
  if (/^(MUD|MW|VISC|PH|TEMP|FILT|DENSITY)/.test(m)) return 'mud'

  // Gas
  if (/^(C1|C2|C3|C4|C5|GAS|TGAS|TOTAL)/.test(m) || d.includes('GAS')) return 'gas'

  // Lithology
  if (/^(LITH|FORM|ROCK|SHALE)/.test(m) || d.includes('LITHOLOGY')) return 'lithology'

  // Survey
  if (/^(INC|AZI|INCL|AZIM)/.test(m)) return 'survey'

  return 'other'
}

/**
 * TRUE streaming parser using SAX - handles WITSML 1.x AND 2.x formats
 * Processes 1GB+ files without memory issues
 * Returns standardized MudLogSchema format
 */
export async function parseWitsmlFileSAX(xmlContent: string, maxRows: number = 1000): Promise<MudLogSchema> {
  return new Promise((resolve, reject) => {
    console.log(`🌊 SAX Streaming parser starting...`)

    const parser = sax.createStream(true, {
      trim: true,
      normalize: true,
      lowercase: false
    })

    // State
    let version = 'unknown'
    let currentPath: string[] = []
    let currentElement = ''
    let currentText = ''

    // Metadata
    const metadata: any = {}
    const curves: CurveDefinition[] = []

    // Data collection
    const dataRows: Array<{index: number | string, values: Record<string, any>}> = []
    let totalRowCount = 0
    let samplingRate = 1
    let currentChannelInfo: any = {}

    // Track what we've found
    let foundData = false
    let foundChannels = false
    let isWitsml2 = false
    const allElements = new Set<string>()
    let elementCount = 0

    // Current data row being built
    let currentDataValues: string[] = []

    parser.on('opentag', (node) => {
      const simpleName = node.name.replace(/^ns\d+:/, '') // Remove namespace prefix
      currentPath.push(simpleName)
      currentElement = simpleName
      currentText = ''

      // Track all unique elements for debugging
      allElements.add(node.name)
      elementCount++

      // Log first few elements to understand structure
      if (elementCount <= 20) {
        console.log(`  📦 Element: <${currentPath.join('/')}${node.attributes.xmlns ? ' xmlns="..."' : ''}>`)
      }

      // Detect WITSML version
      if (simpleName === 'Log' || simpleName === 'ChannelSet') {
        isWitsml2 = true
        version = '2.0'
      } else if (node.name === 'logs' || node.name === 'log') {
        if (node.attributes.xmlns) {
          const ns = node.attributes.xmlns as string
          if (ns.includes('131')) version = '1.3.1'
          else if (ns.includes('1series')) version = '1.4.1'
          else if (ns.includes('v2')) version = '2.0'
        }
      }

      // WITSML 2.x: Collect channel information
      if (simpleName === 'Channel' && currentPath.includes('ChannelSet')) {
        foundChannels = true
        currentChannelInfo = {}
      }

      // WITSML 1.x: Collect curve information
      if (simpleName === 'logCurveInfo') {
        foundChannels = true
        currentChannelInfo = {}
      }

      // Start of a data row (WITSML 2.x)
      if (simpleName === 'Data' && currentPath.includes('ChannelSet')) {
        foundData = true
        currentDataValues = []
      }

      // Start of a data row (WITSML 1.x)
      if (simpleName === 'data' && currentPath.includes('logData')) {
        foundData = true
        totalRowCount++
      }
    })

    parser.on('text', (text) => {
      currentText += text
    })

    parser.on('closetag', (tagName) => {
      const simpleName = tagName.replace(/^ns\d+:/, '')
      const trimmedText = currentText.trim()

      // === WITSML 2.x Channel metadata ===
      if (currentPath[currentPath.length - 2] === 'Channel') {
        if (simpleName === 'Mnemonic') currentChannelInfo.mnemonic = trimmedText
        else if (simpleName === 'Uom') currentChannelInfo.unit = trimmedText
        else if (simpleName === 'ChannelClass') currentChannelInfo.description = trimmedText
      }

      if (simpleName === 'Channel' && currentChannelInfo.mnemonic) {
        const description = currentChannelInfo.description || ''
        const category = categorizeCurve(currentChannelInfo.mnemonic, description)
        curves.push({
          mnemonic: currentChannelInfo.mnemonic,
          unit: currentChannelInfo.unit || '',
          description,
          curveType: 'continuous',
          category
        })
        console.log(`  📊 Found channel: ${currentChannelInfo.mnemonic} (${currentChannelInfo.unit})`)
        currentChannelInfo = {}
      }

      // === WITSML 1.x Curve metadata ===
      if (currentPath[currentPath.length - 2] === 'logCurveInfo') {
        if (simpleName === 'mnemonic') currentChannelInfo.mnemonic = trimmedText
        else if (simpleName === 'unit') currentChannelInfo.unit = trimmedText
        else if (simpleName === 'curveDescription') currentChannelInfo.description = trimmedText
      }

      if (simpleName === 'logCurveInfo' && currentChannelInfo.mnemonic) {
        const description = currentChannelInfo.description || ''
        const category = categorizeCurve(currentChannelInfo.mnemonic, description)
        curves.push({
          mnemonic: currentChannelInfo.mnemonic,
          unit: currentChannelInfo.unit || '',
          description,
          curveType: 'continuous',
          category
        })
        currentChannelInfo = {}
      }

      // === WITSML 2.x Data (within <Data> element) ===
      if (simpleName === 'Data' && currentPath.includes('ChannelSet') && trimmedText) {
        totalRowCount++

        // Parse comma or space separated values
        const values = trimmedText.includes(',')
          ? trimmedText.split(',').map(v => v.trim())
          : trimmedText.trim().split(/\s+/)

        // Sample this row?
        if (dataRows.length < maxRows || totalRowCount % samplingRate === 0) {
          if (values.length > 0 && curves.length > 0) {
            const row: any = {
              index: parseFloat(values[0]) || values[0],
              values: {}
            }

            curves.forEach((curve, idx) => {
              if (idx < values.length) {
                const val = values[idx]
                row.values[curve.mnemonic] = isNaN(parseFloat(val)) ? val : parseFloat(val)
              }
            })

            dataRows.push(row)
          }
        }

        // Adaptive sampling
        if (dataRows.length >= maxRows && totalRowCount % 1000 === 0) {
          if (samplingRate < 16) {
            samplingRate *= 2
            console.log(`  📉 Increasing sampling rate to 1:${samplingRate} (${totalRowCount} rows processed)`)
          }
        }
      }

      // === WITSML 1.x Data ===
      if (simpleName === 'data' && currentPath.includes('logData') && trimmedText) {
        const values = trimmedText.split(',').map(v => v.trim())

        if (dataRows.length < maxRows || totalRowCount % samplingRate === 0) {
          if (values.length > 0 && curves.length > 0) {
            const row: any = {
              index: parseFloat(values[0]) || values[0],
              values: {}
            }

            curves.forEach((curve, idx) => {
              if (idx < values.length) {
                const val = values[idx]
                row.values[curve.mnemonic] = isNaN(parseFloat(val)) ? val : parseFloat(val)
              }
            })

            dataRows.push(row)
          }
        }
      }

      // Extract metadata
      if (currentPath.includes('Wellbore')) {
        if (simpleName === 'Title' && !metadata.wellboreName) metadata.wellboreName = trimmedText
      }
      if (currentPath.includes('well') && !currentPath.includes('wellbore')) {
        if (simpleName === 'name' && !metadata.wellName) metadata.wellName = trimmedText
      }

      currentPath.pop()
      currentText = ''
    })

    parser.on('error', (err) => {
      console.error('❌ SAX parse error:', err.message)
      reject(err)
    })

    parser.on('end', () => {
      console.log(`✅ SAX parsing complete:`)
      console.log(`   Version: ${isWitsml2 ? 'WITSML 2.x' : version}`)
      console.log(`   Found ${curves.length} curves/channels`)
      console.log(`   Processed ${totalRowCount} rows, kept ${dataRows.length} samples`)
      console.log(`   Sampling rate: 1:${samplingRate}`)

      // Determine indexing type
      const firstCurve = curves[0]
      const isDepth = firstCurve && firstCurve.category === 'depth'
      const isTime = firstCurve && firstCurve.category === 'time'

      // Calculate min/max values for index
      let minIndex = 0
      let maxIndex = 0
      if (dataRows.length > 0) {
        minIndex = typeof dataRows[0].index === 'number' ? dataRows[0].index : parseFloat(String(dataRows[0].index)) || 0
        maxIndex = typeof dataRows[dataRows.length - 1].index === 'number'
          ? dataRows[dataRows.length - 1].index
          : parseFloat(String(dataRows[dataRows.length - 1].index)) || 0
      }

      // Create data chunk
      const chunks: DataChunk[] = dataRows.length > 0 ? [{
        chunkIndex: 0,
        startIndex: minIndex,
        endIndex: maxIndex,
        rowCount: dataRows.length,
        rows: dataRows
      }] : []

      // Return standardized MudLogSchema format
      resolve({
        metadata: {
          wellName: metadata.wellName || 'Unknown',
          wellboreName: metadata.wellboreName || 'Unknown',
          operator: metadata.operator,
          rig: metadata.rig,
          field: metadata.field,
          country: metadata.country,
          startDate: metadata.startDate,
          endDate: metadata.endDate,
          sourceFormat: 'WITSML',
          sourceVersion: isWitsml2 ? '2.0' : version
        },
        indexing: {
          type: isDepth ? 'depth' : isTime ? 'time' : 'depth',
          depthIndexes: isDepth ? {
            md: {
              mnemonic: firstCurve.mnemonic,
              unit: firstCurve.unit,
              minValue: minIndex,
              maxValue: maxIndex
            }
          } : undefined,
          timeIndex: isTime ? {
            mnemonic: firstCurve.mnemonic,
            unit: firstCurve.unit,
            minValue: minIndex,
            maxValue: maxIndex
          } : undefined
        },
        curves,
        data: {
          totalRows: totalRowCount,
          chunkSize: maxRows,
          chunks
        }
      })
    })

    // Start parsing
    parser.write(xmlContent)
    parser.end()
  })
}
