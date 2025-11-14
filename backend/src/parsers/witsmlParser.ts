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
 * Main WITSML parser function
 */
export async function parseWitsmlFile(xmlContent: string): Promise<WitsmlData> {
  try {
    // Detect version
    const version = detectWitsmlVersion(xmlContent)

    // Configure XML parser
    const parserOptions = {
      ignoreAttributes: false,
      attributeNamePrefix: '$',
      parseAttributeValue: true,
      trimValues: true,
      parseTrueNumberOnly: true,
      arrayMode: false,
      processEntities: true,
      removeNSPrefix: true, // Remove namespace prefixes for easier access
    }

    const parser = new XMLParser(parserOptions)
    let parsedXml = parser.parse(xmlContent)

    // Version-specific parsing
    let data
    if (version.startsWith('1.')) {
      data = parseWitsml1x(parsedXml, version)
    } else if (version.startsWith('2.')) {
      data = parseWitsml2x(parsedXml, version)
    } else {
      // Unknown version, try to parse as-is
      data = parsedXml
    }

    // Detect object type
    const objectType = detectObjectType(data)

    return {
      version,
      type: objectType,
      data,
      raw: xmlContent,
    }
  } catch (error: any) {
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
