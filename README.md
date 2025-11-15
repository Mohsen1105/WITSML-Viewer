# WITSML Viewer

A comprehensive web-based WITSML (Wellsite Information Transfer Standard Markup Language) file viewer and monitor for drilling engineers. Supports multiple WITSML versions with advanced visualization capabilities.

## Features

### Multi-Version Support
- **WITSML 1.3.1** - Legacy format support
- **WITSML 1.4.1** - Enhanced 1.x series
- **WITSML 2.0** - Modern Energistics format
- **WITSML 2.1** - Latest standard

### Data Objects
Supports all WITSML objects including:
- Wells and Wellbores
- Logs (time-based and depth-based)
- Trajectories
- Mud Logs
- Rigs
- BHA Runs
- Cement Jobs
- And more...

### Visualization Capabilities

#### 1. Hierarchical Tree View
- Interactive tree structure of WITSML data
- Expandable/collapsible nodes
- Quick navigation through complex data

#### 2. Tabular Data Display
- Sortable and searchable tables
- Dynamic column generation
- Export-ready data views

#### 3. Log Plot Visualization
- Depth-based log curves
- Time-based log curves
- Multiple curve overlay
- Interactive charts with zoom/pan

#### 4. Trajectory Visualization
- **Vertical Section** - MD vs TVD plot
- **Plan View** - Northing vs Easting
- **Inclination Profile** - Deviation analysis
- **Azimuth Profile** - Directional drilling path

#### 5. 3D Wellbore Visualization
- Interactive 3D wellbore path
- Survey station markers
- Orbit controls (rotate, zoom, pan)
- Real-time rendering with Three.js

### File Monitoring
- Automatic file refresh at configurable intervals
- Real-time data updates
- Monitor drilling progress
- Adjustable refresh rates (1-300 seconds)

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **Recharts** - Data visualization
- **Three.js** & **React Three Fiber** - 3D rendering
- **TanStack Table** - Advanced table features
- **Lucide React** - Modern icons

### Backend
- **Node.js** with Express
- **TypeScript** - Type safety
- **fast-xml-parser** - High-performance XML parsing
- **Multer** - File upload handling

## Installation

### Prerequisites
- Node.js 18+ and npm
- Git

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/Mohsen1105/WITSML-Viewer.git
cd WITSML-Viewer
```

2. **Install dependencies**
```bash
npm run install:all
```

This will install dependencies for:
- Root workspace
- Frontend application
- Backend API

## Running the Application

### Development Mode

Start both frontend and backend concurrently:
```bash
npm run dev
```

Or run them separately:

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Health Check**: http://localhost:5001/api/health

## Usage

### 1. Upload a WITSML File

- Drag and drop a WITSML XML file into the upload area
- Or click to browse and select a file
- Supported file types: `.xml`

### 2. Explore the Data

Once uploaded, the viewer will:
1. Automatically detect the WITSML version
2. Parse and validate the file
3. Display the hierarchical structure in the tree view
4. Show file metadata (version, object type)

### 3. Navigate the Tree

- Click on folder icons to expand/collapse nodes
- Click on any node label to view details in the main panel
- Array elements show item counts as badges

### 4. Visualize Data

Depending on the object type, different visualization modes are available:

**For Log Objects:**
- Table View - Raw data in tabular format
- Log Plot - Curve visualization

**For Trajectory Objects:**
- Table View - Survey station data
- Trajectory Plot - 2D trajectory profiles
- 3D View - Interactive 3D wellbore path

### 5. Monitor Files

Enable file monitoring for real-time updates:

1. Click **Start Monitoring** button
2. Set refresh interval (in seconds)
3. The file will be re-parsed automatically
4. View updated data in real-time

Perfect for monitoring active drilling operations!

## Project Structure

```
WITSML-Viewer/
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── FileUpload.tsx
│   │   │   ├── WitsmlTreeView.tsx
│   │   │   ├── DataVisualization.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── LogPlot.tsx
│   │   │   ├── TrajectoryPlot.tsx
│   │   │   └── WellboreVisualization3D.tsx
│   │   ├── App.tsx           # Main application
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                   # Node.js backend API
│   ├── src/
│   │   ├── parsers/
│   │   │   └── witsmlParser.ts  # WITSML XML parser
│   │   └── index.ts          # Express server
│   ├── package.json
│   └── tsconfig.json
│
├── package.json              # Root workspace config
├── .gitignore
└── README.md
```

## API Endpoints

### Health Check
```
GET /api/health
```
Returns API status.

### Upload WITSML File
```
POST /api/upload
Content-Type: multipart/form-data
```
**Parameters:**
- `file` - WITSML XML file (max 50MB)

**Response:**
```json
{
  "version": "1.4.1",
  "type": "trajectory",
  "data": { ... },
  "raw": "<?xml version=\"1.0\"?> ..."
}
```

## WITSML Parser

The parser automatically:
- Detects WITSML version from namespace
- Handles version-specific structures
- Removes namespace prefixes for cleaner data
- Identifies object types
- Validates XML structure

### Supported Namespaces

- `http://www.witsml.org/schemas/131` - WITSML 1.3.1
- `http://www.witsml.org/schemas/1series` - WITSML 1.4.1
- `http://www.energistics.org/energyml/data/witsmlv2` - WITSML 2.x

## Building for Production

### Build both frontend and backend:
```bash
npm run build
```

### Build individually:
```bash
npm run build:frontend
npm run build:backend
```

### Start production server:
```bash
cd backend
npm start
```

Then serve the frontend build from `frontend/dist` using a static server or reverse proxy.

## Development Tips

### Adding New WITSML Object Support

1. Update `OBJECT_TYPES` in `backend/src/parsers/witsmlParser.ts`
2. Add version-specific parsing logic if needed
3. Create visualization components in `frontend/src/components/`

### Customizing Visualizations

- **Charts**: Modify Recharts configurations in plot components
- **3D Scene**: Adjust Three.js settings in `WellboreVisualization3D.tsx`
- **Tables**: Customize TanStack Table options in `DataTable.tsx`

### Performance Optimization

- Large files (>10MB) may take time to parse
- Consider pagination for tables with 1000+ rows
- 3D rendering is optimized for trajectories with <1000 stations

## Troubleshooting

### Port Already in Use

If ports 3000 or 5001 are in use:

**Frontend** - Edit `frontend/vite.config.ts`:
```ts
server: {
  port: 3001, // Change port
}
```

**Backend** - Set environment variable:
```bash
PORT=5002 npm run dev:backend
```

### CORS Errors

Ensure backend is running before frontend. The frontend proxies API requests to `http://localhost:5001`.

### File Upload Fails

- Check file size (max 50MB)
- Verify file is valid XML
- Check browser console for errors

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Acknowledgments

- **Energistics** - For WITSML standards
- **Oil & Gas Industry** - For wellsite data standardization
- **Open Source Community** - For amazing libraries and tools

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact: [Your contact information]

## Roadmap

Future enhancements:
- [ ] WITSML server connection (SOAP/REST APIs)
- [ ] Real-time data streaming
- [ ] Export to PDF/CSV
- [ ] Advanced filtering and search
- [ ] User authentication
- [ ] Data comparison tools
- [ ] Mobile responsive design
- [ ] Offline mode with caching

---

**Built for drilling engineers, by developers who care about data visualization.**
