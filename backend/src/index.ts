import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { parseWitsmlFile } from './parsers/witsmlParser.js'

const app = express()
const PORT = process.env.PORT || 5001

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } }) // 200MB limit

// Middleware
app.use(cors())
app.use(express.json({ limit: '200mb' }))
app.use(express.urlencoded({ limit: '200mb', extended: true }))

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
          details: 'Maximum file size is 200MB. Please try a smaller file.',
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

      // Parse the WITSML XML file
      const xmlContent = req.file.buffer.toString('utf-8')
      const parsedData = await parseWitsmlFile(xmlContent)

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
  console.log(`📁 Maximum file size: 200MB`)
})
