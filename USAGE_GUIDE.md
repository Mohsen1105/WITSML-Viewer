# WITSML Viewer - Quick Start Guide

## How to Use the Application

### Starting the Application

1. **Start the Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5001`

2. **Start the Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

3. **Open your browser** and navigate to `http://localhost:3000`

### Viewing WITSML Files

#### Step 1: Upload Your File

Simply **drag and drop** your WITSML file into the upload area, or **click to browse** and select your file.

**Important**: Data will display **immediately** after upload. You do NOT need to click "Start Monitoring".

#### Step 2: View Your Data

After upload, you will see:
- **Sidebar**: File information (format, version, total rows, curves count)
- **Main Area**: Interactive data table with all curves/channels

#### Step 3: Select Curves to Display

- Click on **curve chips** to select/deselect which curves to display in the table
- Curves are color-coded by category:
  - 🟢 **Green** = Depth
  - 🟠 **Orange** = Time
  - 🔵 **Blue** = Drilling (ROP, WOB, RPM, etc.)
  - 🟤 **Brown** = Mud properties
  - 🔴 **Red** = Gas measurements
  - 🟣 **Purple** = Lithology
  - 🔷 **Teal** = Survey data

### File Monitoring (Optional)

The monitoring feature is **OPTIONAL** and only needed if you want to watch a file that's being updated in real-time (e.g., during active drilling).

**To enable monitoring**:
1. Upload your file first
2. Click "Start Monitoring"
3. The file will be re-uploaded every 5 seconds (or your chosen interval)
4. The display will update automatically

**Note**: For viewing static files, you do NOT need to use monitoring.

### Supported Features

✅ **WITSML Support**:
- WITSML 1.3.1
- WITSML 1.4.1
- WITSML 2.0
- WITSML 2.1
- Both depth-based and time-based indexing

✅ **File Size**: Up to 10GB (uses streaming parser)

✅ **LAS Support**: LAS 2.0 and 3.0 files

✅ **Data Display**:
- Interactive table view
- Sticky headers for easy scrolling
- Select/deselect curves
- Metadata display

### Troubleshooting

**Problem**: "Nothing displays after upload"
- **Check**: Did you wait for the upload to complete? Look for the loading spinner.
- **Check**: Is there an error message displayed?
- **Solution**: Open browser console (F12) and check for errors

**Problem**: "Upload is stuck in a loop"
- **Solution**: Click "Stop Monitoring" to stop automatic re-uploads
- **Note**: Monitoring is only needed for live files that are being updated

**Problem**: "File too large" error
- **Solution**: The app supports files up to 10GB. If you get this error, check if your file is corrupted or in an unsupported format.

**Problem**: "No curves/channels found"
- **Check**: Is your file a valid WITSML file with log data?
- **Check**: Does your file contain `<logData>` (WITSML 1.x) or `<ChannelSet>` (WITSML 2.x)?

### Example Workflow

1. Open `http://localhost:3000` in your browser
2. Drag and drop your WITSML file (e.g., `mudlog_1.xml`)
3. Wait 2-3 seconds for upload and parsing
4. **Data displays automatically** in the table
5. Click on curve names to select which ones to display
6. Scroll through your data
7. (Optional) Click "Start Monitoring" if the file is being updated in real-time

### Performance

- **Small files (<10MB)**: Parse in <1 second
- **Medium files (10-100MB)**: Parse in 1-5 seconds
- **Large files (100MB-1GB)**: Parse in 5-30 seconds
- **Very large files (1GB-10GB)**: Parse in 30-120 seconds

The SAX streaming parser ensures memory-efficient parsing even for multi-GB files.

### Data Format

The app normalizes all WITSML formats into a standard structure with:
- **Metadata**: Well name, wellbore name, operator, rig, etc.
- **Indexing**: Depth or time-based indexing
- **Curves**: Channel definitions with units and categories
- **Data**: Actual measurement values in chunks

This ensures consistent display regardless of WITSML version.

## Need Help?

If you encounter issues:
1. Check the browser console (F12) for errors
2. Check the backend terminal for server logs
3. Verify your file is a valid WITSML file
4. Try with a smaller test file first
