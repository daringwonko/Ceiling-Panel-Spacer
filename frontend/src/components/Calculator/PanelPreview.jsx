import { useMemo } from 'react'

export default function PanelPreview({ dimensions, spacing, layout }) {
  const svgContent = useMemo(() => {
    if (!dimensions.length_mm || !dimensions.width_mm) {
      return null
    }

    const scale = 0.05 // Scale down for display
    const width = dimensions.width_mm * scale
    const height = dimensions.length_mm * scale
    const padding = 20

    const svgWidth = width + padding * 2
    const svgHeight = height + padding * 2

    // Calculate panel layout
    const perimeterGap = spacing.perimeter_gap_mm * scale
    const panelGap = spacing.panel_gap_mm * scale

    // Use layout from API if available, otherwise calculate
    let panelsX = 3
    let panelsY = 2
    let panelWidth = 0
    let panelHeight = 0

    if (layout) {
      panelsX = layout.panels_per_column
      panelsY = layout.panels_per_row
      panelWidth = layout.panel_width_mm * scale
      panelHeight = layout.panel_length_mm * scale
    } else {
      // Simple calculation for preview
      const availableWidth = width - 2 * perimeterGap
      const availableHeight = height - 2 * perimeterGap
      panelWidth = (availableWidth - (panelsX - 1) * panelGap) / panelsX
      panelHeight = (availableHeight - (panelsY - 1) * panelGap) / panelsY
    }

    const panels = []
    for (let row = 0; row < panelsY; row++) {
      for (let col = 0; col < panelsX; col++) {
        const x = padding + perimeterGap + col * (panelWidth + panelGap)
        const y = padding + perimeterGap + row * (panelHeight + panelGap)
        panels.push({ x, y, width: panelWidth, height: panelHeight, key: `${row}-${col}` })
      }
    }

    return { svgWidth, svgHeight, width, height, padding, perimeterGap, panels }
  }, [dimensions, spacing, layout])

  if (!svgContent) {
    return (
      <div className="aspect-video bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">
        Enter dimensions to see preview
      </div>
    )
  }

  return (
    <div className="bg-slate-700 rounded-lg p-4">
      <svg
        viewBox={`0 0 ${svgContent.svgWidth} ${svgContent.svgHeight}`}
        className="w-full h-auto"
        style={{ maxHeight: '400px' }}
      >
        {/* Background ceiling area */}
        <rect
          x={svgContent.padding}
          y={svgContent.padding}
          width={svgContent.width}
          height={svgContent.height}
          fill="#334155"
          stroke="#475569"
          strokeWidth="2"
        />

        {/* Perimeter gap indication */}
        <rect
          x={svgContent.padding + svgContent.perimeterGap}
          y={svgContent.padding + svgContent.perimeterGap}
          width={svgContent.width - 2 * svgContent.perimeterGap}
          height={svgContent.height - 2 * svgContent.perimeterGap}
          fill="none"
          stroke="#64748b"
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {/* Panels */}
        {svgContent.panels.map((panel) => (
          <rect
            key={panel.key}
            x={panel.x}
            y={panel.y}
            width={panel.width}
            height={panel.height}
            fill="#3b82f6"
            stroke="#60a5fa"
            strokeWidth="1"
            rx="2"
          />
        ))}

        {/* Dimension labels */}
        <text
          x={svgContent.padding + svgContent.width / 2}
          y={svgContent.padding - 5}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="10"
        >
          {dimensions.width_mm}mm
        </text>
        <text
          x={svgContent.padding - 5}
          y={svgContent.padding + svgContent.height / 2}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="10"
          transform={`rotate(-90, ${svgContent.padding - 5}, ${svgContent.padding + svgContent.height / 2})`}
        >
          {dimensions.length_mm}mm
        </text>
      </svg>

      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary-500 rounded" />
          <span className="text-slate-400">Panels ({svgContent.panels.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-600 border border-slate-500 rounded" />
          <span className="text-slate-400">Gaps</span>
        </div>
      </div>
    </div>
  )
}
