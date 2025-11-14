import { useMemo } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ZAxis } from 'recharts'
import './TrajectoryPlot.css'

interface TrajectoryPlotProps {
  data: any
  version: string
}

function TrajectoryPlot({ data, version }: TrajectoryPlotProps) {
  // Parse trajectory data
  const trajectoryData = useMemo(() => {
    if (!data) return []

    try {
      // WITSML 1.x format
      if (data.trajectoryStation) {
        const stations = Array.isArray(data.trajectoryStation)
          ? data.trajectoryStation
          : [data.trajectoryStation]

        return stations.map((station: any) => {
          // Extract values with proper type handling
          const md = parseFloat(station.md || station.$ ?.md || 0)
          const incl = parseFloat(station.incl || station.$ ?.incl || 0)
          const azi = parseFloat(station.azi || station.$ ?.azi || 0)
          const tvd = parseFloat(station.tvd || station.$ ?.tvd || md)

          // Calculate northing and easting from inclination and azimuth
          const inclRad = (incl * Math.PI) / 180
          const aziRad = (azi * Math.PI) / 180

          // Simplified directional calculations
          const northing = md * Math.sin(inclRad) * Math.cos(aziRad)
          const easting = md * Math.sin(inclRad) * Math.sin(aziRad)

          return {
            md,
            tvd,
            incl,
            azi,
            northing,
            easting,
          }
        })
      }

      // WITSML 2.x format
      if (data.location) {
        console.log('WITSML 2.x trajectory format detected')
        // Would need proper 2.x parsing
      }

      // Fallback
      if (Array.isArray(data)) {
        return data
      }
    } catch (error) {
      console.error('Error parsing trajectory data:', error)
    }

    return []
  }, [data])

  if (trajectoryData.length === 0) {
    return (
      <div className="no-data">
        <p>No trajectory data available</p>
        <p className="hint">Trajectory data should contain trajectoryStation elements</p>
      </div>
    )
  }

  return (
    <div className="trajectory-plot">
      <div className="plot-header">
        <h3>Wellbore Trajectory</h3>
        <p className="plot-info">{trajectoryData.length} survey stations</p>
      </div>

      <div className="plot-grid">
        {/* Vertical Section (TVD vs MD) */}
        <div className="plot-section">
          <h4>Vertical Section</h4>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="md"
                name="MD"
                label={{ value: 'Measured Depth (m)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                type="number"
                dataKey="tvd"
                name="TVD"
                reversed
                label={{ value: 'True Vertical Depth (m)', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis range={[50, 50]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Trajectory" data={trajectoryData} fill="#667eea" line={{ stroke: '#667eea', strokeWidth: 2 }} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Plan View (Northing vs Easting) */}
        <div className="plot-section">
          <h4>Plan View</h4>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="easting"
                name="Easting"
                label={{ value: 'Easting (m)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                type="number"
                dataKey="northing"
                name="Northing"
                label={{ value: 'Northing (m)', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis range={[50, 50]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Trajectory" data={trajectoryData} fill="#48bb78" line={{ stroke: '#48bb78', strokeWidth: 2 }} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Inclination Profile */}
        <div className="plot-section">
          <h4>Inclination Profile</h4>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="md"
                name="MD"
                label={{ value: 'Measured Depth (m)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                type="number"
                dataKey="incl"
                name="Inclination"
                label={{ value: 'Inclination (deg)', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis range={[50, 50]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Inclination" data={trajectoryData} fill="#f56565" line={{ stroke: '#f56565', strokeWidth: 2 }} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Azimuth Profile */}
        <div className="plot-section">
          <h4>Azimuth Profile</h4>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="md"
                name="MD"
                label={{ value: 'Measured Depth (m)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                type="number"
                dataKey="azi"
                name="Azimuth"
                domain={[0, 360]}
                label={{ value: 'Azimuth (deg)', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis range={[50, 50]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Azimuth" data={trajectoryData} fill="#ed8936" line={{ stroke: '#ed8936', strokeWidth: 2 }} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default TrajectoryPlot
