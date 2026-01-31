#!/bin/bash

# Savage Cabinetry Platform Launcher
# Simple script to start the platform in different modes

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLATFORM_ENTRY="$SCRIPT_DIR/main_platform_entry.py"

# Default settings
MODE="help"
PORT=5000
HOST="localhost"

# Function to show usage
show_usage() {
    cat << EOF
🏗️  SAVAGE CABINETRY PLATFORM LAUNCHER
========================================

Usage: $0 [OPTIONS]

OPTIONS:
    -c, --cli           Launch in command-line mode
    -g, --gui           Launch GUI server
    -p, --port PORT     GUI server port (default: 5000)
    --host HOST         GUI server host (default: localhost)
    --no-browser        Don't open browser automatically
    -s, --status        Show platform status
    --setup             Run platform setup verification
    -h, --help          Show this help message

EXAMPLES:
    $0 --cli                # Start CLI mode
    $0 --gui                # Start GUI server
    $0 --gui --port 8000    # Start GUI on port 8000
    $0 --status             # Show platform status
    $0 --setup              # Run setup checks

EOF
}

# Function to check if Python is available
check_python() {
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 not found. Please install Python 3.8 or later."
        exit 1
    fi
}

# Function to check if platform files exist
check_platform() {
    if [[ ! -f "$PLATFORM_ENTRY" ]]; then
        echo "❌ Platform entry point not found: $PLATFORM_ENTRY"
        echo "   Make sure you're running from the platform root directory."
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--cli)
            MODE="cli"
            shift
            ;;
        -g|--gui)
            MODE="gui"
            shift
            ;;
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        --host)
            HOST="$2"
            shift 2
            ;;
        --no-browser)
            BROWSER_FLAG="--no-browser"
            shift
            ;;
        -s|--status)
            MODE="status"
            shift
            ;;
        --setup)
            MODE="setup"
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
check_python
check_platform

echo "🏗️  Savage Cabinetry Platform"
echo "============================"

case $MODE in
    "cli")
        echo "Command-line mode selected."
        echo "Type commands like: calculate --width 4800 --length 3600"
        echo "Type 'exit' or Ctrl+C to quit."
        echo ""

        # Start interactive CLI session
        python3 "$PLATFORM_ENTRY" --mode cli "$@"
        ;;

    "gui")
        echo "Starting GUI server on http://$HOST:$PORT"
        if [[ -z "$BROWSER_FLAG" ]]; then
            echo "Browser will open automatically..."
        fi
        echo "Press Ctrl+C to stop the server."
        echo ""

        # Start GUI server
        python3 "$PLATFORM_ENTRY" --mode gui --port "$PORT" --host "$HOST" $BROWSER_FLAG
        ;;

    "status")
        echo "Checking platform status..."
        echo ""
        python3 "$PLATFORM_ENTRY" --mode status
        ;;

    "setup")
        echo "Running platform setup checks..."
        echo ""
        python3 "$PLATFORM_ENTRY" --mode setup
        ;;

    "help"|*)
        python3 "$PLATFORM_ENTRY"
        ;;
esac