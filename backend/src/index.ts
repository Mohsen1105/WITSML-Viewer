import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { parseWitsmlFile } from './parsers/witsmlParser.js'
import { parseWitsmlFileStreaming } from './parsers/streamingParser.js'

const app = express()
const PORT = process.env.PORT || 5001

// File size thresholds
const STREAMING_THRESHOLD_MB = 200 // Use streaming parser for files > 200MB

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } }) // 2GB limit

// Middleware
app.use(cors())
app.use(express.json({ limit: '2gb' }))
app.use(express.urlencoded({ limit: '2gb', extended: true }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'WITSML Viewer API is running' })
})

// Upload and parse WITSML file
app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    // Handle multer errors
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'File too large',
          details: 'Maximum file size is 2GB. Please try a smaller file.',
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
      const xmlContent = req.file.buffer.toString('utf-8')

      // Choose parser based on file size
      let parsedData
      if (fileSizeInMB > STREAMING_THRESHOLD_MB) {
        console.log(`🌊 Using streaming parser for ${fileSizeInMB.toFixed(2)} MB file`)
        parsedData = await parseWitsmlFileStreaming(xmlContent)
      } else {
        console.log(`📋 Using standard parser for ${fileSizeInMB.toFixed(2)} MB file`)
        parsedData = await parseWitsmlFile(xmlContent)
      }

      res.json(parsedData)
    } catch (error: any) {
      console.error('Error parsing WITSML file:', error)
      res.status(500).json({
        error: 'Failed to parse WITSML file',
        details: error.message,
      })
    }
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WITSML Viewer API running on http://localhost:${PORT}`)
  console.log(`📊 Ready to parse WITSML files (versions 1.3.1, 1.4.1, 2.0, 2.1)`)
  console.log(`📁 Maximum file size: 2GB`)
  console.log(`🌊 Streaming parser: Enabled for files > ${STREAMING_THRESHOLD_MB}MB`)
  console.log(`⚡ Memory-efficient mode for 1GB+ files`)
})
