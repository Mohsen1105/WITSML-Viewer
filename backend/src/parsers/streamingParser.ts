import { Readable } from 'stream'
import XmlStream from 'xml-stream'

interface StreamedWitsmlData {
  version: string
  type: string
  data: any
  raw: string
  isStreamed: boolean
}

/**
 * Stream-based parser for very large WITSML files
 * This avoids loading the entire file into memory at once
 */
export async function parseWitsmlFileStreaming(xmlContent: string): Promise<StreamedWitsmlData> {
  return new Promise((resolve, reject) => {
    const fileSizeInMB = Buffer.byteLength(xmlContent, 'utf-8') / (1024 * 1024)
    console.log(`📄 Streaming parse for ${fileSizeInMB.toFixed(2)} MB file`)

    // Detect version from header
    const header = xmlContent.substring(0, 5000)
    const version = detectWitsmlVersionFromHeader(header)

    // Create a readable stream from the XML string
    const stream = Readable.from([xmlContent])
    const xml = new XmlStream(stream, {
      preserveMarkup: 0,
      trim: true,
      normalize: true,
      lowercase: false
    })

    // Result object - will build dynamically
    let rootData: any = null
    let rootName = ''
    const elementCounts = new Map<string, number>()

    // Preserve elements (don't flatten them)
    xml.preserve('witsml', true)
    xml.preserve('logs', true)
    xml.preserve('log', true)
    xml.preserve('logData', true)
    xml.preserve('data', true)
    xml.preserve('trajectoryStation', true)
    xml.preserve('station', true)

    // Listen for all element updates
    xml.on('updateElement', function(name: string, element: any) {
      // Count elements
      const count = (elementCounts.get(name) || 0) + 1
      elementCounts.set(name, count)

      // Log first occurrence of each element type
      if (count === 1) {
        console.log(`  📦 Found element: <${name}>`)
      }
    })

    // Capture the root WITSML structure
    xml.on('endElement: witsml', function(element: any) {
      rootData = element
      rootName = 'witsml'
      console.log(`  🌳 Captured root structure: <witsml>`)
    })

    // Fallback: capture logs directly
    xml.on('endElement: logs', function(element: any) {
      if (!rootData) {
        rootData = { logs: element }
        rootName = 'logs'
        console.log(`  🌳 Captured root structure: <logs>`)
      }
    })

    // Fallback: capture individual log
    xml.on('endElement: log', function(element: any) {
      if (!rootData) {
        rootData = { log: element }
        rootName = 'log'
        console.log(`  🌳 Captured root structure: <log>`)
      }
    })

    xml.on('error', (err: Error) => {
      console.error('❌ Streaming parse error:', err.message)
      reject(err)
    })

    xml.on('end', () => {
      // Log element summary
      console.log(`\n  📊 Element Summary:`)
      const sortedElements = Array.from(elementCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      sortedElements.forEach(([name, count]) => {
        console.log(`     - <${name}>: ${count} occurrences`)
      })

      // Determine object type
      let objectType = 'unknown'
      if (elementCounts.has('trajectoryStation') || elementCounts.has('station')) {
        objectType = 'trajectory'
      } else if (elementCounts.has('logData') || elementCounts.has('logCurveInfo')) {
        objectType = 'log'
      } else if (elementCounts.has('wellbore')) {
        objectType = 'wellbore'
      } else if (elementCounts.has('well')) {
        objectType = 'well'
      }

      // Sample large arrays in the final structure
      if (rootData) {
        rootData = sampleLargeArrays(rootData, 1000)
      }

      console.log(`✅ Streaming parse complete: ${version} ${objectType}`)
      console.log(`   Root element: <${rootName}>`)

      resolve({
        version,
        type: objectType,
        data: rootData || { empty: true },
        raw: '', // Never store raw for streamed files
        isStreamed: true,
      })
    })
  })
}

/**
 * Sample large arrays to prevent memory issues
 */
function sampleLargeArrays(obj: any, maxItems: number): any {
  if (Array.isArray(obj)) {
    if (obj.length > maxItems) {
      console.log(`  📉 Sampling array with ${obj.length} items down to ${maxItems}`)
      const step = Math.floor(obj.length / maxItems)
      const sampled = []
      for (let i = 0; i < obj.length; i += step) {
        sampled.push(sampleLargeArrays(obj[i], maxItems))
      }
      // Always include last item
      if (sampled.length < maxItems && obj.length > 0) {
        sampled.push(sampleLargeArrays(obj[obj.length - 1], maxItems))
      }
      return sampled
    }
    return obj.map(item => sampleLargeArrays(item, maxItems))
  } else if (typeof obj === 'object' && obj !== null) {
    const result: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = sampleLargeArrays(obj[key], maxItems)
      }
    }
    return result
  }
  return obj
}

function detectWitsmlVersionFromHeader(header: string): string {
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
