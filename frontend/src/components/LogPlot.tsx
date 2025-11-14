import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './LogPlot.css'

interface LogPlotProps {
  data: any
  version: string
}

function LogPlot({ data, version }: LogPlotProps) {
  // Parse log data based on WITSML version
  const chartData = useMemo(() => {
    if (!data) return []

    try {
      // WITSML 1.x format
      if (data.logData || data.logCurveInfo) {
        const curves = data.logCurveInfo || []
        const logDataEntries = data.logData || []

        // Extract curve names (mnemonics)
        const curveNames = Array.isArray(curves)
          ? curves.map((c: any) => c.mnemonic || c.$ ?.mnemonic || '')
          : []

        // Parse log data rows
        if (Array.isArray(logDataEntries)) {
          return logDataEntries.flatMap((entry: any) => {
            const dataRows = entry.data || entry.$ ?.data || []
            return Array.isArray(dataRows)
              ? dataRows.map((row: string) => {
                  const values = row.split(',').map((v) => parseFloat(v.trim()))
                  const dataPoint: any = {}
                  curveNames.forEach((name: string, idx: number) => {
                    dataPoint[name] = isNaN(values[idx]) ? null : values[idx]
                  })
                  return dataPoint
                })
              : []
          })
        }
      }

      // WITSML 2.x format (simplified - would need proper parsing)
      if (data.channelSet) {
        // Handle WITSML 2.x channel-based format
        console.log('WITSML 2.x format detected - parsing not yet fully implemented')
      }

      // Fallback: try to use data as-is if it's already in array format
      if (Array.isArray(data)) {
        return data
      }
    } catch (error) {
      console.error('Error parsing log data:', error)
    }

    return []
  }, [data])

  // Extract curve names for plotting
  const curveNames = useMemo(() => {
    if (chartData.length === 0) return []
    return Object.keys(chartData[0]).filter((key) => key !== 'index')
  }, [chartData])

  // Colors for different curves
  const colors = ['#667eea', '#f56565', '#48bb78', '#ed8936', '#9f7aea', '#38b2ac']

  if (chartData.length === 0 || curveNames.length === 0) {
    return (
      <div className="no-data">
        <p>No log curve data available</p>
        <p className="hint">Log data should contain logCurveInfo and logData elements</p>
      </div>
    )
  }

  // Determine if this is depth-based or time-based
  const indexKey = curveNames[0] // First curve is usually the index (MD, TVD, or time)
  const isDepthLog = indexKey?.toLowerCase().includes('md') || indexKey?.toLowerCase().includes('depth')

  return (
    <div className="log-plot">
      <div className="plot-header">
        <h3>Log Curves</h3>
        <p className="plot-info">
          {isDepthLog ? 'Depth-based log' : 'Time-based log'} • {chartData.length} data points • {curveNames.length}{' '}
          curves
        </p>
      </div>

      <ResponsiveContainer width="100%" height={600}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={indexKey}
            label={{ value: indexKey, position: 'insideBottom', offset: -5 }}
            type="number"
            domain={['auto', 'auto']}
          />
          <YAxis label={{ value: 'Value', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          {curveNames.slice(1).map((curveName, idx) => (
            <Line
              key={curveName}
              type="monotone"
              dataKey={curveName}
              stroke={colors[idx % colors.length]}
              dot={false}
              strokeWidth={2}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="curve-list">
        <h4>Available Curves:</h4>
        <ul>
          {curveNames.map((name, idx) => (
            <li key={name}>
              <span className="curve-indicator" style={{ backgroundColor: colors[idx % colors.length] }}></span>
              {name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default LogPlot
