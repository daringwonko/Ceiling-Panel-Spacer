# Setting Up the Fancy React Dashboard

## Complete Step-by-Step Guide for Beginners

This guide will walk you through setting up the full Ceiling Panel Calculator with the React dashboard. Don't worry if you're new to this - I'll explain every step!

---

## What We're Setting Up

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR BROWSER                          │
│              http://localhost:5173                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │         React Dashboard (Frontend)               │    │
│  │  • Beautiful UI with Tailwind CSS               │    │
│  │  • Real-time panel preview                      │    │
│  │  • Project management                           │    │
│  │  • 3D visualization                             │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Flask API (Backend)                      │    │
│  │              http://localhost:5000               │    │
│  │  • Calculations                                  │    │
│  │  • Data storage                                  │    │
│  │  • File exports                                  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

You'll need **two terminal windows** - one for the backend, one for the frontend.

---

## Prerequisites Checklist

Before we start, make sure you have these installed:

### 1. Python (version 3.8 or higher)

**Check if you have it:**
```bash
python --version
```
or
```bash
python3 --version
```

You should see something like `Python 3.10.x` or similar.

**If you don't have it:** Download from https://www.python.org/downloads/

---

### 2. Node.js (version 18 or higher)

**Check if you have it:**
```bash
node --version
```

You should see something like `v18.x.x` or `v20.x.x`.

**If you don't have it:** Download from https://nodejs.org/ (choose the LTS version)

---

### 3. npm (comes with Node.js)

**Check if you have it:**
```bash
npm --version
```

You should see something like `9.x.x` or `10.x.x`.

---

## Step-by-Step Setup

### STEP 1: Open Your Project Folder

Open a terminal/command prompt and navigate to your project:

```bash
cd /path/to/Ceiling-Panel-Spacer
```

For example, if it's on your Desktop:
- **Mac/Linux:** `cd ~/Desktop/Ceiling-Panel-Spacer`
- **Windows:** `cd C:\Users\YourName\Desktop\Ceiling-Panel-Spacer`

---

### STEP 2: Set Up the Python Backend

#### 2a. Create a virtual environment (recommended)

This keeps your project's packages separate from other Python projects.

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` at the start of your command line now.

#### 2b. Install Python packages

```bash
pip install flask flask-cors
```

**What this does:**
- `flask` - The web server for our API
- `flask-cors` - Allows the React frontend to talk to the Flask backend

#### 2c. Start the backend server

```bash
python run_app.py
```

**You should see:**
```
==================================================
  CEILING PANEL CALCULATOR
==================================================

  Open your browser to:
  --> http://localhost:5000

  Press Ctrl+C to stop the server
==================================================
```

**KEEP THIS TERMINAL OPEN!** The backend needs to stay running.

---

### STEP 3: Set Up the React Frontend

#### 3a. Open a NEW terminal window

Keep the first terminal running the backend. Open a second terminal.

Navigate to the project folder again:
```bash
cd /path/to/Ceiling-Panel-Spacer
```

#### 3b. Go to the frontend folder

```bash
cd frontend
```

#### 3c. Install frontend dependencies

```bash
npm install
```

**This will take a minute.** You'll see a progress bar and lots of text. This is normal!

If you see warnings (yellow text), that's usually fine. Only red errors are problems.

#### 3d. Start the frontend development server

```bash
npm run dev
```

**You should see:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
  ➜  press h + enter to show help
```

---

### STEP 4: Open the Dashboard!

Open your web browser and go to:

```
http://localhost:5173
```

🎉 **You should see the fancy React dashboard!**

---

## Troubleshooting Common Issues

### "command not found: python"
Try `python3` instead of `python`.

### "command not found: npm"
Node.js isn't installed. Download it from https://nodejs.org/

### "EACCES permission denied"
On Mac/Linux, you might need to fix npm permissions:
```bash
sudo chown -R $(whoami) ~/.npm
```

### "Port 5000 already in use"
Something else is using port 5000. Either:
1. Close the other application, or
2. Edit `run_app.py` and change `port=5000` to `port=5001`

### "Network Error" or "CORS error" in the browser
Make sure the Flask backend is running (Step 2c).

### Frontend shows but no data loads
1. Check that the backend is running (terminal from Step 2c)
2. Check the browser console (F12 → Console tab) for errors
3. Make sure both servers are on the correct ports:
   - Backend: http://localhost:5000
   - Frontend: http://localhost:5173

### "Module not found" error in Python
Make sure you're in the virtual environment:
```bash
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows
```

---

## Quick Reference: Starting Everything

After the initial setup, here's how to start everything in the future:

### Terminal 1 (Backend):
```bash
cd /path/to/Ceiling-Panel-Spacer
source venv/bin/activate  # or venv\Scripts\activate on Windows
python run_app.py
```

### Terminal 2 (Frontend):
```bash
cd /path/to/Ceiling-Panel-Spacer/frontend
npm run dev
```

### Browser:
```
http://localhost:5173
```

---

## What Each Part Does

| Component | URL | Purpose |
|-----------|-----|---------|
| Flask Backend | http://localhost:5000 | API, calculations, data |
| React Frontend | http://localhost:5173 | Beautiful UI, visualizations |
| Simple Version | http://localhost:5000 | All-in-one (no React needed) |

---

## Stopping the Servers

To stop either server, go to its terminal and press:
```
Ctrl + C
```

---

## Next Steps

Once you have it running:

1. **Try the Calculator** - Enter dimensions and see the panel layout
2. **Create a Project** - Save your ceiling configurations
3. **Export Files** - Generate SVG, DXF, or 3D files
4. **Explore Materials** - Browse the material library

---

## Still Stuck?

If something isn't working:

1. Make sure both terminals are running (backend AND frontend)
2. Check for error messages in both terminals
3. Check the browser console (F12 → Console)
4. Try refreshing the browser (Ctrl+R or Cmd+R)

Feel free to come back with any error messages you see, and I'll help you troubleshoot!

---

## File Structure Reference

```
Ceiling-Panel-Spacer/
├── run_app.py          ← Simple all-in-one version
├── api/                ← Full API (advanced)
│   └── app.py
├── frontend/           ← React dashboard
│   ├── package.json    ← Frontend dependencies
│   ├── src/
│   │   ├── App.jsx     ← Main React component
│   │   └── components/ ← UI components
│   └── ...
├── core/               ← Core calculation engine
├── venv/               ← Python virtual environment (created by you)
└── ...
```

---

**Good luck! You've got this! 🚀**
