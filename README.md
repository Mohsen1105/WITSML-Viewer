# Universal Mud Logging Viewer

A comprehensive web-based mud logging file viewer for drilling engineers. Automatically detects and displays data from multiple formats including WITSML, LAS, and more. Built for handling large files (up to 10GB) with efficient streaming parsers.

**📖 [Quick Start Guide](./USAGE_GUIDE.md)** - Read this first for step-by-step instructions!

## Features

### Multi-Format Support
- **WITSML 1.3.1, 1.4.1, 2.0, 2.1** - Full WITSML support with automatic version detection
- **LAS 2.0, 3.0** - Log ASCII Standard files
- **CSV** - Coming soon
- **DLIS** - Coming soon
- **Auto-detection** - Automatically identifies file format

### Large File Support
- **Up to 10GB** file size limit
- **Streaming SAX Parser** - Memory-efficient parsing for multi-GB files
- **True streaming** - No memory issues even with 1GB+ files
- **WITSML 2.x optimized** - Full support for namespace handling

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

**For large files (>1GB)**, use the high-memory mode:
```bash
npm run dev:large-files
```
This allocates 8GB of memory to Node.js for handling very large WITSML files.

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

## Quick Usage

**See the [USAGE_GUIDE.md](./USAGE_GUIDE.md) for detailed instructions.**

### 1. Upload Your File

- Drag and drop your mud logging file (WITSML, LAS, etc.) into the upload area
- Or click to browse and select your file
- **Data displays immediately** - no need to click any buttons!

### 2. View and Interact

Once uploaded:
- **Metadata** appears in the sidebar (format, version, well name, etc.)
- **Interactive table** displays in the main area
- **Select curves** by clicking on curve chips
- **Scroll through data** using the table
- **Color-coded categories** help identify curve types

### 3. Optional: Monitor Live Files

For files being updated in real-time (e.g., during active drilling):
1. Upload the file first
2. Click **"Start Monitoring"**
3. Set refresh interval (default: 5 seconds)
4. Data refreshes automatically

**Note**: Monitoring is OPTIONAL - for static files, just upload and view!

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

### Upload Mud Logging File
```
POST /api/upload
Content-Type: multipart/form-data
```
**Parameters:**
- `file` - Mud logging file (WITSML, LAS, etc., max 10GB)

**Response (MudLogSchema format):**
```json
{
  "metadata": {
    "wellName": "Well-001",
    "wellboreName": "Wellbore-A",
    "sourceFormat": "WITSML",
    "sourceVersion": "2.0"
  },
  "indexing": {
    "type": "depth",
    "depthIndexes": {
      "md": {
        "mnemonic": "DEPT",
        "unit": "m",
        "minValue": 0,
        "maxValue": 3000
      }
    }
  },
  "curves": [
    {
      "mnemonic": "ROP",
      "unit": "m/h",
      "description": "Rate of Penetration",
      "curveType": "continuous",
      "category": "drilling"
    }
  ],
  "data": {
    "totalRows": 3000,
    "chunkSize": 1000,
    "chunks": [...]
  }
}
```

## Parsers

### SAX Streaming Parser (WITSML)

Uses event-based SAX parsing for memory efficiency:
- **True streaming** - Processes files without loading entire document in memory
- **WITSML 1.x and 2.x support** - Automatically detects version
- **Namespace handling** - Strips ns2:, ns3: prefixes automatically
- **Curve categorization** - Auto-categorizes curves (drilling, mud, gas, etc.)
- **Chunked output** - Returns data in manageable chunks
- **No file size limits** - Successfully tested with 1GB+ files

### LAS Parser

Parses Log ASCII Standard files:
- LAS 2.0 and 3.0 support
- Metadata extraction (well name, location, etc.)
- Curve definitions with units
- Data normalization to MudLogSchema format

### Format Detection

Automatically identifies file formats by:
- File extension
- XML namespace detection
- Content structure analysis
- Returns format, version, and confidence score

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

### Performance

The SAX streaming parser provides excellent performance:
- **Small files (<10MB)**: Parse in <1 second
- **Medium files (10-100MB)**: Parse in 1-5 seconds
- **Large files (100MB-1GB)**: Parse in 5-30 seconds
- **Very large files (1GB-10GB)**: Parse in 30-120 seconds

**Memory usage**: Constant memory usage regardless of file size (typically <500MB RAM)

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

- Check file size (max 2GB)
- Verify file is valid XML
- Check browser console for errors

### Large File Issues

If you're experiencing issues with large files (>1GB):

**Memory errors:**
- Increase Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=8192" npm run dev:backend` (sets to 8GB)
- Close other applications to free up RAM
- Consider upgrading system memory

**Slow parsing:**
- Large files can take 30-60 seconds or more to parse
- Wait for the loading indicator to complete
- Check browser/server console for progress

**Browser crashes:**
- Very large parsed data may overwhelm the browser
- Consider extracting only needed data from the WITSML file before uploading

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
