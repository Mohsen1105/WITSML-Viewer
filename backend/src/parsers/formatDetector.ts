import { FormatDetectionResult } from '../types/mudLogSchema.js'

/**
 * Detect the format of a mud logging file
 */
export function detectFileFormat(content: string, filename: string): FormatDetectionResult {
  // Check file extension first
  const ext = filename.toLowerCase().split('.').pop()

  // WITSML Detection (XML-based)
  if (isWITSML(content)) {
    const version = detectWITSMLVersion(content)
    return {
      format: 'WITSML',
      version,
      confidence: 0.95,
      details: { namespace: extractNamespace(content) }
    }
  }

  // LAS Detection (Log ASCII Standard)
  if (isLAS(content)) {
    const version = detectLASVersion(content)
    return {
      format: 'LAS',
      version,
      confidence: 0.9,
      details: { hasVersionSection: true }
    }
  }

  // CSV Detection
  if (ext === 'csv' || isCSV(content)) {
    return {
      format: 'CSV',
      confidence: 0.7,
      details: { delimiter: detectCSVDelimiter(content) }
    }
  }

  // JSON Detection
  if (isJSON(content)) {
    return {
      format: 'JSON',
      confidence: 0.8,
      details: { parsed: true }
    }
  }

  // DLIS Detection (binary format)
  if (ext === 'dlis' || isDLIS(content)) {
    return {
      format: 'DLIS',
      confidence: 0.6,
      details: { binary: true }
    }
  }

  return {
    format: 'UNKNOWN',
    confidence: 0,
    details: { extension: ext }
  }
}

function isWITSML(content: string): boolean {
  const header = content.substring(0, 5000)
  return header.includes('xmlns') && (
    header.includes('witsml.org') ||
    header.includes('energistics.org') ||
    header.includes('<logs') ||
    header.includes('<log') ||
    header.includes('<mudLog')
  )
}

function detectWITSMLVersion(content: string): string {
  const header = content.substring(0, 5000)
  if (/xmlns="http:\/\/www\.witsml\.org\/schemas\/131/.test(header)) {
    return '1.3.1'
  }
  if (/xmlns="http:\/\/www\.witsml\.org\/schemas\/1series/.test(header)) {
    return '1.4.1'
  }
  if (/xmlns="http:\/\/www\.energistics\.org\/energyml\/data\/witsmlv2/.test(header)) {
    return '2.0'
  }
  return 'unknown'
}

function extractNamespace(content: string): string | undefined {
  const match = content.match(/xmlns="([^"]+)"/)
  return match ? match[1] : undefined
}

function isLAS(content: string): boolean {
  const header = content.substring(0, 1000)
  // LAS files start with ~V (version) section
  return /~V\s*[\r\n]|~VERSION/i.test(header) ||
         /~W\s*[\r\n]|~WELL/i.test(header) ||
         /~C\s*[\r\n]|~CURVE/i.test(header)
}

function detectLASVersion(content: string): string {
  const versionMatch = content.match(/VERS\s*\.\s*(\d+\.?\d*)/i)
  return versionMatch ? versionMatch[1] : '2.0'
}

function isCSV(content: string): boolean {
  const lines = content.split('\n').slice(0, 10)
  if (lines.length < 2) return false

  // Check if lines have consistent delimiters
  const delimiter = detectCSVDelimiter(content)
  const columnCounts = lines.map(line => line.split(delimiter).length)

  // Most lines should have same number of columns
  const mostCommon = columnCounts.reduce((a, b) =>
    columnCounts.filter(v => v === a).length >= columnCounts.filter(v => v === b).length ? a : b
  )

  const consistency = columnCounts.filter(c => c === mostCommon).length / columnCounts.length
  return consistency > 0.7 && mostCommon > 1
}

function detectCSVDelimiter(content: string): string {
  const sample = content.substring(0, 5000)
  const delimiters = [',', '\t', ';', '|']
  const counts = delimiters.map(d => ({
    delimiter: d,
    count: (sample.match(new RegExp(`\\${d}`, 'g')) || []).length
  }))

  counts.sort((a, b) => b.count - a.count)
  return counts[0].count > 0 ? counts[0].delimiter : ','
}

function isJSON(content: string): boolean {
  try {
    const trimmed = content.trim()
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false
    JSON.parse(trimmed)
    return true
  } catch {
    return false
  }
}

function isDLIS(content: string): boolean {
  // DLIS files are binary and start with specific markers
  // This is a simplified check
  const header = content.substring(0, 100)
  return header.includes('DLIS') || /[\x00-\x08\x0B-\x0C\x0E-\x1F]/.test(header.substring(0, 20))
}
