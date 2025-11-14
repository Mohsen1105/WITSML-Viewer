import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line, Text, Grid } from '@react-three/drei'
import * as THREE from 'three'
import './WellboreVisualization3D.css'

interface WellboreVisualization3DProps {
  data: any
  version: string
}

function Wellbore({ trajectoryData }: { trajectoryData: any[] }) {
  const lineRef = useRef<any>()

  // Convert trajectory data to 3D points
  const points = useMemo(() => {
    return trajectoryData.map((station) => {
      return new THREE.Vector3(
        station.easting || 0,
        -(station.tvd || 0), // Negative because depth goes down
        station.northing || 0
      )
    })
  }, [trajectoryData])

  // Animate rotation
  useFrame(() => {
    if (lineRef.current) {
      // Optional: Add subtle animation
    }
  })

  if (points.length === 0) return null

  return (
    <group>
      {/* Wellbore path */}
      <Line points={points} color="#667eea" lineWidth={3} />

      {/* Survey stations as spheres */}
      {points.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[2, 16, 16]} />
          <meshStandardMaterial color={index === 0 ? '#48bb78' : index === points.length - 1 ? '#f56565' : '#667eea'} />
        </mesh>
      ))}

      {/* Start label */}
      {points.length > 0 && (
        <Text position={[points[0].x, points[0].y + 20, points[0].z]} fontSize={10} color="#48bb78">
          Start
        </Text>
      )}

      {/* End label */}
      {points.length > 1 && (
        <Text
          position={[points[points.length - 1].x, points[points.length - 1].y - 20, points[points.length - 1].z]}
          fontSize={10}
          color="#f56565"
        >
          TD: {trajectoryData[trajectoryData.length - 1].md?.toFixed(1)}m
        </Text>
      )}
    </group>
  )
}

function WellboreVisualization3D({ data, version }: WellboreVisualization3DProps) {
  // Parse trajectory data
  const trajectoryData = useMemo(() => {
    if (!data) return []

    try {
      // WITSML 1.x format
      if (data.trajectoryStation) {
        const stations = Array.isArray(data.trajectoryStation) ? data.trajectoryStation : [data.trajectoryStation]

        return stations.map((station: any) => {
          const md = parseFloat(station.md || station.$ ?.md || 0)
          const incl = parseFloat(station.incl || station.$ ?.incl || 0)
          const azi = parseFloat(station.azi || station.$ ?.azi || 0)
          const tvd = parseFloat(station.tvd || station.$ ?.tvd || md)

          // Calculate northing and easting
          const inclRad = (incl * Math.PI) / 180
          const aziRad = (azi * Math.PI) / 180

          const northing = md * Math.sin(inclRad) * Math.cos(aziRad)
          const easting = md * Math.sin(inclRad) * Math.sin(aziRad)

          return { md, tvd, incl, azi, northing, easting }
        })
      }

      if (Array.isArray(data)) {
        return data
      }
    } catch (error) {
      console.error('Error parsing trajectory data for 3D:', error)
    }

    return []
  }, [data])

  if (trajectoryData.length === 0) {
    return (
      <div className="no-data">
        <p>No 3D trajectory data available</p>
        <p className="hint">Trajectory data with TVD, inclination, and azimuth is required</p>
      </div>
    )
  }

  // Calculate camera position based on wellbore extent
  const maxDepth = Math.max(...trajectoryData.map((s) => s.tvd))
  const cameraDistance = maxDepth * 1.5

  return (
    <div className="wellbore-3d">
      <div className="plot-header">
        <h3>3D Wellbore Visualization</h3>
        <p className="plot-info">
          {trajectoryData.length} stations • Max TVD: {maxDepth.toFixed(1)}m
        </p>
        <p className="controls-info">Use mouse to rotate, scroll to zoom</p>
      </div>

      <div className="canvas-container">
        <Canvas camera={{ position: [cameraDistance, -cameraDistance / 2, cameraDistance], fov: 50 }}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />

          {/* Grid */}
          <Grid
            args={[500, 500]}
            cellSize={50}
            cellColor="#6e6e6e"
            sectionSize={100}
            sectionColor="#9d4b4b"
            fadeDistance={1000}
            fadeStrength={1}
            position={[0, 0, 0]}
          />

          {/* Coordinate axes */}
          <axesHelper args={[100]} />

          {/* Wellbore */}
          <Wellbore trajectoryData={trajectoryData} />

          {/* Orbit controls */}
          <OrbitControls makeDefault />
        </Canvas>
      </div>

      <div className="legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#48bb78' }}></span>
          <span>Surface / KOP</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#667eea' }}></span>
          <span>Wellbore Path</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#f56565' }}></span>
          <span>Total Depth (TD)</span>
        </div>
      </div>
    </div>
  )
}

export default WellboreVisualization3D
