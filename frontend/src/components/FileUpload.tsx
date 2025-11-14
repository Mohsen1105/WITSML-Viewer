import { useCallback, useRef, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, RefreshCw, Play, Pause } from 'lucide-react'
import axios from 'axios'
import './FileUpload.css'
import { WitsmlData } from '../App'

interface FileUploadProps {
  onFileLoaded: (data: WitsmlData) => void
  refreshInterval: number
  onRefreshIntervalChange: (interval: number) => void
  isMonitoring: boolean
}

function FileUpload({ onFileLoaded, refreshInterval, onRefreshIntervalChange, isMonitoring }: FileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<number | null>(null)

  const uploadFile = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post<WitsmlData>('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      onFileLoaded(response.data)
      setUploadedFile(file)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload file')
      console.error('Upload error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [onFileLoaded])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0])
    }
  }, [uploadFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/xml': ['.xml'],
      'application/xml': ['.xml'],
    },
    multiple: false,
  })

  // File monitoring with refresh interval
  useEffect(() => {
    if (isMonitoring && uploadedFile && refreshInterval > 0) {
      intervalRef.current = window.setInterval(() => {
        uploadFile(uploadedFile)
      }, refreshInterval * 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isMonitoring, refreshInterval, uploadedFile, uploadFile])

  const toggleMonitoring = () => {
    onRefreshIntervalChange(isMonitoring ? 0 : 5)
  }

  return (
    <div className="file-upload">
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <Upload size={48} />
        {isDragActive ? (
          <p>Drop the WITSML file here...</p>
        ) : (
          <>
            <p>Drag & drop a WITSML file here</p>
            <p className="subtitle">or click to select file</p>
          </>
        )}
      </div>

      {isLoading && (
        <div className="loading">
          <RefreshCw className="spin" size={20} />
          <span>Loading...</span>
        </div>
      )}

      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}

      {uploadedFile && (
        <div className="file-info">
          <h4>Loaded File</h4>
          <p>{uploadedFile.name}</p>

          <div className="monitoring-controls">
            <h4>File Monitoring</h4>
            <div className="control-group">
              <button onClick={toggleMonitoring} className="monitor-btn">
                {isMonitoring ? <Pause size={16} /> : <Play size={16} />}
                <span>{isMonitoring ? 'Stop' : 'Start'} Monitoring</span>
              </button>
            </div>

            {isMonitoring && (
              <div className="interval-control">
                <label>
                  Refresh Interval (seconds):
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={refreshInterval}
                    onChange={(e) => onRefreshIntervalChange(Number(e.target.value))}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload
