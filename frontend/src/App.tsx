import { useState, useCallback } from 'react'
import FileUpload from './components/FileUpload'
import WitsmlTreeView from './components/WitsmlTreeView'
import DataVisualization from './components/DataVisualization'
import './App.css'

export interface WitsmlData {
  version: string
  type: string
  data: any
  raw: string
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
        <h1>WITSML Viewer</h1>
        <p>Multi-version WITSML file viewer and monitor for drilling engineers</p>
      </header>

      <div className="app-container">
        <aside className="sidebar">
          <FileUpload
            onFileLoaded={handleFileLoaded}
            refreshInterval={refreshInterval}
            onRefreshIntervalChange={handleRefreshIntervalChange}
            isMonitoring={isMonitoring}
          />

          {witsmlData && (
            <div className="metadata">
              <h3>File Information</h3>
              <p><strong>WITSML Version:</strong> {witsmlData.version}</p>
              <p><strong>Object Type:</strong> {witsmlData.type}</p>
            </div>
          )}

          {witsmlData && (
            <WitsmlTreeView
              data={witsmlData.data}
              onSelectObject={handleObjectSelect}
            />
          )}
        </aside>

        <main className="main-content">
          {!witsmlData && (
            <div className="welcome">
              <h2>Welcome to WITSML Viewer</h2>
              <p>Upload a WITSML file to get started</p>
              <ul>
                <li>Supports WITSML versions 1.3.1, 1.4.1, 2.0, and 2.1</li>
                <li>View all WITSML objects in a hierarchical tree</li>
                <li>Visualize logs, trajectories, and wellbore data</li>
                <li>Monitor files with automatic refresh intervals</li>
                <li>3D wellbore visualization</li>
              </ul>
            </div>
          )}

          {witsmlData && !selectedObject && (
            <div className="info">
              <h2>Select an object from the tree to view details</h2>
            </div>
          )}

          {selectedObject && (
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
