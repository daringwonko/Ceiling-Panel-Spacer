import React, { useCallback, useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { BIM3DCanvas } from './BIM3DCanvas';
import { BIM3DObject } from './BIM3DObject';
import { useBIMStore, BIMObject } from '../../stores/useBIMStore';
import { createObjectFromToolData } from './BIMObjectFactory';

interface ToolState {
  name: string;
  points: THREE.Vector3[];
}

interface BIMWorkbenchProps {
  initialTool?: string | null;
}

const TOOL_API_ENDPOINTS: Record<string, string> = {
  line: '/api/bim/tools/line',
  rectangle: '/api/bim/tools/rectangle',
  circle: '/api/bim/tools/circle',
  ellipse: '/api/bim/tools/ellipse',
  arc: '/api/bim/tools/arc',
  polygon: '/api/bim/tools/polygon',
  polyline: '/api/bim/tools/polyline',
  door: '/api/bim/tools/door',
  window: '/api/bim/tools/window',
  wall: '/api/bim/tools/wall',
  column: '/api/bim/tools/column',
  beam: '/api/bim/tools/beam',
  slab: '/api/bim/tools/slab',
  stairs: '/api/bim/tools/stairs',
  roof: '/api/bim/tools/roof',
};

const SINGLE_POINT_TOOLS: Set<string> = new Set([
  'circle', 'ellipse', 'door', 'window', 'column', 'stairs',
]);

const TWO_POINT_TOOLS: Set<string> = new Set([
  'line', 'rectangle', 'wall', 'beam', 'arc',
]);

const MULTI_POINT_TOOLS: Set<string> = new Set([
  'polygon', 'polyline',
]);

export const BIMWorkbench: React.FC<BIMWorkbenchProps> = ({
  initialTool = null,
}) => {
  const store = useBIMStore();
  const [toolState, setToolState] = useState<ToolState | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const objectsRef = useRef<BIM3DObject[]>([]);

  const activeTool = store.activeTool || initialTool;

  useEffect(() => {
    if (activeTool) {
      setToolState({ name: activeTool, points: [] });
    } else {
      setToolState(null);
    }
    setError(null);
  }, [activeTool]);

  useEffect(() => {
    objectsRef.current = store.objects
      .filter(obj => obj.type !== 'site' && obj.type !== 'building' && obj.type !== 'level')
      .map(obj => createObjectFromToolData(obj));
  }, [store.objects]);

  const getToolClickMode = useCallback((tool: string): 'single' | 'two-point' | 'multi' | null => {
    if (SINGLE_POINT_TOOLS.has(tool)) return 'single';
    if (TWO_POINT_TOOLS.has(tool)) return 'two-point';
    if (MULTI_POINT_TOOLS.has(tool)) return 'multi';
    return null;
  }, []);

  const createObjectFromApiResponse = useCallback((data: any, tool: string): BIMObject => {
    const baseObject: Partial<BIMObject> = {
      id: data.id || crypto.randomUUID(),
      type: tool as BIMObject['type'],
      name: `${tool.charAt(0).toUpperCase() + tool.slice(1)} ${Date.now()}`,
      material: 'default',
      properties: {},
      level: '',
      layer: store.activeLayerId || 'layer-0',
      isSelected: false,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    };

    switch (tool) {
      case 'rectangle':
        return {
          ...baseObject,
          geometry: {
            corner: { x: data.corner?.[0] || 0, y: data.corner?.[1] || 0, z: data.corner?.[2] || 0 },
            oppositeCorner: { x: data.opposite_corner?.[0] || 0, y: data.opposite_corner?.[1] || 0, z: data.opposite_corner?.[2] || 0 },
          },
          properties: {
            width: data.width || 0,
            height: data.height || 0,
          },
        } as BIMObject;

      case 'circle':
        return {
          ...baseObject,
          geometry: {
            center: { x: data.center?.[0] || 0, y: data.center?.[1] || 0, z: data.center?.[2] || 0 },
            radius: data.radius || 0,
          },
          properties: {
            radius: data.radius || 0,
            diameter: (data.radius || 0) * 2,
          },
        } as BIMObject;

      case 'ellipse':
        return {
          ...baseObject,
          geometry: {
            center: { x: data.center?.[0] || 0, y: data.center?.[1] || 0, z: data.center?.[2] || 0 },
            radiusX: data.radiusX || 0,
            radiusY: data.radiusY || 0,
            rotation: data.rotation || 0,
          },
          properties: {
            radiusX: data.radiusX || 0,
            radiusY: data.radiusY || 0,
            rotation: data.rotation || 0,
          },
        } as BIMObject;

      case 'line':
      case 'polyline':
        return {
          ...baseObject,
          geometry: {
            points: data.points || data.polyline || [],
          },
          properties: {
            pointCount: (data.points || data.polyline || []).length,
          },
        } as BIMObject;

      case 'polygon':
        return {
          ...baseObject,
          geometry: {
            vertices: data.vertices || [],
            sides: data.sides || 0,
          },
          properties: {
            sides: data.sides || 0,
            perimeter: data.perimeter || 0,
            area: data.area || 0,
          },
        } as BIMObject;

      case 'arc':
        return {
          ...baseObject,
          geometry: {
            startPoint: { x: data.start?.[0] || 0, y: data.start?.[1] || 0, z: data.start?.[2] || 0 },
            endPoint: { x: data.end?.[0] || 0, y: data.end?.[1] || 0, z: data.end?.[2] || 0 },
            radius: data.radius || 0,
            center: { x: data.center?.[0] || 0, y: data.center?.[1] || 0, z: data.center?.[2] || 0 },
          },
          properties: {
            radius: data.radius || 0,
            angle: data.angle || 0,
          },
        } as BIMObject;

      case 'door':
      case 'window':
        return {
          ...baseObject,
          geometry: {
            position: { x: data.position?.[0] || 0, y: data.position?.[1] || 0, z: data.position?.[2] || 0 },
          },
          properties: {
            width: data.width || 900,
            height: data.height || 2100,
            direction: data.direction || 'in',
          },
          position: data.position || [0, 0, 0],
        } as BIMObject;

      case 'wall':
        return {
          ...baseObject,
          type: 'wall',
          geometry: {
            startPoint: { x: data.start?.[0] || 0, y: data.start?.[1] || 0, z: data.start?.[2] || 0 },
            endPoint: { x: data.end?.[0] || 0, y: data.end?.[1] || 0, z: data.end?.[2] || 0 },
          },
          properties: {
            length: data.length || 0,
            height: data.height || 3000,
            thickness: data.thickness || 200,
          },
        } as BIMObject;

      case 'column':
        return {
          ...baseObject,
          type: 'column',
          geometry: {
            position: { x: data.position?.[0] || 0, y: data.position?.[1] || 0, z: data.position?.[2] || 0 },
          },
          properties: {
            width: data.width || 300,
            depth: data.depth || 300,
            height: data.height || 3000,
          },
          position: data.position || [0, 0, 0],
        } as BIMObject;

      case 'beam':
        return {
          ...baseObject,
          type: 'beam',
          geometry: {
            startPoint: { x: data.start?.[0] || 0, y: data.start?.[1] || 0, z: data.start?.[2] || 0 },
            endPoint: { x: data.end?.[0] || 0, y: data.end?.[1] || 0, z: data.end?.[2] || 0 },
          },
          properties: {
            length: data.length || 0,
            width: data.width || 200,
            height: data.height || 400,
          },
        } as BIMObject;

      case 'slab':
        return {
          ...baseObject,
          type: 'slab',
          geometry: {
            corner: { x: data.corner?.[0] || 0, y: data.corner?.[1] || 0, z: data.corner?.[2] || 0 },
            oppositeCorner: { x: data.opposite_corner?.[0] || 0, y: data.opposite_corner?.[1] || 0, z: data.opposite_corner?.[2] || 0 },
          },
          properties: {
            width: data.width || 0,
            length: data.length || 0,
            thickness: data.thickness || 150,
          },
        } as BIMObject;

      case 'stairs':
        return {
          ...baseObject,
          type: 'stairs',
          geometry: {
            position: { x: data.position?.[0] || 0, y: data.position?.[1] || 0, z: data.position?.[2] || 0 },
          },
          properties: {
            width: data.width || 1200,
            rise: data.rise || 175,
            run: data.run || 280,
            numberOfRisers: data.numberOfRisers || 0,
            totalHeight: data.totalHeight || 0,
          },
          position: data.position || [0, 0, 0],
        } as BIMObject;

      case 'roof':
        return {
          ...baseObject,
          type: 'roof',
          geometry: {
            corner: { x: data.corner?.[0] || 0, y: data.corner?.[1] || 0, z: data.corner?.[2] || 0 },
            oppositeCorner: { x: data.opposite_corner?.[0] || 0, y: data.opposite_corner?.[1] || 0, z: data.opposite_corner?.[2] || 0 },
          },
          properties: {
            pitch: data.pitch || 30,
            overhang: data.overhang || 300,
            type: data.type || 'gabled',
          },
        } as BIMObject;

      default:
        return {
          ...baseObject,
          geometry: data,
        } as BIMObject;
    }
  }, [store.activeLayerId]);

  const handleCanvasClick = useCallback(async (point: THREE.Vector3) => {
    if (!activeTool) {
      store.deselectAll();
      return;
    }

    const clickMode = getToolClickMode(activeTool);
    if (!clickMode) {
      console.warn(`Tool ${activeTool} does not support canvas clicking`);
      return;
    }

    const snappedPoint = new THREE.Vector3(
      Math.round(point.x / 50) * 50,
      Math.round(point.y / 50) * 50,
      Math.round(point.z / 50) * 50
    );

    if (isCreating) return;
    setIsCreating(true);
    setError(null);

    try {
      if (clickMode === 'single') {
        const endpoint = TOOL_API_ENDPOINTS[activeTool];
        if (!endpoint) throw new Error(`No endpoint for tool: ${activeTool}`);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(getSinglePointPayload(activeTool, snappedPoint)),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const newObject = createObjectFromApiResponse(data, activeTool);
        store.addObject(newObject);
        setToolState(null);
      } else if (clickMode === 'two-point') {
        setToolState(prev => {
          if (!prev) return { name: activeTool, points: [snappedPoint] };
          
          if (prev.points.length === 0) {
            return { name: activeTool, points: [snappedPoint] };
          }

          const startPoint = prev.points[0];
          const endpoint = TOOL_API_ENDPOINTS[activeTool];
          if (!endpoint) throw new Error(`No endpoint for tool: ${activeTool}`);

          const fetchAndAddObject = async () => {
            try {
              const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(getTwoPointPayload(activeTool, startPoint, snappedPoint)),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
              }

              const data = await response.json();
              const newObject = createObjectFromApiResponse(data, activeTool);
              store.addObject(newObject);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to create object');
            }
          };

          fetchAndAddObject();
          return null;
        });
      } else if (clickMode === 'multi') {
        setToolState(prev => {
          if (!prev) return { name: activeTool, points: [snappedPoint] };
          
          const newPoints = [...prev.points, snappedPoint];

          if (newPoints.length >= 3) {
            const endpoint = TOOL_API_ENDPOINTS[activeTool];
            if (endpoint) {
              const fetchAndAddObject = async () => {
                try {
                  const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(getMultiPointPayload(activeTool, newPoints)),
                  });

                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP ${response.status}`);
                  }

                  const data = await response.json();
                  const newObject = createObjectFromApiResponse(data, activeTool);
                  store.addObject(newObject);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to create object');
                }
              };

              fetchAndAddObject();
            }
            return null;
          }

          return { name: activeTool, points: newPoints };
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  }, [activeTool, isCreating, getToolClickMode, createObjectFromApiResponse, store]);

  const handleCancelTool = useCallback(() => {
    setToolState(null);
    setError(null);
    store.setActiveTool(null);
  }, [store]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <BIM3DCanvas
        objects={objectsRef.current}
        selectedIds={store.selectedObjectIds}
        onObjectSelect={(id, multi) => store.selectObject(id, multi)}
        onObjectDeselect={(id) => {
          const newSelection = store.selectedObjectIds.filter(sid => sid !== id);
          store.selectMultiple(newSelection);
        }}
        onCanvasClick={handleCanvasClick}
      />
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          fontSize: '14px',
          zIndex: 1000,
        }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: '12px',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {toolState && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(30, 30, 30, 0.9)',
          border: '1px solid #444',
          borderRadius: '8px',
          padding: '16px',
          color: '#fff',
          minWidth: '200px',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            {toolState.name.charAt(0).toUpperCase() + toolState.name.slice(1)} Tool
          </div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '12px' }}>
            {getToolClickMode(toolState.name) === 'single' && 'Click to place object'}
            {getToolClickMode(toolState.name) === 'two-point' && (
              toolState.points.length === 0 
                ? 'Click to set start point'
                : 'Click to set end point'
            )}
            {getToolClickMode(toolState.name) === 'multi' && (
              toolState.points.length === 0
                ? 'Click to start drawing'
                : `Points: ${toolState.points.length} (click 3+ to complete)`
            )}
          </div>
          <button
            onClick={handleCancelTool}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#444',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {isCreating && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: '8px',
          fontSize: '16px',
        }}>
          Creating {activeTool}...
        </div>
      )}
    </div>
  );
};

function getSinglePointPayload(tool: string, point: THREE.Vector3): Record<string, any> {
  switch (tool) {
    case 'circle':
      return { center: [point.x, point.y, point.z], radius: 500 };
    case 'ellipse':
      return { center: [point.x, point.y, point.z], radiusX: 500, radiusY: 300 };
    case 'door':
      return { position: [point.x, point.y, point.z], width: 900, height: 2100, direction: 'in' };
    case 'window':
      return { position: [point.x, point.y, point.z], width: 1200, height: 1200 };
    case 'column':
      return { position: [point.x, point.y, point.z], width: 300, depth: 300, height: 3000 };
    case 'stairs':
      return { position: [point.x, point.y, point.z], width: 1200, rise: 175, run: 280 };
    default:
      return { position: [point.x, point.y, point.z] };
  }
}

function getTwoPointPayload(tool: string, start: THREE.Vector3, end: THREE.Vector3): Record<string, any> {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  switch (tool) {
    case 'line':
      return { start: [start.x, start.y, start.z], end: [end.x, end.y, end.z] };
    case 'rectangle':
      return {
        corner: [start.x, start.y, start.z],
        opposite_corner: [end.x, end.y, end.z],
      };
    case 'wall':
      return {
        start: [start.x, start.y, start.z],
        end: [end.x, end.y, end.z],
        height: 3000,
        thickness: 200,
      };
    case 'beam':
      return {
        start: [start.x, start.y, start.z],
        end: [end.x, end.y, end.z],
        width: 200,
        height: 400,
      };
    case 'arc':
      const centerX = (start.x + end.x) / 2;
      const centerY = (start.y + end.y) / 2;
      const radius = length / 2;
      return {
        start: [start.x, start.y, start.z],
        end: [end.x, end.y, end.z],
        center: [centerX, centerY, start.z],
        radius,
      };
    default:
      return { start: [start.x, start.y, start.z], end: [end.x, end.y, end.z] };
  }
}

function getMultiPointPayload(tool: string, points: THREE.Vector3[]): Record<string, any> {
  const flatPoints = points.flatMap(p => [p.x, p.y, p.z]);

  switch (tool) {
    case 'polyline':
      return { points: flatPoints };
    case 'polygon':
      return { vertices: flatPoints };
    default:
      return { points: flatPoints };
  }
}

export default BIMWorkbench;
