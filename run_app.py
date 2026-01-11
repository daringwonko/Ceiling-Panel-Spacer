#!/usr/bin/env python3
"""
Ceiling Panel Calculator - Simple All-in-One App

Just run: python run_app.py
Then open: http://localhost:5000

No npm, no React build, no complexity - just Python!
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__)

# Try to import the core calculator
try:
    from core.ceiling_panel_calc import CeilingPanelCalculator, Dimensions, Gap, Material, MATERIALS
    CALCULATOR_AVAILABLE = True
except ImportError:
    CALCULATOR_AVAILABLE = False
    print("Note: Core calculator not found, using simplified version")


# ============== Simple Calculator (fallback) ==============

def simple_calculate(length_mm, width_mm, perimeter_gap=200, panel_gap=50, max_panel_size=2400):
    """Simple panel calculation."""
    available_length = length_mm - 2 * perimeter_gap
    available_width = width_mm - 2 * perimeter_gap

    # Calculate optimal panel count
    panels_x = max(1, int((available_width + panel_gap) / (max_panel_size + panel_gap)))
    panels_y = max(1, int((available_length + panel_gap) / (max_panel_size + panel_gap)))

    # Calculate actual panel dimensions
    panel_width = (available_width - (panels_x - 1) * panel_gap) / panels_x
    panel_height = (available_length - (panels_y - 1) * panel_gap) / panels_y

    total_panels = panels_x * panels_y
    panel_area = panel_width * panel_height * total_panels / 1_000_000  # sqm
    ceiling_area = length_mm * width_mm / 1_000_000
    efficiency = (panel_area / ceiling_area) * 100

    return {
        'panels_x': panels_x,
        'panels_y': panels_y,
        'panel_width_mm': round(panel_width, 1),
        'panel_height_mm': round(panel_height, 1),
        'total_panels': total_panels,
        'coverage_sqm': round(panel_area, 2),
        'ceiling_area_sqm': round(ceiling_area, 2),
        'efficiency_percent': round(efficiency, 1)
    }


# ============== HTML Frontend (embedded) ==============

HTML_PAGE = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ceiling Panel Calculator</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: #e2e8f0;
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #60a5fa, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle { text-align: center; color: #94a3b8; margin-bottom: 30px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
        .card {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 24px;
        }
        .card h2 {
            font-size: 1.25rem;
            margin-bottom: 20px;
            color: #f1f5f9;
        }
        .form-group { margin-bottom: 16px; }
        label {
            display: block;
            font-size: 0.875rem;
            color: #94a3b8;
            margin-bottom: 6px;
        }
        input, select {
            width: 100%;
            padding: 10px 14px;
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 8px;
            color: #e2e8f0;
            font-size: 1rem;
        }
        input:focus, select:focus {
            outline: none;
            border-color: #3b82f6;
        }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        button {
            width: 100%;
            padding: 12px 20px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
        }
        button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .results { margin-top: 20px; }
        .result-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #334155;
        }
        .result-item:last-child { border-bottom: none; }
        .result-label { color: #94a3b8; }
        .result-value { font-weight: 600; color: #60a5fa; }
        .preview-container {
            background: #0f172a;
            border-radius: 8px;
            padding: 20px;
            min-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #preview-svg { max-width: 100%; height: auto; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; }
        .stat-card {
            background: #0f172a;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
        }
        .stat-value { font-size: 1.5rem; font-weight: 700; color: #60a5fa; }
        .stat-label { font-size: 0.75rem; color: #64748b; margin-top: 4px; }
        .error { color: #f87171; padding: 12px; background: rgba(248, 113, 113, 0.1); border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Ceiling Panel Calculator</h1>
        <p class="subtitle">Professional ceiling panel layout design tool</p>

        <div class="grid">
            <div class="card">
                <h2>Input Parameters</h2>
                <div class="form-group">
                    <label>Ceiling Dimensions</label>
                    <div class="row">
                        <div>
                            <input type="number" id="length" value="5000" min="100" placeholder="Length (mm)">
                        </div>
                        <div>
                            <input type="number" id="width" value="4000" min="100" placeholder="Width (mm)">
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label>Spacing</label>
                    <div class="row">
                        <div>
                            <input type="number" id="perimeter" value="200" min="0" placeholder="Perimeter Gap (mm)">
                        </div>
                        <div>
                            <input type="number" id="panelGap" value="50" min="0" placeholder="Panel Gap (mm)">
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label>Max Panel Size (mm)</label>
                    <input type="number" id="maxPanel" value="1200" min="100" max="2400">
                </div>

                <button id="calculateBtn" onclick="calculate()">Calculate Layout</button>

                <div id="results" class="results" style="display: none;"></div>
                <div id="error" class="error" style="display: none;"></div>
            </div>

            <div class="card">
                <h2>Layout Preview</h2>
                <div class="preview-container">
                    <div id="preview">
                        <svg id="preview-svg" viewBox="0 0 400 320">
                            <rect x="20" y="20" width="360" height="280" fill="#334155" rx="4"/>
                            <text x="200" y="165" text-anchor="middle" fill="#64748b" font-size="14">
                                Enter dimensions and click Calculate
                            </text>
                        </svg>
                    </div>
                </div>
                <div id="stats" class="stats-grid" style="display: none;"></div>
            </div>
        </div>
    </div>

    <script>
        async function calculate() {
            const btn = document.getElementById('calculateBtn');
            const results = document.getElementById('results');
            const error = document.getElementById('error');
            const stats = document.getElementById('stats');

            btn.disabled = true;
            btn.textContent = 'Calculating...';
            error.style.display = 'none';

            const data = {
                length_mm: parseFloat(document.getElementById('length').value) || 5000,
                width_mm: parseFloat(document.getElementById('width').value) || 4000,
                perimeter_gap_mm: parseFloat(document.getElementById('perimeter').value) || 200,
                panel_gap_mm: parseFloat(document.getElementById('panelGap').value) || 50,
                max_panel_size_mm: parseFloat(document.getElementById('maxPanel').value) || 1200
            };

            try {
                const response = await fetch('/api/calculate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    displayResults(result.data, data);
                } else {
                    throw new Error(result.error?.message || 'Calculation failed');
                }
            } catch (err) {
                error.textContent = 'Error: ' + err.message;
                error.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Calculate Layout';
            }
        }

        function displayResults(layout, input) {
            const results = document.getElementById('results');
            const stats = document.getElementById('stats');

            results.innerHTML = `
                <div class="result-item">
                    <span class="result-label">Panel Size</span>
                    <span class="result-value">${layout.panel_width_mm} × ${layout.panel_height_mm} mm</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Grid Layout</span>
                    <span class="result-value">${layout.panels_x} × ${layout.panels_y}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Total Panels</span>
                    <span class="result-value">${layout.total_panels}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Coverage</span>
                    <span class="result-value">${layout.coverage_sqm} m²</span>
                </div>
            `;
            results.style.display = 'block';

            stats.innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">${layout.total_panels}</div>
                    <div class="stat-label">Total Panels</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${layout.efficiency_percent}%</div>
                    <div class="stat-label">Efficiency</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${layout.coverage_sqm}</div>
                    <div class="stat-label">Coverage (m²)</div>
                </div>
            `;
            stats.style.display = 'grid';

            drawPreview(layout, input);
        }

        function drawPreview(layout, input) {
            const svg = document.getElementById('preview-svg');
            const scale = Math.min(360 / input.width_mm, 280 / input.length_mm) * 0.9;
            const offsetX = (400 - input.width_mm * scale) / 2;
            const offsetY = (320 - input.length_mm * scale) / 2;

            let html = `
                <rect x="${offsetX}" y="${offsetY}"
                      width="${input.width_mm * scale}" height="${input.length_mm * scale}"
                      fill="#1e293b" stroke="#475569" stroke-width="2" rx="2"/>
            `;

            const perimeterScaled = input.perimeter_gap_mm * scale;
            const panelW = layout.panel_width_mm * scale;
            const panelH = layout.panel_height_mm * scale;
            const gapScaled = input.panel_gap_mm * scale;

            for (let row = 0; row < layout.panels_y; row++) {
                for (let col = 0; col < layout.panels_x; col++) {
                    const x = offsetX + perimeterScaled + col * (panelW + gapScaled);
                    const y = offsetY + perimeterScaled + row * (panelH + gapScaled);
                    html += `<rect x="${x}" y="${y}" width="${panelW}" height="${panelH}"
                                   fill="#3b82f6" stroke="#60a5fa" stroke-width="1" rx="2"/>`;
                }
            }

            svg.innerHTML = html;
        }

        // Auto-calculate on load
        setTimeout(calculate, 500);
    </script>
</body>
</html>
'''


# ============== Routes ==============

@app.route('/')
def index():
    """Serve the main page."""
    return HTML_PAGE


@app.route('/api/calculate', methods=['POST'])
def calculate():
    """Run panel calculation."""
    try:
        data = request.get_json() or {}

        length_mm = float(data.get('length_mm', 5000))
        width_mm = float(data.get('width_mm', 4000))
        perimeter_gap = float(data.get('perimeter_gap_mm', 200))
        panel_gap = float(data.get('panel_gap_mm', 50))
        max_panel = float(data.get('max_panel_size_mm', 1200))

        # Validate inputs
        if length_mm <= 0 or width_mm <= 0:
            return jsonify({
                'success': False,
                'error': {'message': 'Dimensions must be positive'}
            }), 400

        result = simple_calculate(length_mm, width_mm, perimeter_gap, panel_gap, max_panel)

        return jsonify({
            'success': True,
            'data': result
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'message': str(e)}
        }), 500


@app.route('/api/health')
def health():
    """Health check."""
    return jsonify({
        'success': True,
        'data': {'status': 'healthy', 'calculator': 'ready'}
    })


# ============== Main ==============

if __name__ == '__main__':
    print("\n" + "="*50)
    print("  CEILING PANEL CALCULATOR")
    print("="*50)
    print("\n  Open your browser to:")
    print("  --> http://localhost:5000")
    print("\n  Press Ctrl+C to stop the server")
    print("="*50 + "\n")

    app.run(host='0.0.0.0', port=5000, debug=True)
