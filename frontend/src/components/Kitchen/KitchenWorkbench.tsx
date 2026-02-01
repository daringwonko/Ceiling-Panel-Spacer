"use client"

import React, { useState, useCallback } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../ui/Select"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card"
import {
  Calculator,
  Download,
  Grid3X3,
  LayoutTemplate as KitchenIcon,
  Ruler,
  Palette,
  Box,
  FileJson,
  FileType,
  LayoutGrid
} from "lucide-react"

export type KitchenType = "galley" | "l-shape" | "u-shape" | "open"

interface MaterialOption {
  id: string
  name: string
  category: string
  color: string
  costPerSqm: number
}

interface KitchenDimensions {
  width: number
  length: number
  height: number
}

interface KitchenCalculationResult {
  panels: Array<{
    id: string
    type: string
    dimensions: { width: number; height: number; depth: number }
    material: string
  }>
  layout: string
  totalCost: number
  totalArea: number
}

const KITCHEN_MATERIALS: MaterialOption[] = [
  { id: "oak_natural", name: "Natural Oak", category: "wood", color: "#C4A35A", costPerSqm: 180 },
  { id: "walnut_rich", name: "Rich Walnut", category: "wood", color: "#5D432C", costPerSqm: 220 },
  { id: "maple_light", name: "Light Maple", category: "wood", color: "#E8D4B8", costPerSqm: 160 },
  { id: "cherry_wood", name: "Cherry Wood", category: "wood", color: "#8B4513", costPerSqm: 250 },
  { id: "laminate_white", name: "White Laminate", category: "laminate", color: "#FFFFFF", costPerSqm: 45 },
  { id: "laminate_black", name: "Black Laminate", category: "laminate", color: "#1A1A1A", costPerSqm: 55 },
  { id: "laminate_woodgrain", name: "Woodgrain Laminate", category: "laminate", color: "#8B7355", costPerSqm: 65 },
  { id: "acrylic_white", name: "White Acrylic", category: "acrylic", color: "#F5F5F5", costPerSqm: 120 },
  { id: "acrylic_black", name: "Black Acrylic", category: "acrylic", color: "#2C2C2C", costPerSqm: 140 },
  { id: "acrylic_red", name: "Red Acrylic", category: "acrylic", color: "#8B0000", costPerSqm: 150 },
  { id: "melamine_white", name: "White Melamine", category: "melamine", color: "#FFFFFF", costPerSqm: 35 },
  { id: "melamine_grey", name: "Grey Melamine", category: "melamine", color: "#808080", costPerSqm: 40 },
  { id: "veneer_oak", name: "Oak Veneer", category: "veneer", color: "#CD853F", costPerSqm: 200 },
  { id: "veneer_mahogany", name: "Mahogany Veneer", category: "veneer", color: "#4A0404", costPerSqm: 280 },
]

const KITCHEN_TYPES: { value: KitchenType; label: string; description: string }[] = [
  { value: "galley", label: "Galley Kitchen", description: "Two parallel countertops with walkway between" },
  { value: "l-shape", label: "L-Shaped Kitchen", description: "Two adjacent walls forming an L configuration" },
  { value: "u-shape", label: "U-Shaped Kitchen", description: "Three walls of cabinets forming a U shape" },
  { value: "open", label: "Open Kitchen", description: "Kitchen open to living/dining areas" },
]

export default function KitchenWorkbench() {
  const [dimensions, setDimensions] = useState<KitchenDimensions>({
    width: 3000,
    length: 4000,
    height: 2400,
  })
  const [kitchenType, setKitchenType] = useState<KitchenType>("l-shape")
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialOption>(KITCHEN_MATERIALS[0])
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<KitchenCalculationResult | null>(null)
  const [showMaterialSelector, setShowMaterialSelector] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateDimensions = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (dimensions.width < 1000 || dimensions.width > 20000) {
      newErrors.width = "Width must be between 1000mm and 20000mm"
    }
    if (dimensions.length < 1000 || dimensions.length > 30000) {
      newErrors.length = "Length must be between 1000mm and 30000mm"
    }
    if (dimensions.height < 1800 || dimensions.height > 3000) {
      newErrors.height = "Height must be between 1800mm and 3000mm"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [dimensions])

  const handleDimensionChange = (field: keyof KitchenDimensions, value: string) => {
    const numValue = parseFloat(value) || 0
    setDimensions(prev => ({ ...prev, [field]: numValue }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const calculateKitchen = useCallback(async () => {
    if (!validateDimensions()) return

    setIsCalculating(true)
    setResult(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 800))

      const wallLength1 = Math.min(dimensions.length, dimensions.width) * 0.6
      const wallLength2 = dimensions.length * 0.4
      const cabinetDepth = 600
      const counterHeight = 900
      const baseCabinetHeight = 870
      const upperCabinetHeight = 700

      let panels: KitchenCalculationResult["panels"] = []
      let totalArea = 0

      if (kitchenType === "galley") {
        const leftWallPanels = Math.ceil(wallLength1 / 600)
        const rightWallPanels = Math.ceil(wallLength1 / 600)

        for (let i = 0; i < leftWallPanels; i++) {
          panels.push({
            id: `base-left-${i}`,
            type: "base_cabinet",
            dimensions: { width: 600, height: baseCabinetHeight, depth: cabinetDepth },
            material: selectedMaterial.name,
          })
          panels.push({
            id: `upper-left-${i}`,
            type: "upper_cabinet",
            dimensions: { width: 600, height: upperCabinetHeight, depth: 350 },
            material: selectedMaterial.name,
          })
        }

        for (let i = 0; i < rightWallPanels; i++) {
          panels.push({
            id: `base-right-${i}`,
            type: "base_cabinet",
            dimensions: { width: 600, height: baseCabinetHeight, depth: cabinetDepth },
            material: selectedMaterial.name,
          })
        }

        totalArea = (leftWallPanels + rightWallPanels) * 600 * (baseCabinetHeight + upperCabinetHeight) / 1000000
      } else if (kitchenType === "l-shape") {
        const panels1 = Math.ceil(wallLength1 / 600)
        const panels2 = Math.ceil(wallLength2 / 600)

        for (let i = 0; i < panels1; i++) {
          panels.push({
            id: `base-wall1-${i}`,
            type: "base_cabinet",
            dimensions: { width: 600, height: baseCabinetHeight, depth: cabinetDepth },
            material: selectedMaterial.name,
          })
          panels.push({
            id: `upper-wall1-${i}`,
            type: "upper_cabinet",
            dimensions: { width: 600, height: upperCabinetHeight, depth: 350 },
            material: selectedMaterial.name,
          })
        }

        for (let i = 0; i < panels2; i++) {
          panels.push({
            id: `base-wall2-${i}`,
            type: "base_cabinet",
            dimensions: { width: 600, height: baseCabinetHeight, depth: cabinetDepth },
            material: selectedMaterial.name,
          })
          panels.push({
            id: `upper-wall2-${i}`,
            type: "upper_cabinet",
            dimensions: { width: 600, height: upperCabinetHeight, depth: 350 },
            material: selectedMaterial.name,
          })
        }

        totalArea = (panels1 + panels2) * 600 * (baseCabinetHeight + upperCabinetHeight) / 1000000
      } else if (kitchenType === "u-shape") {
        const wall3Panels = Math.ceil(wallLength2 / 600)

        for (let i = 0; i < Math.ceil(wallLength1 / 600); i++) {
          panels.push({
            id: `base-wall1-${i}`,
            type: "base_cabinet",
            dimensions: { width: 600, height: baseCabinetHeight, depth: cabinetDepth },
            material: selectedMaterial.name,
          })
          panels.push({
            id: `upper-wall1-${i}`,
            type: "upper_cabinet",
            dimensions: { width: 600, height: upperCabinetHeight, depth: 350 },
            material: selectedMaterial.name,
          })
        }

        for (let i = 0; i < wall3Panels; i++) {
          panels.push({
            id: `base-wall3-${i}`,
            type: "base_cabinet",
            dimensions: { width: 600, height: baseCabinetHeight, depth: cabinetDepth },
            material: selectedMaterial.name,
          })
          panels.push({
            id: `upper-wall3-${i}`,
            type: "upper_cabinet",
            dimensions: { width: 600, height: upperCabinetHeight, depth: 350 },
            material: selectedMaterial.name,
          })
        }

        totalArea = (Math.ceil(wallLength1 / 600) * 2 + wall3Panels) * 600 * (baseCabinetHeight + upperCabinetHeight) / 1000000
      } else {
        const islandPanels = Math.ceil(wallLength1 / 900)

        for (let i = 0; i < Math.ceil(wallLength1 / 600); i++) {
          panels.push({
            id: `base-main-${i}`,
            type: "base_cabinet",
            dimensions: { width: 600, height: baseCabinetHeight, depth: cabinetDepth },
            material: selectedMaterial.name,
          })
        }

        for (let i = 0; i < islandPanels; i++) {
          panels.push({
            id: `island-${i}`,
            type: "island",
            dimensions: { width: 900, height: baseCabinetHeight, depth: cabinetDepth },
            material: selectedMaterial.name,
          })
        }

        totalArea = (Math.ceil(wallLength1 / 600) + islandPanels) * 600 * baseCabinetHeight / 1000000
      }

      const totalCost = totalArea * selectedMaterial.costPerSqm

      setResult({
        panels,
        layout: kitchenType,
        totalCost,
        totalArea,
      })
    } catch (error) {
      console.error("Calculation failed:", error)
    } finally {
      setIsCalculating(false)
    }
  }, [dimensions, kitchenType, selectedMaterial, validateDimensions])

  const exportJSON = useCallback(() => {
    if (!result) return

    const data = {
      metadata: {
        generated: new Date().toISOString(),
        application: "Kitchen Cabinet Calculator",
        version: "1.0",
      },
      dimensions: {
        width_mm: dimensions.width,
        length_mm: dimensions.length,
        height_mm: dimensions.height,
      },
      kitchenType,
      material: {
        id: selectedMaterial.id,
        name: selectedMaterial.name,
        category: selectedMaterial.category,
        color: selectedMaterial.color,
        cost_per_sqm: selectedMaterial.costPerSqm,
      },
      result: {
        ...result,
        panels: result.panels.map(p => ({
          ...p,
          area_sqm: (p.dimensions.width * p.dimensions.height) / 1000000,
        })),
      },
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "kitchen_project.json"
    a.click()
    URL.revokeObjectURL(url)
  }, [dimensions, kitchenType, selectedMaterial, result])

  const exportDXF = useCallback(() => {
    if (!result) return

    const content = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1009
9
$DWGCODEPAGE
3
ANSI_1252
0
ENDSEC
0
SECTION
2
ENTITIES
0
LWPOLYLINE
5
0
8
0
90
4
70
1
43
0.0
10
0.0
20
0.0
10
${dimensions.width}
20
0.0
10
${dimensions.width}
20
${dimensions.length}
10
0.0
20
${dimensions.length}
0
ENDSEC
0
EOF`

    const blob = new Blob([content], { type: "application/dxf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "kitchen_layout.dxf"
    a.click()
    URL.revokeObjectURL(url)
  }, [dimensions, result])

  const exportSVG = useCallback(() => {
    if (!result) return

    const scale = 0.1
    const width = dimensions.width * scale
    const height = dimensions.length * scale

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}px" height="${height}px" viewBox="0 0 ${dimensions.width} ${dimensions.length}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .floor { fill: #f0f0f0; stroke: #cccccc; stroke-width: 2; }
      .cabinet { fill: ${selectedMaterial.color}; stroke: #666666; stroke-width: 1; opacity: 0.9; }
      .counter { fill: #d4d4d4; stroke: #888888; stroke-width: 1; }
      .label { font-family: Arial, sans-serif; font-size: 100px; fill: #333333; }
    </style>
  </defs>
  <rect class="floor" x="0" y="0" width="${dimensions.width}" height="${dimensions.length}"/>
  <text class="label" x="50" y="100">Kitchen: ${kitchenType}</text>
  <text class="label" x="50" y="200">${dimensions.width}mm x ${dimensions.length}mm</text>
  <text class="label" x="50" y="300">Material: ${selectedMaterial.name}</text>
  <text class="label" x="50" y="400">Panels: ${result.panels.length} | Cost: $${result.totalCost.toFixed(2)}</text>
</svg>`

    const blob = new Blob([svg], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "kitchen_layout.svg"
    a.click()
    URL.revokeObjectURL(url)
  }, [dimensions, kitchenType, selectedMaterial, result])

  const renderKitchenGeometry = useCallback(() => {
    if (!dimensions.width || !dimensions.length) return null

    const wallOffset = 100
    const cabinetDepth = 600
    const cabinetWidth = 600
    const counterHeight = 870
    const upperHeight = 700
    const upperOffset = counterHeight + 50

    const elements: JSX.Element[] = []

    if (kitchenType === "galley") {
      const cabinetsPerWall = Math.floor((dimensions.width - 200) / cabinetWidth)

      for (let i = 0; i < cabinetsPerWall; i++) {
        const x = 100 + i * cabinetWidth

        elements.push(
          <mesh key={`base-left-${i}`} position={[x, counterHeight / 2, wallOffset]}>
            <boxGeometry args={[cabinetWidth - 2, counterHeight, cabinetDepth]} />
            <meshStandardMaterial color={selectedMaterial.color} />
          </mesh>
        )
        elements.push(
          <mesh key={`upper-left-${i}`} position={[x, upperOffset + upperHeight / 2, wallOffset + 100]}>
            <boxGeometry args={[cabinetWidth - 2, upperHeight, 350]} />
            <meshStandardMaterial color={selectedMaterial.color} opacity={0.8} transparent />
          </mesh>
        )

        elements.push(
          <mesh key={`base-right-${i}`} position={[x, counterHeight / 2, dimensions.length - wallOffset - cabinetDepth]}>
            <boxGeometry args={[cabinetWidth - 2, counterHeight, cabinetDepth]} />
            <meshStandardMaterial color={selectedMaterial.color} />
          </mesh>
        )
      }
    } else if (kitchenType === "l-shape") {
      const wall1Length = dimensions.width * 0.6
      const wall2Length = dimensions.length * 0.4

      for (let i = 0; i < Math.floor(wall1Length / cabinetWidth); i++) {
        const x = 100 + i * cabinetWidth
        elements.push(
          <mesh key={`base-wall1-${i}`} position={[x, counterHeight / 2, wallOffset]}>
            <boxGeometry args={[cabinetWidth - 2, counterHeight, cabinetDepth]} />
            <meshStandardMaterial color={selectedMaterial.color} />
          </mesh>
        )
        elements.push(
          <mesh key={`upper-wall1-${i}`} position={[x, upperOffset + upperHeight / 2, wallOffset + 100]}>
            <boxGeometry args={[cabinetWidth - 2, upperHeight, 350]} />
            <meshStandardMaterial color={selectedMaterial.color} opacity={0.8} transparent />
          </mesh>
        )
      }

      for (let i = 0; i < Math.floor(wall2Length / cabinetWidth); i++) {
        const z = 100 + i * cabinetWidth
        elements.push(
          <mesh key={`base-wall2-${i}`} position={[wallOffset, counterHeight / 2, z]}>
            <boxGeometry args={[cabinetDepth, counterHeight, cabinetWidth - 2]} />
            <meshStandardMaterial color={selectedMaterial.color} />
          </mesh>
        )
        elements.push(
          <mesh key={`upper-wall2-${i}`} position={[wallOffset + 100, upperOffset + upperHeight / 2, z]}>
            <boxGeometry args={[350, upperHeight, cabinetWidth - 2]} />
            <meshStandardMaterial color={selectedMaterial.color} opacity={0.8} transparent />
          </mesh>
        )
      }
    } else if (kitchenType === "u-shape") {
      const longWall = dimensions.width * 0.5
      const shortWall = dimensions.length * 0.4

      for (let i = 0; i < Math.floor(longWall / cabinetWidth); i++) {
        const x = 100 + i * cabinetWidth
        elements.push(
          <mesh key={`base-wall1-${i}`} position={[x, counterHeight / 2, wallOffset]}>
            <boxGeometry args={[cabinetWidth - 2, counterHeight, cabinetDepth]} />
            <meshStandardMaterial color={selectedMaterial.color} />
          </mesh>
        )
        elements.push(
          <mesh key={`upper-wall1-${i}`} position={[x, upperOffset + upperHeight / 2, wallOffset + 100]}>
            <boxGeometry args={[cabinetWidth - 2, upperHeight, 350]} />
            <meshStandardMaterial color={selectedMaterial.color} opacity={0.8} transparent />
          </mesh>
        )
      }

      for (let i = 0; i < Math.floor(shortWall / cabinetWidth); i++) {
        const z = 100 + i * cabinetWidth
        elements.push(
          <mesh key={`base-wall3-${i}`} position={[dimensions.width - wallOffset - cabinetDepth, counterHeight / 2, z]}>
            <boxGeometry args={[cabinetDepth, counterHeight, cabinetWidth - 2]} />
            <meshStandardMaterial color={selectedMaterial.color} />
          </mesh>
        )
        elements.push(
          <mesh key={`upper-wall3-${i}`} position={[dimensions.width - wallOffset - 350, upperOffset + upperHeight / 2, z]}>
            <boxGeometry args={[350, upperHeight, cabinetWidth - 2]} />
            <meshStandardMaterial color={selectedMaterial.color} opacity={0.8} transparent />
          </mesh>
        )
      }
    } else {
      const perimeter = Math.floor(dimensions.width / cabinetWidth)

      for (let i = 0; i < perimeter; i++) {
        const x = 100 + i * cabinetWidth
        elements.push(
          <mesh key={`base-perimeter-${i}`} position={[x, counterHeight / 2, wallOffset]}>
            <boxGeometry args={[cabinetWidth - 2, counterHeight, cabinetDepth]} />
            <meshStandardMaterial color={selectedMaterial.color} />
          </mesh>
        )
      }

      const islandCount = Math.floor((dimensions.width - 400) / 900)
      for (let i = 0; i < islandCount; i++) {
        const x = 400 + i * 900
        elements.push(
          <mesh key={`island-${i}`} position={[x, counterHeight / 2, dimensions.length / 2]}>
            <boxGeometry args={[900, counterHeight, 600]} />
            <meshStandardMaterial color={selectedMaterial.color} />
          </mesh>
        )
      }
    }

    elements.push(
      <mesh key="floor" position={[dimensions.width / 2, -10, dimensions.length / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[dimensions.width, dimensions.length]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
    )

    return elements
  }, [dimensions, kitchenType, selectedMaterial])

  return (
    <div className="flex h-screen bg-savage-dark">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          <Canvas
            camera={{ position: [dimensions.width / 500, 3, dimensions.length / 500], fov: 60 }}
            style={{ height: "100%", width: "100%" }}
          >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[dimensions.width / 1000, 5, dimensions.length / 1000]} intensity={0.5} />
            <group position={[0, 0, 0]}>
              {renderKitchenGeometry()}
            </group>
            <OrbitControls makeDefault />
          </Canvas>
        </div>
      </div>

      <div className="w-96 bg-savage-surface border-l border-savage-surface overflow-y-auto">
        <div className="p-4 border-b border-savage-surface">
          <h1 className="text-xl font-semibold text-savage-text flex items-center gap-2">
            <KitchenIcon className="h-5 w-5" />
            Kitchen Designer
          </h1>
        </div>

        <div className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Room Dimensions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                label="Width (mm)"
                type="number"
                value={dimensions.width}
                onChange={(e) => handleDimensionChange("width", e.target.value)}
                error={errors.width}
              />
              <Input
                label="Length (mm)"
                type="number"
                value={dimensions.length}
                onChange={(e) => handleDimensionChange("length", e.target.value)}
                error={errors.length}
              />
              <Input
                label="Height (mm)"
                type="number"
                value={dimensions.height}
                onChange={(e) => handleDimensionChange("height", e.target.value)}
                error={errors.height}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                Kitchen Layout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={kitchenType} onValueChange={(v) => setKitchenType(v as KitchenType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select kitchen type" />
                </SelectTrigger>
                <SelectContent>
                  {KITCHEN_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-savage-text-muted">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Cabinet Material
              </CardTitle>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => setShowMaterialSelector(true)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-savage-surface hover:bg-savage-surface/50 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-md border border-savage-surface"
                  style={{ backgroundColor: selectedMaterial.color }}
                />
                <div className="flex-1 text-left">
                  <div className="font-medium text-savage-text">{selectedMaterial.name}</div>
                  <div className="text-xs text-savage-text-muted">
                    ${selectedMaterial.costPerSqm}/m² · {selectedMaterial.category}
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>

          <Button
            onClick={calculateKitchen}
            disabled={isCalculating || Object.keys(errors).length > 0}
            className="w-full"
            variant="default"
            size="lg"
          >
            {isCalculating ? (
              <>
                <Calculator className="h-4 w-4 animate-pulse" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                Calculate Layout
              </>
            )}
          </Button>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  Calculation Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-savage-text-muted">Panels Required</span>
                  <span className="font-medium">{result.panels.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-savage-text-muted">Total Area</span>
                  <span className="font-medium">{result.totalArea.toFixed(2)} m²</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-savage-text-muted">Estimated Cost</span>
                  <span className="font-medium text-savage-primary">${result.totalCost.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-savage-surface">
                  <div className="text-xs text-savage-text-muted">
                    {result.panels.filter(p => p.type === "base_cabinet").length} base cabinets
                  </div>
                  <div className="text-xs text-savage-text-muted">
                    {result.panels.filter(p => p.type === "upper_cabinet").length} upper cabinets
                  </div>
                  {result.panels.some(p => p.type === "island") && (
                    <div className="text-xs text-savage-text-muted">
                      {result.panels.filter(p => p.type === "island").length} island unit(s)
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Options
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={exportJSON}>
                  <FileJson className="h-4 w-4 mr-1" />
                  JSON
                </Button>
                <Button variant="outline" size="sm" onClick={exportDXF}>
                  <FileType className="h-4 w-4 mr-1" />
                  DXF
                </Button>
                <Button variant="outline" size="sm" onClick={exportSVG}>
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  SVG
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showMaterialSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-savage-surface rounded-lg p-6 w-[500px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-savage-text">Select Material</h2>
              <button
                onClick={() => setShowMaterialSelector(false)}
                className="text-savage-text-muted hover:text-savage-text"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {KITCHEN_MATERIALS.map((material) => (
                <button
                  key={material.id}
                  onClick={() => {
                    setSelectedMaterial(material)
                    setShowMaterialSelector(false)
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    selectedMaterial.id === material.id
                      ? "border-savage-primary bg-savage-primary/10"
                      : "border-savage-surface hover:border-savage-primary/50"
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-md border border-savage-surface"
                    style={{ backgroundColor: material.color }}
                  />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-savage-text text-sm">{material.name}</div>
                    <div className="text-xs text-savage-text-muted capitalize">{material.category}</div>
                    <div className="text-xs text-savage-primary">${material.costPerSqm}/m²</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}