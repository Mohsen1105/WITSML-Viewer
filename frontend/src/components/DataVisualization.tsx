import { useState } from 'react'
import DataTable from './DataTable'
import LogPlot from './LogPlot'
import TrajectoryPlot from './TrajectoryPlot'
import WellboreVisualization3D from './WellboreVisualization3D'
import './DataVisualization.css'

interface DataVisualizationProps {
  data: any
  witsmlVersion: string
}

type ViewMode = 'table' | 'logplot' | 'trajectory' | '3d'

function DataVisualization({ data, witsmlVersion }: DataVisualizationProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  // Detect data type from structure
  const detectDataType = () => {
    const label = data.label?.toLowerCase() || ''
    const dataObj = data.data || {}

    if (label.includes('log') || dataObj.logCurveInfo || dataObj.logData) {
      return 'log'
    }
    if (label.includes('trajectory') || dataObj.trajectoryStation) {
      return 'trajectory'
    }
    if (label.includes('wellbore') || label.includes('well')) {
      return 'wellbore'
    }
    return 'generic'
  }

  const dataType = detectDataType()

  // Determine available views based on data type
  const getAvailableViews = (): ViewMode[] => {
    const views: ViewMode[] = ['table']

    if (dataType === 'log') {
      views.push('logplot')
    }
    if (dataType === 'trajectory') {
      views.push('trajectory', '3d')
    }
    if (dataType === 'wellbore') {
      views.push('3d')
    }

    return views
  }

  const availableViews = getAvailableViews()

  // Ensure current view is available
  if (!availableViews.includes(viewMode)) {
    setViewMode('table')
  }

  return (
    <div className="data-visualization">
      <div className="visualization-header">
        <h2>{data.label}</h2>
        <div className="view-mode-selector">
          {availableViews.includes('table') && (
            <button
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
            >
              Table View
            </button>
          )}
          {availableViews.includes('logplot') && (
            <button
              className={viewMode === 'logplot' ? 'active' : ''}
              onClick={() => setViewMode('logplot')}
            >
              Log Plot
            </button>
          )}
          {availableViews.includes('trajectory') && (
            <button
              className={viewMode === 'trajectory' ? 'active' : ''}
              onClick={() => setViewMode('trajectory')}
            >
              Trajectory Plot
            </button>
          )}
          {availableViews.includes('3d') && (
            <button
              className={viewMode === '3d' ? 'active' : ''}
              onClick={() => setViewMode('3d')}
            >
              3D View
            </button>
          )}
        </div>
      </div>

      <div className="visualization-content">
        {viewMode === 'table' && <DataTable data={data.data} />}
        {viewMode === 'logplot' && <LogPlot data={data.data} version={witsmlVersion} />}
        {viewMode === 'trajectory' && <TrajectoryPlot data={data.data} version={witsmlVersion} />}
        {viewMode === '3d' && <WellboreVisualization3D data={data.data} version={witsmlVersion} />}
      </div>
    </div>
  )
}

export default DataVisualization
