/**
 * Standard Mud Logging Data Schema
 * All file formats are normalized to this structure
 */

export interface MudLogSchema {
  // Metadata
  metadata: {
    wellName: string
    wellboreName: string
    operator?: string
    rig?: string
    field?: string
    country?: string
    startDate?: string
    endDate?: string
    sourceFormat: string // Original format (WITSML, LAS, CSV, etc.)
    sourceVersion?: string
  }

  // Index information
  indexing: {
    type: 'depth' | 'time' // Primary index type
    depthIndexes?: {
      md?: IndexDefinition  // Measured Depth
      tvd?: IndexDefinition // True Vertical Depth
    }
    timeIndex?: IndexDefinition
  }

  // Curve/Channel definitions
  curves: CurveDefinition[]

  // Actual data (chunked for large files)
  data: {
    totalRows: number
    chunkSize: number
    chunks: DataChunk[]
  }
}

export interface IndexDefinition {
  mnemonic: string
  unit: string
  minValue: number
  maxValue: number
}

export interface CurveDefinition {
  mnemonic: string
  description: string
  unit: string
  curveType: 'continuous' | 'discrete' | 'categorical'
  category: CurveCategory
  minValue?: number
  maxValue?: number
}

export type CurveCategory =
  | 'drilling'      // ROP, WOB, RPM, etc.
  | 'mud'           // Mud weight, viscosity, etc.
  | 'gas'           // C1, C2, C3, Total Gas, etc.
  | 'lithology'     // Formation, cuttings description
  | 'survey'        // Inclination, azimuth
  | 'time'          // Timestamps
  | 'depth'         // MD, TVD
  | 'other'

export interface DataChunk {
  chunkIndex: number
  startIndex: number  // Start depth or time
  endIndex: number    // End depth or time
  rowCount: number
  rows: DataRow[]
}

export interface DataRow {
  index: number | string  // Depth value or timestamp
  values: Record<string, number | string | null>  // Curve mnemonic -> value
}

/**
 * File format detection result
 */
export interface FormatDetectionResult {
  format: 'WITSML' | 'LAS' | 'DLIS' | 'CSV' | 'JSON' | 'UNKNOWN'
  version?: string
  confidence: number // 0-1
  details?: any
}
