import { Material, PREDEFINED_MATERIALS, getMaterialsByCategory, getMaterialById } from '../types/materials'

// Simulated API service for materials
// In production, this would call backend endpoints

export const materialsApi = {
  async getAllMaterials(): Promise<Material[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))
    return PREDEFINED_MATERIALS
  },

  async getMaterialsByCategory() {
    await new Promise(resolve => setTimeout(resolve, 100))
    return getMaterialsByCategory()
  },

  async getMaterialById(id: string): Promise<Material | null> {
    await new Promise(resolve => setTimeout(resolve, 50))
    const material = getMaterialById(id)
    return material || null
  },

  async getMaterialsByCategoryName(category: string): Promise<Material[]> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return PREDEFINED_MATERIALS.filter(m => m.category === category)
  }
}
