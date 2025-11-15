import { MudLogSchema, CurveDefinition, CurveCategory, DataChunk } from '../types/mudLogSchema.js'

/**
 * Parse LAS (Log ASCII Standard) files to standard mud logging schema
 * Supports LAS 2.0 and 3.0
 */
export function parseLASFile(content: string, chunkSize: number = 1000): MudLogSchema {
  console.log('📋 Parsing LAS file...')

  const sections = parseLASSections(content)

  // Extract metadata from ~W (Well) section
  const metadata = extractLASMetadata(sections)

  // Extract curves from ~C (Curve) section
  const curves = extractLASCurves(sections)

  // Determine indexing type
  const indexing = determineLASIndexing(curves)

  // Parse data from ~A (ASCII) section
  const dataChunks = parseLASData(sections, curves, chunkSize)

  console.log(`✅ LAS parsing complete: ${curves.length} curves, ${dataChunks.reduce((sum, c) => sum + c.rowCount, 0)} rows`)

  return {
    metadata: {
      ...metadata,
      sourceFormat: 'LAS',
      sourceVersion: sections.version?.VERS || '2.0'
    },
    indexing,
    curves,
    data: {
      totalRows: dataChunks.reduce((sum, c) => sum + c.rowCount, 0),
      chunkSize,
      chunks: dataChunks
    }
  }
}

interface LASSections {
  version?: Record<string, string>
  well?: Record<string, string>
  curves?: Record<string, string>
  parameters?: Record<string, string>
  other?: Record<string, string>
  dataLines?: string[]
}

function parseLASSections(content: string): LASSections {
  const sections: LASSections = {}
  const lines = content.split(/\r?\n/)

  let currentSection: string | null = null
  const sectionData: Record<string, Record<string, string>> = {}
  const dataLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue

    // Section headers
    if (trimmed.startsWith('~')) {
      currentSection = trimmed.substring(1, 2).toUpperCase()
      sectionData[currentSection] = {}
      continue
    }

    // Data section
    if (currentSection === 'A') {
      dataLines.push(trimmed)
      continue
    }

    // Parse section data
    if (currentSection && sectionData[currentSection]) {
      const match = trimmed.match(/^([A-Z0-9_]+)\s*\.\s*([^:]+):\s*(.*)$/i)
      if (match) {
        const [, mnemonic, unit, description] = match
        sectionData[currentSection][mnemonic] = description.trim()
      }
    }
  }

  sections.version = sectionData['V']
  sections.well = sectionData['W']
  sections.curves = sectionData['C']
  sections.parameters = sectionData['P']
  sections.other = sectionData['O']
  sections.dataLines = dataLines

  return sections
}

function extractLASMetadata(sections: LASSections) {
  const well = sections.well || {}

  return {
    wellName: well['WELL'] || well['UWI'] || 'Unknown',
    wellboreName: well['WELL'] || 'Unknown',
    operator: well['COMP'] || undefined,
    rig: undefined,
    field: well['FLD'] || undefined,
    country: well['CTRY'] || undefined,
    startDate: well['DATE'] || undefined,
    endDate: undefined
  }
}

function extractLASCurves(sections: LASSections): CurveDefinition[] {
  const curveSection = sections.curves || {}
  const curves: CurveDefinition[] = []

  for (const [mnemonic, description] of Object.entries(curveSection)) {
    const category = categorizeCurve(mnemonic, description)
    const unit = extractUnitFromDescription(description)

    curves.push({
      mnemonic,
      description: description.replace(/\([^)]*\)/g, '').trim(), // Remove unit from description
      unit,
      curveType: 'continuous',
      category
    })
  }

  return curves
}

function categorizeCurve(mnemonic: string, description: string): CurveCategory {
  const m = mnemonic.toUpperCase()
  const d = description.toUpperCase()

  // Depth
  if (/^(DEPT|DEPTH|MD|TVD)/.test(m)) return 'depth'

  // Time
  if (/^(TIME|DATE)/.test(m)) return 'time'

  // Drilling parameters
  if (/^(ROP|WOB|RPM|TRQ|PUMP|SPP|FLOW)/.test(m)) return 'drilling'

  // Mud properties
  if (/^(MUD|MW|VISC|PH|TEMP|FILT)/.test(m)) return 'mud'

  // Gas
  if (/^(C1|C2|C3|C4|C5|GAS|TGAS|TOTAL)/.test(m) || d.includes('GAS')) return 'gas'

  // Lithology
  if (/^(LITH|FORM|ROCK|SHALE)/.test(m) || d.includes('LITHOLOGY')) return 'lithology'

  // Survey
  if (/^(INC|AZI|INCL|AZIM)/.test(m)) return 'survey'

  return 'other'
}

function extractUnitFromDescription(description: string): string {
  const match = description.match(/\(([^)]+)\)/)
  return match ? match[1].trim() : ''
}

function determineLASIndexing(curves: CurveDefinition[]) {
  // First curve is usually the index
  const indexCurve = curves[0]
  const isDepth = indexCurve.category === 'depth'
  const isTime = indexCurve.category === 'time'

  return {
    type: (isDepth ? 'depth' : isTime ? 'time' : 'depth') as 'depth' | 'time',
    depthIndexes: isDepth ? {
      md: {
        mnemonic: indexCurve.mnemonic,
        unit: indexCurve.unit,
        minValue: 0,
        maxValue: 0
      }
    } : undefined,
    timeIndex: isTime ? {
      mnemonic: indexCurve.mnemonic,
      unit: indexCurve.unit,
      minValue: 0,
      maxValue: 0
    } : undefined
  }
}

function parseLASData(sections: LASSections, curves: CurveDefinition[], chunkSize: number): DataChunk[] {
  const dataLines = sections.dataLines || []
  const chunks: DataChunk[] = []

  let currentChunk: DataChunk | null = null
  let chunkIndex = 0

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i]
    const values = line.trim().split(/\s+/)

    if (values.length !== curves.length) continue

    // Create new chunk if needed
    if (!currentChunk || currentChunk.rows.length >= chunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk)
      }

      currentChunk = {
        chunkIndex: chunkIndex++,
        startIndex: parseFloat(values[0]),
        endIndex: parseFloat(values[0]),
        rowCount: 0,
        rows: []
      }
    }

    // Parse row
    const rowValues: Record<string, number | string | null> = {}
    values.forEach((val, idx) => {
      const mnemonic = curves[idx].mnemonic
      const parsed = parseFloat(val)
      rowValues[mnemonic] = isNaN(parsed) ? val : parsed
    })

    currentChunk.rows.push({
      index: parseFloat(values[0]),
      values: rowValues
    })

    currentChunk.endIndex = parseFloat(values[0])
    currentChunk.rowCount++
  }

  // Add last chunk
  if (currentChunk && currentChunk.rows.length > 0) {
    chunks.push(currentChunk)
  }

  return chunks
}
