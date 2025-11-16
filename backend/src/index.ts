import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { detectFileFormat } from './parsers/formatDetector.js'
import { parseLASFile } from './parsers/lasParser.js'
import { parseWitsmlFile } from './parsers/witsmlParser.js'
import { parseWitsmlFileSAX } from './parsers/saxParser.js'
import { MudLogSchema } from './types/mudLogSchema.js'

const app = express()
const PORT = process.env.PORT || 5001

// File size thresholds
const STREAMING_THRESHOLD_MB = 200 // Use streaming parser for files > 200MB
const CHUNK_SIZE = 1000 // Rows per chunk

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 * 1024 } }) // 10GB limit

// Middleware
app.use(cors())
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ limit: '100mb', extended: true }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Universal Mud Logging Viewer API is running' })
})

// Upload and parse mud logging file (any format)
app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    // Handle multer errors
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'File too large',
          details: 'Maximum file size is 10GB.',
        })
      }
      return res.status(400).json({
        error: 'File upload error',
        details: err.message,
      })
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }

      const fileSizeInMB = req.file.size / (1024 * 1024)
      const filename = req.file.originalname
      const xmlContent = req.file.buffer.toString('utf-8')

      console.log(`\n📁 Processing file: ${filename} (${fileSizeInMB.toFixed(2)} MB)`)

      // Detect file format
      const detection = detectFileFormat(xmlContent, filename)
      console.log(`🔍 Detected format: ${detection.format} ${detection.version || ''} (confidence: ${(detection.confidence * 100).toFixed(0)}%)`)

      let parsedData: any

      // Route to appropriate parser
      switch (detection.format) {
        case 'LAS':
          parsedData = parseLASFile(xmlContent, CHUNK_SIZE)
          break

        case 'WITSML':
          // Always use SAX streaming parser for consistent format and better performance
          console.log(`🌊 Using SAX streaming parser (supports WITSML 1.x and 2.x)`)
          parsedData = await parseWitsmlFileSAX(xmlContent, CHUNK_SIZE)
          break

        case 'CSV':
          // TODO: Implement CSV parser
          return res.status(501).json({
            error: 'CSV format not yet implemented',
            details: 'CSV parser coming soon'
          })

        case 'DLIS':
          // TODO: Implement DLIS parser
          return res.status(501).json({
            error: 'DLIS format not yet implemented',
            details: 'DLIS is a binary format, parser coming soon'
          })

        default:
          return res.status(400).json({
            error: 'Unknown file format',
            details: `Could not detect a supported mud logging format. Detected: ${detection.format}`,
            suggestion: 'Supported formats: WITSML (.xml), LAS (.las), CSV (.csv)'
          })
      }

      res.json(parsedData)
    } catch (error: any) {
      console.error('❌ Error parsing file:', error)
      res.status(500).json({
        error: 'Failed to parse file',
        details: error.message,
      })
    }
  })
})

// Get data chunk (for pagination)
app.get('/api/data/chunk/:chunkIndex', (req, res) => {
  // TODO: Implement chunk retrieval from storage
  res.status(501).json({ error: 'Chunk retrieval not yet implemented' })
})

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Universal Mud Logging Viewer API`)
  console.log(`   Running on http://localhost:${PORT}`)
  console.log(`\n📊 Supported Formats:`)
  console.log(`   ✅ WITSML (all versions) - XML format`)
  console.log(`   ✅ LAS (2.0, 3.0) - Log ASCII Standard`)
  console.log(`   🚧 CSV - Coming soon`)
  console.log(`   🚧 DLIS - Coming soon`)
  console.log(`\n💾 File Size: Up to 10GB`)
  console.log(`📦 Chunking: ${CHUNK_SIZE} rows per chunk`)
  console.log(`🌊 Streaming: Enabled for files > ${STREAMING_THRESHOLD_MB}MB\n`)
})
