/**
 * StructuralValidator.ts
 * 
 * Validation utilities for structural BIM objects (Wall, Beam, Column, Slab)
 * Ensures dimensions meet building code requirements and practical constraints
 */

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface WallConstraints {
  minThickness: number
  maxThickness: number
  minHeight: number
  maxHeight: number
  minLength: number
}

export interface BeamConstraints {
  minWidth: number
  maxWidth: number
  minHeight: number
  maxHeight: number
  minLength: number
  maxLength: number
}

export interface ColumnConstraints {
  minWidth: number
  maxWidth: number
  minHeight: number
  maxHeight: number
  minDepth: number
  maxDepth: number
  minDiameter: number
  maxDiameter: number
}

export interface SlabConstraints {
  minThickness: number
  maxThickness: number
  minArea: number
}

// Default constraints based on standard building practices
export const DEFAULT_WALL_CONSTRAINTS: WallConstraints = {
  minThickness: 100,    // 100mm minimum for structural walls
  maxThickness: 500,    // 500mm maximum for typical walls
  minHeight: 1000,      // 1m minimum
  maxHeight: 10000,     // 10m maximum (3-story)
  minLength: 100,       // 100mm minimum
}

export const DEFAULT_BEAM_CONSTRAINTS: BeamConstraints = {
  minWidth: 100,        // 100mm minimum
  maxWidth: 600,        // 600mm maximum
  minHeight: 150,       // 150mm minimum
  maxHeight: 1200,      // 1200mm maximum
  minLength: 500,       // 500mm minimum
  maxLength: 20000,     // 20m maximum span
}

export const DEFAULT_COLUMN_CONSTRAINTS: ColumnConstraints = {
  minWidth: 200,        // 200mm minimum for rectangular
  maxWidth: 800,        // 800mm maximum
  minHeight: 1000,      // 1m minimum
  maxHeight: 15000,     // 15m maximum
  minDepth: 200,        // 200mm minimum
  maxDepth: 800,        // 800mm maximum
  minDiameter: 200,     // 200mm minimum for circular
  maxDiameter: 1000,    // 1000mm maximum for circular
}

export const DEFAULT_SLAB_CONSTRAINTS: SlabConstraints = {
  minThickness: 100,    // 100mm minimum for structural slabs
  maxThickness: 500,    // 500mm maximum
  minArea: 10000,       // 0.01 sqm minimum (100mm x 100mm)
}

export class StructuralValidator {
  private wallConstraints: WallConstraints
  private beamConstraints: BeamConstraints
  private columnConstraints: ColumnConstraints
  private slabConstraints: SlabConstraints

  constructor(
    wallConstraints: Partial<WallConstraints> = {},
    beamConstraints: Partial<BeamConstraints> = {},
    columnConstraints: Partial<ColumnConstraints> = {},
    slabConstraints: Partial<SlabConstraints> = {}
  ) {
    this.wallConstraints = { ...DEFAULT_WALL_CONSTRAINTS, ...wallConstraints }
    this.beamConstraints = { ...DEFAULT_BEAM_CONSTRAINTS, ...beamConstraints }
    this.columnConstraints = { ...DEFAULT_COLUMN_CONSTRAINTS, ...columnConstraints }
    this.slabConstraints = { ...DEFAULT_SLAB_CONSTRAINTS, ...slabConstraints }
  }

  /**
   * Validate wall dimensions
   */
  validateWall(
    length: number,
    height: number,
    thickness: number
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (length === undefined || length === null) {
      errors.push('Length is required')
    } else {
      if (length <= 0) errors.push('Length must be greater than 0')
      if (length < this.wallConstraints.minLength) {
        warnings.push(`Length ${length}mm is below minimum ${this.wallConstraints.minLength}mm`)
      }
    }

    if (height === undefined || height === null) {
      errors.push('Height is required')
    } else {
      if (height <= 0) errors.push('Height must be greater than 0')
      if (height < this.wallConstraints.minHeight) {
        warnings.push(`Height ${height}mm is below minimum ${this.wallConstraints.minHeight}mm`)
      }
      if (height > this.wallConstraints.maxHeight) {
        errors.push(`Height ${height}mm exceeds maximum ${this.wallConstraints.maxHeight}mm`)
      }
    }

    if (thickness === undefined || thickness === null) {
      errors.push('Thickness is required')
    } else {
      if (thickness <= 0) errors.push('Thickness must be greater than 0')
      if (thickness < this.wallConstraints.minThickness) {
        errors.push(`Thickness ${thickness}mm is below minimum ${this.wallConstraints.minThickness}mm`)
      }
      if (thickness > this.wallConstraints.maxThickness) {
        errors.push(`Thickness ${thickness}mm exceeds maximum ${this.wallConstraints.maxThickness}mm`)
      }
    }

    // Aspect ratio warning
    if (height > 0 && thickness > 0) {
      const aspectRatio = height / thickness
      if (aspectRatio > 30) {
        warnings.push(`Height-to-thickness ratio (${aspectRatio.toFixed(1)}:1) is high - may require structural review`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate beam dimensions
   */
  validateBeam(
    length: number,
    profileWidth: number,
    profileHeight: number,
    elevation: number = 0
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (length === undefined || length === null) {
      errors.push('Length is required')
    } else {
      if (length <= 0) errors.push('Length must be greater than 0')
      if (length < this.beamConstraints.minLength) {
        warnings.push(`Length ${length}mm is below minimum ${this.beamConstraints.minLength}mm`)
      }
      if (length > this.beamConstraints.maxLength) {
        errors.push(`Length ${length}mm exceeds maximum ${this.beamConstraints.maxLength}mm`)
      }
    }

    if (profileWidth === undefined || profileWidth === null) {
      errors.push('Profile width is required')
    } else {
      if (profileWidth <= 0) errors.push('Profile width must be greater than 0')
      if (profileWidth < this.beamConstraints.minWidth) {
        errors.push(`Profile width ${profileWidth}mm is below minimum ${this.beamConstraints.minWidth}mm`)
      }
      if (profileWidth > this.beamConstraints.maxWidth) {
        errors.push(`Profile width ${profileWidth}mm exceeds maximum ${this.beamConstraints.maxWidth}mm`)
      }
    }

    if (profileHeight === undefined || profileHeight === null) {
      errors.push('Profile height is required')
    } else {
      if (profileHeight <= 0) errors.push('Profile height must be greater than 0')
      if (profileHeight < this.beamConstraints.minHeight) {
        errors.push(`Profile height ${profileHeight}mm is below minimum ${this.beamConstraints.minHeight}mm`)
      }
      if (profileHeight > this.beamConstraints.maxHeight) {
        errors.push(`Profile height ${profileHeight}mm exceeds maximum ${this.beamConstraints.maxHeight}mm`)
      }
    }

    // Span-to-depth ratio warning
    if (length > 0 && profileHeight > 0) {
      const spanDepthRatio = length / profileHeight
      if (spanDepthRatio > 30) {
        warnings.push(`Span-to-depth ratio (${spanDepthRatio.toFixed(1)}:1) is high - verify structural adequacy`)
      }
    }

    // Elevation check
    if (elevation < 0) {
      warnings.push('Negative elevation - beam below reference level')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate column dimensions
   */
  validateColumn(
    height: number,
    profileType: 'rectangle' | 'circle',
    width?: number,
    depth?: number,
    diameter?: number,
    baseElevation: number = 0
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Height validation
    if (height === undefined || height === null) {
      errors.push('Height is required')
    } else {
      if (height <= 0) errors.push('Height must be greater than 0')
      if (height < this.columnConstraints.minHeight) {
        warnings.push(`Height ${height}mm is below minimum ${this.columnConstraints.minHeight}mm`)
      }
      if (height > this.columnConstraints.maxHeight) {
        errors.push(`Height ${height}mm exceeds maximum ${this.columnConstraints.maxHeight}mm`)
      }
    }

    // Profile type validation
    if (profileType === 'rectangle') {
      if (width === undefined || width === null) {
        errors.push('Width is required for rectangular columns')
      } else {
        if (width <= 0) errors.push('Width must be greater than 0')
        if (width < this.columnConstraints.minWidth) {
          errors.push(`Width ${width}mm is below minimum ${this.columnConstraints.minWidth}mm`)
        }
        if (width > this.columnConstraints.maxWidth) {
          errors.push(`Width ${width}mm exceeds maximum ${this.columnConstraints.maxWidth}mm`)
        }
      }

      if (depth === undefined || depth === null) {
        errors.push('Depth is required for rectangular columns')
      } else {
        if (depth <= 0) errors.push('Depth must be greater than 0')
        if (depth < this.columnConstraints.minDepth) {
          errors.push(`Depth ${depth}mm is below minimum ${this.columnConstraints.minDepth}mm`)
        }
        if (depth > this.columnConstraints.maxDepth) {
          errors.push(`Depth ${depth}mm exceeds maximum ${this.columnConstraints.maxDepth}mm`)
        }
      }

      // Slenderness check for rectangular
      if (height > 0 && width !== undefined && width > 0 && depth !== undefined && depth > 0) {
        const slenderness = height / Math.min(width, depth)
        if (slenderness > 25) {
          warnings.push(`Column slenderness ratio (${slenderness.toFixed(1)}:1) is high - may buckle under load`)
        }
      }
    } else if (profileType === 'circle') {
      if (diameter === undefined || diameter === null) {
        errors.push('Diameter is required for circular columns')
      } else {
        if (diameter <= 0) errors.push('Diameter must be greater than 0')
        if (diameter < this.columnConstraints.minDiameter) {
          errors.push(`Diameter ${diameter}mm is below minimum ${this.columnConstraints.minDiameter}mm`)
        }
        if (diameter > this.columnConstraints.maxDiameter) {
          errors.push(`Diameter ${diameter}mm exceeds maximum ${this.columnConstraints.maxDiameter}mm`)
        }
      }

      // Slenderness check for circular
      if (height > 0 && diameter !== undefined && diameter > 0) {
        const slenderness = height / diameter
        if (slenderness > 25) {
          warnings.push(`Column slenderness ratio (${slenderness.toFixed(1)}:1) is high - may buckle under load`)
        }
      }
    } else {
      errors.push(`Invalid profile type: ${profileType}`)
    }

    // Base elevation check
    if (baseElevation < 0) {
      warnings.push('Negative base elevation - column extends below reference level')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate slab dimensions
   */
  validateSlab(
    thickness: number,
    area: number,
    elevation: number = 0,
    boundaryPoints?: number
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Thickness validation
    if (thickness === undefined || thickness === null) {
      errors.push('Thickness is required')
    } else {
      if (thickness <= 0) errors.push('Thickness must be greater than 0')
      if (thickness < this.slabConstraints.minThickness) {
        errors.push(`Thickness ${thickness}mm is below minimum ${this.slabConstraints.minThickness}mm`)
      }
      if (thickness > this.slabConstraints.maxThickness) {
        errors.push(`Thickness ${thickness}mm exceeds maximum ${this.slabConstraints.maxThickness}mm`)
      }
    }

    // Area validation
    if (area === undefined || area === null) {
      errors.push('Area is required')
    } else {
      if (area <= 0) errors.push('Area must be greater than 0')
      if (area < this.slabConstraints.minArea) {
        warnings.push(`Area ${area.toFixed(2)}mm² is very small`)
      }
    }

    // Boundary validation
    if (boundaryPoints !== undefined) {
      if (boundaryPoints < 3) {
        errors.push('Slab boundary must have at least 3 points to form a valid polygon')
      }
    }

    // Elevation check
    if (elevation < 0) {
      warnings.push('Negative elevation - slab below reference level')
    }

    // Large span warning (rough estimate)
    if (area > 0 && thickness > 0) {
      const equivalentSpan = Math.sqrt(area)
      const spanThicknessRatio = equivalentSpan / thickness
      if (spanThicknessRatio > 40) {
        warnings.push(`Span-to-thickness ratio (${spanThicknessRatio.toFixed(1)}:1) is high - consider thicker slab or post-tensioning`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Quick validation - returns boolean only
   */
  isValidWall(length: number, height: number, thickness: number): boolean {
    return this.validateWall(length, height, thickness).valid
  }

  isValidBeam(length: number, profileWidth: number, profileHeight: number): boolean {
    return this.validateBeam(length, profileWidth, profileHeight).valid
  }

  isValidColumn(
    height: number,
    profileType: 'rectangle' | 'circle',
    width?: number,
    depth?: number,
    diameter?: number
  ): boolean {
    return this.validateColumn(height, profileType, width, depth, diameter).valid
  }

  isValidSlab(thickness: number, area: number): boolean {
    return this.validateSlab(thickness, area).valid
  }
}

// Singleton instance for default validation
export const defaultValidator = new StructuralValidator()

// Export individual validation functions for convenience
export const validateWall = (
  length: number,
  height: number,
  thickness: number,
  constraints?: Partial<WallConstraints>
): ValidationResult => {
  const validator = constraints ? new StructuralValidator(constraints) : defaultValidator
  return validator.validateWall(length, height, thickness)
}

export const validateBeam = (
  length: number,
  profileWidth: number,
  profileHeight: number,
  elevation?: number,
  constraints?: Partial<BeamConstraints>
): ValidationResult => {
  const validator = constraints ? new StructuralValidator(undefined, constraints) : defaultValidator
  return validator.validateBeam(length, profileWidth, profileHeight, elevation)
}

export const validateColumn = (
  height: number,
  profileType: 'rectangle' | 'circle',
  width?: number,
  depth?: number,
  diameter?: number,
  baseElevation?: number,
  constraints?: Partial<ColumnConstraints>
): ValidationResult => {
  const validator = constraints ? new StructuralValidator(undefined, undefined, constraints) : defaultValidator
  return validator.validateColumn(height, profileType, width, depth, diameter, baseElevation)
}

export const validateSlab = (
  thickness: number,
  area: number,
  elevation?: number,
  boundaryPoints?: number,
  constraints?: Partial<SlabConstraints>
): ValidationResult => {
  const validator = constraints ? new StructuralValidator(undefined, undefined, undefined, constraints) : defaultValidator
  return validator.validateSlab(thickness, area, elevation, boundaryPoints)
}
