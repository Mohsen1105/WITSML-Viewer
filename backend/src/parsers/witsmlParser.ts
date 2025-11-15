import { XMLParser } from 'fast-xml-parser'

interface WitsmlData {
  version: string
  type: string
  data: any
  raw: string
}

// WITSML namespace detection patterns
const VERSION_PATTERNS = {
  '1.3.1': /xmlns="http:\/\/www\.witsml\.org\/schemas\/131/,
  '1.4.1': /xmlns="http:\/\/www\.witsml\.org\/schemas\/1series/,
  '2.0': /xmlns="http:\/\/www\.energistics\.org\/energyml\/data\/witsmlv2/,
  '2.1': /xmlns="http:\/\/www\.energistics\.org\/energyml\/data\/witsmlv2/,
}

// Common WITSML object types
const OBJECT_TYPES = [
  'well',
  'wellbore',
  'log',
  'trajectory',
  'mudLog',
  'rig',
  'bhaRun',
  'cementJob',
  'convCore',
  'fluidsReport',
  'formationMarker',
  'message',
  'opsReport',
  'realtime',
  'risk',
  'surveyProgram',
  'target',
  'tubular',
  'wbGeometry',
]

/**
 * Detect WITSML version from XML content
 */
function detectWitsmlVersion(xmlContent: string): string {
  for (const [version, pattern] of Object.entries(VERSION_PATTERNS)) {
    if (pattern.test(xmlContent)) {
      return version
    }
  }
  return 'unknown'
}

/**
 * Detect WITSML object type from parsed data
 */
function detectObjectType(parsedData: any): string {
  // Check root level for WITSML objects
  for (const key of Object.keys(parsedData)) {
    const lowerKey = key.toLowerCase()
    for (const objType of OBJECT_TYPES) {
      if (lowerKey.includes(objType.toLowerCase())) {
        return objType
      }
    }
  }
  return 'unknown'
}

/**
 * Parse WITSML 1.x format
 */
function parseWitsml1x(parsedXml: any, version: string): any {
  // Find the main WITSML object container
  let witsmlData = parsedXml

  // Navigate through common 1.x structures
  if (parsedXml.witsml) {
    witsmlData = parsedXml.witsml
  } else if (parsedXml.WITSMLComposite) {
    witsmlData = parsedXml.WITSMLComposite
  }

  return witsmlData
}

/**
 * Parse WITSML 2.x format
 */
function parseWitsml2x(parsedXml: any, version: string): any {
  // WITSML 2.x uses Energistics format
  // Navigate through the structure
  let witsmlData = parsedXml

  // Common 2.x root elements
  if (parsedXml.Wellbore) {
    witsmlData = parsedXml.Wellbore
  } else if (parsedXml.Well) {
    witsmlData = parsedXml.Well
  } else if (parsedXml.Log) {
    witsmlData = parsedXml.Log
  } else if (parsedXml.Trajectory) {
    witsmlData = parsedXml.Trajectory
  }

  return witsmlData
}

/**
 * Optimize large log data by sampling (in-place modification for memory efficiency)
 */
function optimizeLargeData(data: any, maxSamples: number = 1000): any {
  // Find and sample large arrays (like log data) - in-place to save memory
  function sampleArrays(obj: any): any {
    if (Array.isArray(obj)) {
      // If array is very large, sample it
      if (obj.length > maxSamples) {
        console.log(`  📉 Sampling array with ${obj.length} items down to ${maxSamples}`)
        const step = Math.floor(obj.length / maxSamples)
        const sampled = []
        for (let i = 0; i < obj.length; i += step) {
          sampled.push(obj[i])
        }
        // Add last item to ensure we get the end
        if (sampled.length < maxSamples && obj.length > 0) {
          sampled.push(obj[obj.length - 1])
        }
        return sampled
      }
      // Recursively process array items
      for (let i = 0; i < obj.length; i++) {
        if (typeof obj[i] === 'object' && obj[i] !== null) {
          obj[i] = sampleArrays(obj[i])
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          obj[key] = sampleArrays(obj[key])
        }
      }
    }
    return obj
  }

  return sampleArrays(data)
}

/**
 * Main WITSML parser function
 */
export async function parseWitsmlFile(xmlContent: string): Promise<WitsmlData> {
  try {
    const fileSizeInMB = Buffer.byteLength(xmlContent, 'utf-8') / (1024 * 1024)
    const isLargeFile = fileSizeInMB > 50 // Files larger than 50MB
    const isVeryLargeFile = fileSizeInMB > 200 // Files larger than 200MB

    console.log(`📄 Parsing WITSML file: ${fileSizeInMB.toFixed(2)} MB`)

    // Detect version from header only (first 5000 chars)
    const header = xmlContent.substring(0, 5000)
    const version = detectWitsmlVersion(header)

    // Configure XML parser with VERY memory-efficient settings for large files
    const parserOptions = {
      ignoreAttributes: isLargeFile, // Skip attributes for large files
      attributeNamePrefix: '$',
      parseAttributeValue: false, // Never parse values to save memory
      trimValues: true,
      parseTrueNumberOnly: false, // Skip number parsing
      arrayMode: false,
      processEntities: false, // Skip entity processing
      removeNSPrefix: true,
      ignoreDeclaration: true,
      ignorePiTag: true,
      parseTagValue: !isLargeFile, // Skip tag value parsing for large files
      parseAttributeValue: false,
      trimValues: !isLargeFile,
      cdataPropName: '__cdata',
      commentPropName: false, // Don't keep comments
      unpairedTags: []
    }

    console.log('🔄 Parsing XML structure (memory-efficient mode)...')

    // Force garbage collection before parsing if available
    if (global.gc) {
      global.gc()
    }

    const parser = new XMLParser(parserOptions)
    let parsedXml = parser.parse(xmlContent)

    // Clear the XML content from memory immediately
    xmlContent = ''

    console.log('🔍 Processing WITSML structure...')

    // Version-specific parsing
    let data
    if (version.startsWith('1.')) {
      data = parseWitsml1x(parsedXml, version)
    } else if (version.startsWith('2.')) {
      data = parseWitsml2x(parsedXml, version)
    } else {
      data = parsedXml
    }

    // Clear parsed XML from memory
    parsedXml = null

    // Force garbage collection
    if (global.gc) {
      global.gc()
    }

    // For large files, be very aggressive with optimization
    if (isLargeFile) {
      const maxSamples = isVeryLargeFile ? 500 : 1000
      console.log(`⚡ Optimizing large dataset (sampling arrays > ${maxSamples} items)...`)
      data = optimizeLargeData(data, maxSamples)
    }

    // Detect object type
    const objectType = detectObjectType(data)

    console.log(`✅ Parsing complete: ${version} ${objectType}`)

    // Never store raw XML for large files
    const raw = ''

    return {
      version,
      type: objectType,
      data,
      raw,
    }
  } catch (error: any) {
    console.error('❌ Parser error:', error.message)
    throw new Error(`WITSML parsing error: ${error.message}`)
  }
}

/**
 * Validate WITSML file
 */
export function validateWitsmlFile(xmlContent: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check if it's valid XML
  if (!xmlContent || xmlContent.trim().length === 0) {
    errors.push('File is empty')
    return { valid: false, errors }
  }

  // Check for XML declaration
  if (!xmlContent.includes('<?xml')) {
    errors.push('Missing XML declaration')
  }

  // Check for WITSML namespace
  const version = detectWitsmlVersion(xmlContent)
  if (version === 'unknown') {
    errors.push('Unknown or missing WITSML namespace')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
