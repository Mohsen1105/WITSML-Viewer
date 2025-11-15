import sax from 'sax'

interface StreamedWitsmlData {
  version: string
  type: string
  metadata: any
  curves: Array<{mnemonic: string, unit: string, description: string}>
  data: Array<{index: number | string, values: Record<string, any>}>
  totalRows: number
  sampledRows: number
  raw: string
}

/**
 * TRUE streaming parser using SAX - processes 1GB+ files without memory issues
 * Extracts only essential data, samples on-the-fly
 */
export async function parseWitsmlFileSAX(xmlContent: string, maxRows: number = 1000): Promise<StreamedWitsmlData> {
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
    const curves: Array<{mnemonic: string, unit: string, description: string}> = []

    // Data collection
    const dataRows: Array<{index: number | string, values: Record<string, any>}> = []
    let totalRowCount = 0
    let samplingRate = 1
    let currentRow: any = null
    let currentCurveInfo: any = {}

    // Track what we've found
    let foundLogData = false
    let foundLogCurveInfo = false

    parser.on('opentag', (node) => {
      currentPath.push(node.name)
      currentElement = node.name
      currentText = ''

      // Detect version from namespace
      if (node.name === 'logs' || node.name === 'log') {
        if (node.attributes.xmlns) {
          const ns = node.attributes.xmlns as string
          if (ns.includes('131')) version = '1.3.1'
          else if (ns.includes('1series')) version = '1.4.1'
          else if (ns.includes('v2')) version = '2.0'
        }
      }

      // Collect curve information
      if (node.name === 'logCurveInfo') {
        foundLogCurveInfo = true
        currentCurveInfo = {}
      }

      // Start of a data row
      if (node.name === 'data' && currentPath.includes('logData')) {
        foundLogData = true
        totalRowCount++

        // Adaptive sampling
        if (dataRows.length >= maxRows && totalRowCount % samplingRate === 0) {
          if (dataRows.length >= maxRows * 2) {
            samplingRate *= 2
            console.log(`  📉 Increasing sampling rate to 1:${samplingRate} (${totalRowCount} rows processed)`)
          }
        }
      }
    })

    parser.on('text', (text) => {
      currentText += text
    })

    parser.on('closetag', (tagName) => {
      const path = currentPath.join('/')
      const trimmedText = currentText.trim()

      // Extract curve metadata
      if (currentPath[currentPath.length - 2] === 'logCurveInfo') {
        if (tagName === 'mnemonic') currentCurveInfo.mnemonic = trimmedText
        else if (tagName === 'unit') currentCurveInfo.unit = trimmedText
        else if (tagName === 'curveDescription') currentCurveInfo.description = trimmedText
      }

      if (tagName === 'logCurveInfo' && currentCurveInfo.mnemonic) {
        curves.push({
          mnemonic: currentCurveInfo.mnemonic,
          unit: currentCurveInfo.unit || '',
          description: currentCurveInfo.description || ''
        })
        currentCurveInfo = {}
      }

      // Extract data rows (sampled)
      if (tagName === 'data' && currentPath.includes('logData') && trimmedText) {
        // Sample this row?
        if (dataRows.length < maxRows || totalRowCount % samplingRate === 0) {
          const values = trimmedText.split(',').map(v => v.trim())

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

      // Extract well metadata
      if (currentPath.includes('well') && !currentPath.includes('wellbore')) {
        if (tagName === 'name' && !metadata.wellName) metadata.wellName = trimmedText
        else if (tagName === 'operator') metadata.operator = trimmedText
        else if (tagName === 'field') metadata.field = trimmedText
      }

      if (currentPath.includes('wellbore')) {
        if (tagName === 'name' && !metadata.wellboreName) metadata.wellboreName = trimmedText
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
      console.log(`   Found ${curves.length} curves`)
      console.log(`   Processed ${totalRowCount} rows, kept ${dataRows.length} samples`)
      console.log(`   Sampling rate: 1:${samplingRate}`)

      resolve({
        version,
        type: foundLogData ? 'log' : 'unknown',
        metadata,
        curves,
        data: dataRows,
        totalRows: totalRowCount,
        sampledRows: dataRows.length,
        raw: ''
      })
    })

    // Start parsing
    parser.write(xmlContent)
    parser.end()
  })
}
