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
    const xml = new XmlStream(stream)

    // Result object
    const result: any = {
      version,
      type: 'unknown',
      metadata: {},
      wells: [],
      wellbores: [],
      logs: [],
      trajectories: [],
      logData: null,
      trajectoryStations: null,
    }

    let dataPointCount = 0
    const MAX_DATA_POINTS = 1000
    let samplingRate = 1

    // Collect elements but sample large arrays
    xml.collect('trajectoryStation')
    xml.collect('station')

    // Handle trajectory data
    xml.on('endElement: trajectoryStation', function (item: any) {
      if (!result.trajectoryStations) {
        result.trajectoryStations = []
      }

      // Sample trajectory data if too many points
      if (result.trajectoryStations.length < MAX_DATA_POINTS) {
        result.trajectoryStations.push(item)
      } else if (result.trajectoryStations.length === MAX_DATA_POINTS) {
        console.log(`  📉 Sampling trajectory data: keeping 1 in every ${samplingRate} stations`)
        samplingRate = 2
      } else if (dataPointCount % samplingRate === 0) {
        result.trajectoryStations.push(item)
      }
      dataPointCount++
    })

    // Handle log data
    xml.on('endElement: logData', function (item: any) {
      if (!result.logData) {
        result.logData = []
      }
      if (result.logData.length < MAX_DATA_POINTS) {
        result.logData.push(item)
      } else if (result.logData.length === MAX_DATA_POINTS) {
        console.log(`  📉 Sampling log data: keeping 1 in every ${samplingRate} rows`)
        samplingRate = 2
      } else if (dataPointCount % samplingRate === 0) {
        result.logData.push(item)
      }
      dataPointCount++
    })

    // Handle well/wellbore metadata
    xml.on('endElement: well', function (item: any) {
      result.wells.push(item)
    })

    xml.on('endElement: wellbore', function (item: any) {
      result.wellbores.push(item)
    })

    xml.on('endElement: log', function (item: any) {
      result.logs.push(item)
    })

    xml.on('endElement: trajectory', function (item: any) {
      result.trajectories.push(item)
    })

    xml.on('error', (err: Error) => {
      console.error('❌ Streaming parse error:', err.message)
      reject(err)
    })

    xml.on('end', () => {
      // Determine object type from collected data
      if (result.trajectoryStations || result.trajectories.length > 0) {
        result.type = 'trajectory'
      } else if (result.logData || result.logs.length > 0) {
        result.type = 'log'
      } else if (result.wellbores.length > 0) {
        result.type = 'wellbore'
      } else if (result.wells.length > 0) {
        result.type = 'well'
      }

      console.log(`✅ Streaming parse complete: ${version} ${result.type}`)
      console.log(`   Collected ${dataPointCount} total data points, stored ${Math.min(dataPointCount, MAX_DATA_POINTS + samplingRate * 100)}`)

      resolve({
        version,
        type: result.type,
        data: result,
        raw: '', // Never store raw for streamed files
        isStreamed: true,
      })
    })
  })
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
