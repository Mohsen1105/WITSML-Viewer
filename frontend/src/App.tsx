import { useState, useCallback } from 'react'
import FileUpload from './components/FileUpload'
import WitsmlTreeView from './components/WitsmlTreeView'
import DataVisualization from './components/DataVisualization'
import MudLogDataView from './components/MudLogDataView'
import './App.css'

export interface WitsmlData {
  version: string
  type: string
  data: any
  raw: string
}

// Type guard for MudLogSchema
function isMudLogSchema(data: any): boolean {
  return data &&
    typeof data.metadata === 'object' &&
    typeof data.indexing === 'object' &&
    Array.isArray(data.curves) &&
    typeof data.data === 'object' &&
    Array.isArray(data.data.chunks)
}

function App() {
  const [witsmlData, setWitsmlData] = useState<WitsmlData | null>(null)
  const [selectedObject, setSelectedObject] = useState<any>(null)
  const [refreshInterval, setRefreshInterval] = useState<number>(0)
  const [isMonitoring, setIsMonitoring] = useState(false)

  const handleFileLoaded = useCallback((data: WitsmlData) => {
    setWitsmlData(data)
    setSelectedObject(null)
  }, [])

  const handleObjectSelect = useCallback((obj: any) => {
    setSelectedObject(obj)
  }, [])

  const handleRefreshIntervalChange = (interval: number) => {
    setRefreshInterval(interval)
    setIsMonitoring(interval > 0)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Universal Mud Logging Viewer</h1>
        <p>Multi-format mud logging file viewer for drilling engineers - WITSML, LAS, and more</p>
      </header>

      <div className="app-container">
        <aside className="sidebar">
          <FileUpload
            onFileLoaded={handleFileLoaded}
            refreshInterval={refreshInterval}
            onRefreshIntervalChange={handleRefreshIntervalChange}
            isMonitoring={isMonitoring}
          />

          {witsmlData && isMudLogSchema(witsmlData.data) && (
            <div className="metadata">
              <h3>File Information</h3>
              <p><strong>Format:</strong> {witsmlData.data.metadata.sourceFormat} {witsmlData.data.metadata.sourceVersion}</p>
              <p><strong>Index Type:</strong> {witsmlData.data.indexing.type}</p>
              <p><strong>Total Rows:</strong> {witsmlData.data.data.totalRows.toLocaleString()}</p>
              <p><strong>Curves:</strong> {witsmlData.data.curves.length}</p>
            </div>
          )}

          {witsmlData && !isMudLogSchema(witsmlData.data) && (
            <div className="metadata">
              <h3>File Information</h3>
              <p><strong>WITSML Version:</strong> {witsmlData.version}</p>
              <p><strong>Object Type:</strong> {witsmlData.type}</p>
              {!witsmlData.raw && (
                <p className="warning-note">
                  <strong>Note:</strong> Large file detected. Arrays with &gt;1000 items have been sampled for performance.
                </p>
              )}
            </div>
          )}

          {witsmlData && !isMudLogSchema(witsmlData.data) && (
            <WitsmlTreeView
              data={witsmlData.data}
              onSelectObject={handleObjectSelect}
            />
          )}
        </aside>

        <main className="main-content">
          {!witsmlData && (
            <div className="welcome">
              <h2>Welcome to Universal Mud Logging Viewer</h2>
              <p>Upload a mud logging file to get started</p>
              <ul>
                <li>Supports WITSML (1.3.1, 1.4.1, 2.0, 2.1)</li>
                <li>Supports LAS (2.0, 3.0)</li>
                <li>Auto-detects file format</li>
                <li>Handles files up to 10GB</li>
                <li>Depth-based and time-based indexing</li>
                <li>Interactive data visualization</li>
              </ul>
            </div>
          )}

          {witsmlData && isMudLogSchema(witsmlData.data) && (
            <MudLogDataView data={witsmlData.data} />
          )}

          {witsmlData && !isMudLogSchema(witsmlData.data) && !selectedObject && (
            <div className="info">
              <h2>Select an object from the tree to view details</h2>
            </div>
          )}

          {witsmlData && !isMudLogSchema(witsmlData.data) && selectedObject && (
            <DataVisualization
              data={selectedObject}
              witsmlVersion={witsmlData?.version || ''}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
