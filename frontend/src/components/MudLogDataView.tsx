import { useState } from 'react'
import './MudLogDataView.css'

interface MudLogSchema {
  metadata: {
    wellName: string
    wellboreName: string
    operator?: string
    rig?: string
    field?: string
    country?: string
    startDate?: string
    endDate?: string
    sourceFormat: string
    sourceVersion?: string
  }
  indexing: {
    type: 'depth' | 'time'
    depthIndexes?: {
      md?: { mnemonic: string; unit: string; minValue: number; maxValue: number }
      tvd?: { mnemonic: string; unit: string; minValue: number; maxValue: number }
    }
    timeIndex?: { mnemonic: string; unit: string; minValue: number; maxValue: number }
  }
  curves: Array<{
    mnemonic: string
    description: string
    unit: string
    curveType: string
    category: string
    minValue?: number
    maxValue?: number
  }>
  data: {
    totalRows: number
    chunkSize: number
    chunks: Array<{
      chunkIndex: number
      startIndex: number
      endIndex: number
      rowCount: number
      rows: Array<{
        index: number | string
        values: Record<string, number | string | null>
      }>
    }>
  }
}

interface Props {
  data: MudLogSchema
}

export default function MudLogDataView({ data }: Props) {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')
  const [selectedCurves, setSelectedCurves] = useState<Set<string>>(
    new Set(data.curves.slice(0, 5).map(c => c.mnemonic))
  )

  const toggleCurve = (mnemonic: string) => {
    const newSet = new Set(selectedCurves)
    if (newSet.has(mnemonic)) {
      newSet.delete(mnemonic)
    } else {
      newSet.add(mnemonic)
    }
    setSelectedCurves(newSet)
  }

  const allRows = data.data.chunks.flatMap(chunk => chunk.rows)
  const visibleCurves = data.curves.filter(c => selectedCurves.has(c.mnemonic))

  return (
    <div className="mud-log-data-view">
      <div className="data-header">
        <div className="metadata-section">
          <h2>Mud Logging Data</h2>
          <div className="metadata-grid">
            <div className="metadata-item">
              <strong>Well:</strong> {data.metadata.wellName}
            </div>
            <div className="metadata-item">
              <strong>Wellbore:</strong> {data.metadata.wellboreName}
            </div>
            {data.metadata.operator && (
              <div className="metadata-item">
                <strong>Operator:</strong> {data.metadata.operator}
              </div>
            )}
            {data.metadata.rig && (
              <div className="metadata-item">
                <strong>Rig:</strong> {data.metadata.rig}
              </div>
            )}
            <div className="metadata-item">
              <strong>Format:</strong> {data.metadata.sourceFormat} {data.metadata.sourceVersion}
            </div>
            <div className="metadata-item">
              <strong>Index Type:</strong> {data.indexing.type}
            </div>
            <div className="metadata-item">
              <strong>Total Rows:</strong> {data.data.totalRows.toLocaleString()}
            </div>
            <div className="metadata-item">
              <strong>Displayed Rows:</strong> {allRows.length.toLocaleString()}
            </div>
          </div>

          {data.indexing.depthIndexes?.md && (
            <div className="index-info">
              <strong>Depth Range:</strong> {data.indexing.depthIndexes.md.minValue.toFixed(2)} - {data.indexing.depthIndexes.md.maxValue.toFixed(2)} {data.indexing.depthIndexes.md.unit}
            </div>
          )}
        </div>

        <div className="view-controls">
          <button
            className={viewMode === 'table' ? 'active' : ''}
            onClick={() => setViewMode('table')}
          >
            Table View
          </button>
          <button
            className={viewMode === 'chart' ? 'active' : ''}
            onClick={() => setViewMode('chart')}
          >
            Chart View
          </button>
        </div>
      </div>

      <div className="curve-selector">
        <h3>Curves ({data.curves.length})</h3>
        <div className="curve-chips">
          {data.curves.map(curve => (
            <div
              key={curve.mnemonic}
              className={`curve-chip ${selectedCurves.has(curve.mnemonic) ? 'selected' : ''} category-${curve.category}`}
              onClick={() => toggleCurve(curve.mnemonic)}
            >
              <strong>{curve.mnemonic}</strong>
              {curve.unit && <span className="unit">({curve.unit})</span>}
              <div className="curve-description">{curve.description}</div>
              <div className="curve-category">{curve.category}</div>
            </div>
          ))}
        </div>
      </div>

      {viewMode === 'table' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="index-column">
                  {data.indexing.type === 'depth' ? 'Depth' : 'Time'}
                  {data.indexing.depthIndexes?.md && (
                    <span className="unit-label"> ({data.indexing.depthIndexes.md.unit})</span>
                  )}
                </th>
                {visibleCurves.map(curve => (
                  <th key={curve.mnemonic}>
                    <div className="column-header">
                      <strong>{curve.mnemonic}</strong>
                      {curve.unit && <span className="unit-label">({curve.unit})</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allRows.map((row, idx) => (
                <tr key={idx}>
                  <td className="index-column">{typeof row.index === 'number' ? row.index.toFixed(2) : row.index}</td>
                  {visibleCurves.map(curve => {
                    const value = row.values[curve.mnemonic]
                    return (
                      <td key={curve.mnemonic}>
                        {value !== null && value !== undefined
                          ? typeof value === 'number'
                            ? value.toFixed(2)
                            : value
                          : '-'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'chart' && (
        <div className="chart-view">
          <p>Chart visualization coming soon...</p>
          <p>Selected curves: {Array.from(selectedCurves).join(', ')}</p>
        </div>
      )}
    </div>
  )
}
