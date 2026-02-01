/**
 * BIM Feature Module
 * 
 * Comprehensive BIM workbench with material management, layer organization,
 * and object property editing capabilities.
 */

// Models
export * from './models/Material';
export * from './models/Layer';

// Constants
export * from './constants/predefinedMaterials';

// Services
export { MaterialLibrary, materialLibrary, MaterialFilter } from './services/MaterialLibrary';
export { LayerManager, layerManager } from './services/LayerManager';
export { BIMObjectManager, bimObjectManager, ObjectFilter } from './services/BIMObjectManager';

// Hooks
export { useMaterials } from './hooks/useMaterials';
export { useLayers } from './hooks/useLayers';

// Utils
export {
  generateThreeMaterial,
  generatePreviewMaterial,
  generatePlaceholderMaterial,
  generateWireframeMaterial,
  generateHighlightMaterial,
  generateGhostMaterial,
  updateThreeMaterial,
  applyTextureMaps,
  loadTexture,
  disposeMaterial,
  getCacheStats,
  clearMaterialCache
} from './utils/threeMaterialGenerator';

// Components
export { MaterialPanel } from './components/MaterialPanel';
export { MaterialPreview } from './components/MaterialPreview';
export { MaterialPropertyEditor } from './components/MaterialPropertyEditor';
export { LayerPanel } from './components/LayerPanel';
export { LayerTree } from './components/LayerTree';
export { ObjectPropertiesPanel } from './components/ObjectPropertiesPanel';
