import { create } from 'zustand';

export interface Dimensions {
  width: number;  // cm
  length: number; // cm
  height: number; // cm
}

export interface KitchenType {
  id: string;
  name: string;
  description: string;
}

export interface Cabinet {
  id: string;
  type: 'base' | 'upper' | 'island' | 'pantry' | 'appliance';
  x: number; // cm from left wall
  y: number; // cm from back wall
  width: number; // cm
  depth: number; // cm
  height: number; // cm
  angle?: number; // for corner cabinets
}

export interface Appliance {
  id: string;
  type: 'oven' | 'cooktop' | 'dishwasher' | 'refrigerator' | 'sink' | 'microwave';
  cabinet_id: string; // which cabinet holds this appliance
  position: 'left' | 'center' | 'right';
}

export interface CabinetLayout {
  cabinets: Cabinet[];
  appliances: Appliance[];
  total_cost: number;
  layout_notes: string[];
}

export interface CabinetStore {
  // State
  dimensions: Dimensions | null;
  kitchenType: KitchenType | null;
  layout: CabinetLayout | null;
  isCalculating: boolean;

  // Actions
  setDimensions: (dimensions: Dimensions) => void;
  setKitchenType: (type: KitchenType) => void;
  calculateLayout: () => Promise<void>;
  clearLayout: () => void;

  // Kitchen types
  availableTypes: KitchenType[];
}

export const useCabinetStore = create<CabinetStore>((set, get) => ({
  dimensions: null,
  kitchenType: null,
  layout: null,
  isCalculating: false,

  availableTypes: [
    {
      id: 'galley',
      name: 'Galley Kitchen',
      description: 'Parallel counters for efficient workflow'
    },
    {
      id: 'l-shape',
      name: 'L-Shape Kitchen',
      description: 'Two perpendicular counters forming L'
    },
    {
      id: 'u-shape',
      name: 'U-Shape Kitchen',
      description: 'Three counters forming U around work area'
    },
    {
      id: 'open',
      name: 'Open Concept',
      description: 'Connected living areas with island'
    }
  ],

  setDimensions: (dimensions) => {
    set({ dimensions });
  },

  setKitchenType: (type) => {
    set({ kitchenType: type });
  },

  calculateLayout: async () => {
    const { dimensions, kitchenType } = get();

    if (!dimensions || !kitchenType) {
      throw new Error('Dimensions and kitchen type are required');
    }

    set({ isCalculating: true });

    try {
      // Import the automation engine
      const { default: automationEngine } = await import('../cabinetry/automationEngine');

      const layout = await automationEngine.calculate({
        dimensions,
        kitchenType: kitchenType.id
      });

      set({ layout, isCalculating: false });
    } catch (error) {
      set({ isCalculating: false });
      throw error;
    }
  },

  clearLayout: () => {
    set({ layout: null });
  }
}));