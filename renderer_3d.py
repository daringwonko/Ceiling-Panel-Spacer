#!/usr/bin/env python3
"""
Real 3D Rendering Engine for Ceiling Panel Visualization.

Generates proper 3D mesh data that can be exported to:
- OBJ (Wavefront) format
- STL (stereolithography) format
- GLTF/GLB format
- Direct WebGL vertices

No simulation - real vertex/face generation for CAD and visualization.
"""

import numpy as np
import math
import json
import struct
from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Dict, Any
from pathlib import Path
from datetime import datetime


@dataclass
class Vertex:
    """3D vertex with position and optional normal/UV."""
    x: float
    y: float
    z: float
    nx: float = 0.0
    ny: float = 0.0
    nz: float = 1.0
    u: float = 0.0
    v: float = 0.0

    def to_tuple(self) -> Tuple[float, float, float]:
        return (self.x, self.y, self.z)

    def to_array(self) -> np.ndarray:
        return np.array([self.x, self.y, self.z])


@dataclass
class Face:
    """Triangle face with vertex indices (0-indexed)."""
    v1: int
    v2: int
    v3: int
    material_id: int = 0


@dataclass
class Material:
    """Material definition for rendering."""
    name: str
    ambient: Tuple[float, float, float] = (0.2, 0.2, 0.2)
    diffuse: Tuple[float, float, float] = (0.8, 0.8, 0.8)
    specular: Tuple[float, float, float] = (1.0, 1.0, 1.0)
    shininess: float = 32.0
    transparency: float = 0.0

    def to_mtl_string(self) -> str:
        """Convert to MTL format string."""
        return f"""newmtl {self.name}
Ka {self.ambient[0]:.6f} {self.ambient[1]:.6f} {self.ambient[2]:.6f}
Kd {self.diffuse[0]:.6f} {self.diffuse[1]:.6f} {self.diffuse[2]:.6f}
Ks {self.specular[0]:.6f} {self.specular[1]:.6f} {self.specular[2]:.6f}
Ns {self.shininess:.6f}
d {1.0 - self.transparency:.6f}
illum 2
"""


@dataclass
class Mesh:
    """Complete 3D mesh with vertices, faces, and materials."""
    name: str
    vertices: List[Vertex] = field(default_factory=list)
    faces: List[Face] = field(default_factory=list)
    materials: List[Material] = field(default_factory=list)

    def add_vertex(self, x: float, y: float, z: float,
                   nx: float = 0, ny: float = 0, nz: float = 1) -> int:
        """Add vertex and return its index."""
        self.vertices.append(Vertex(x, y, z, nx, ny, nz))
        return len(self.vertices) - 1

    def add_face(self, v1: int, v2: int, v3: int, material_id: int = 0) -> None:
        """Add triangular face."""
        self.faces.append(Face(v1, v2, v3, material_id))

    def add_quad(self, v1: int, v2: int, v3: int, v4: int, material_id: int = 0) -> None:
        """Add quad as two triangles."""
        self.add_face(v1, v2, v3, material_id)
        self.add_face(v1, v3, v4, material_id)

    def compute_normals(self) -> None:
        """Compute vertex normals from face normals."""
        # Initialize normal accumulators
        normal_sums = [np.zeros(3) for _ in self.vertices]
        counts = [0 for _ in self.vertices]

        for face in self.faces:
            v0 = self.vertices[face.v1].to_array()
            v1 = self.vertices[face.v2].to_array()
            v2 = self.vertices[face.v3].to_array()

            # Face normal
            edge1 = v1 - v0
            edge2 = v2 - v0
            normal = np.cross(edge1, edge2)
            norm_length = np.linalg.norm(normal)

            if norm_length > 1e-10:
                normal /= norm_length

                # Accumulate for each vertex
                for idx in [face.v1, face.v2, face.v3]:
                    normal_sums[idx] += normal
                    counts[idx] += 1

        # Average and normalize
        for i, vertex in enumerate(self.vertices):
            if counts[i] > 0:
                avg_normal = normal_sums[i] / counts[i]
                norm_length = np.linalg.norm(avg_normal)
                if norm_length > 1e-10:
                    avg_normal /= norm_length
                vertex.nx, vertex.ny, vertex.nz = avg_normal

    def get_bounds(self) -> Tuple[np.ndarray, np.ndarray]:
        """Get bounding box (min, max) of mesh."""
        if not self.vertices:
            return np.zeros(3), np.zeros(3)

        positions = np.array([v.to_tuple() for v in self.vertices])
        return positions.min(axis=0), positions.max(axis=0)

    def get_center(self) -> np.ndarray:
        """Get center of bounding box."""
        min_pt, max_pt = self.get_bounds()
        return (min_pt + max_pt) / 2

    def translate(self, dx: float, dy: float, dz: float) -> None:
        """Translate all vertices."""
        for v in self.vertices:
            v.x += dx
            v.y += dy
            v.z += dz

    def scale(self, sx: float, sy: float, sz: float) -> None:
        """Scale all vertices from origin."""
        for v in self.vertices:
            v.x *= sx
            v.y *= sy
            v.z *= sz


class MeshExporter:
    """Export meshes to various 3D formats."""

    @staticmethod
    def to_obj(mesh: Mesh, filename: str, include_mtl: bool = True) -> None:
        """Export mesh to Wavefront OBJ format."""
        mtl_filename = filename.replace('.obj', '.mtl')

        with open(filename, 'w') as f:
            f.write(f"# Ceiling Panel 3D Model\n")
            f.write(f"# Generated: {datetime.now().isoformat()}\n")
            f.write(f"# Vertices: {len(mesh.vertices)}\n")
            f.write(f"# Faces: {len(mesh.faces)}\n\n")

            if include_mtl and mesh.materials:
                f.write(f"mtllib {Path(mtl_filename).name}\n\n")

            # Vertices
            f.write("# Vertices\n")
            for v in mesh.vertices:
                f.write(f"v {v.x:.6f} {v.y:.6f} {v.z:.6f}\n")

            # Texture coordinates
            f.write("\n# Texture Coordinates\n")
            for v in mesh.vertices:
                f.write(f"vt {v.u:.6f} {v.v:.6f}\n")

            # Normals
            f.write("\n# Normals\n")
            for v in mesh.vertices:
                f.write(f"vn {v.nx:.6f} {v.ny:.6f} {v.nz:.6f}\n")

            # Faces (OBJ uses 1-indexed)
            f.write("\n# Faces\n")
            current_material = -1
            for face in mesh.faces:
                if face.material_id != current_material and mesh.materials:
                    current_material = face.material_id
                    if current_material < len(mesh.materials):
                        f.write(f"usemtl {mesh.materials[current_material].name}\n")

                # Format: f v/vt/vn v/vt/vn v/vt/vn
                f.write(f"f {face.v1+1}/{face.v1+1}/{face.v1+1} "
                       f"{face.v2+1}/{face.v2+1}/{face.v2+1} "
                       f"{face.v3+1}/{face.v3+1}/{face.v3+1}\n")

        # Write MTL file
        if include_mtl and mesh.materials:
            with open(mtl_filename, 'w') as f:
                f.write(f"# Material Library for {mesh.name}\n")
                f.write(f"# Generated: {datetime.now().isoformat()}\n\n")
                for mat in mesh.materials:
                    f.write(mat.to_mtl_string())
                    f.write("\n")

    @staticmethod
    def to_stl(mesh: Mesh, filename: str, binary: bool = True) -> None:
        """Export mesh to STL format (binary or ASCII)."""
        if binary:
            MeshExporter._to_stl_binary(mesh, filename)
        else:
            MeshExporter._to_stl_ascii(mesh, filename)

    @staticmethod
    def _to_stl_binary(mesh: Mesh, filename: str) -> None:
        """Export to binary STL."""
        with open(filename, 'wb') as f:
            # 80-byte header
            header = f"Ceiling Panel Model - {mesh.name}".encode()
            header = header[:80].ljust(80, b'\0')
            f.write(header)

            # Number of triangles
            f.write(struct.pack('<I', len(mesh.faces)))

            # Triangles
            for face in mesh.faces:
                v0 = mesh.vertices[face.v1]
                v1 = mesh.vertices[face.v2]
                v2 = mesh.vertices[face.v3]

                # Compute face normal
                edge1 = np.array([v1.x - v0.x, v1.y - v0.y, v1.z - v0.z])
                edge2 = np.array([v2.x - v0.x, v2.y - v0.y, v2.z - v0.z])
                normal = np.cross(edge1, edge2)
                norm_length = np.linalg.norm(normal)
                if norm_length > 1e-10:
                    normal /= norm_length

                # Normal
                f.write(struct.pack('<fff', *normal))

                # Vertices
                f.write(struct.pack('<fff', v0.x, v0.y, v0.z))
                f.write(struct.pack('<fff', v1.x, v1.y, v1.z))
                f.write(struct.pack('<fff', v2.x, v2.y, v2.z))

                # Attribute byte count (unused)
                f.write(struct.pack('<H', 0))

    @staticmethod
    def _to_stl_ascii(mesh: Mesh, filename: str) -> None:
        """Export to ASCII STL."""
        with open(filename, 'w') as f:
            f.write(f"solid {mesh.name}\n")

            for face in mesh.faces:
                v0 = mesh.vertices[face.v1]
                v1 = mesh.vertices[face.v2]
                v2 = mesh.vertices[face.v3]

                # Compute face normal
                edge1 = np.array([v1.x - v0.x, v1.y - v0.y, v1.z - v0.z])
                edge2 = np.array([v2.x - v0.x, v2.y - v0.y, v2.z - v0.z])
                normal = np.cross(edge1, edge2)
                norm_length = np.linalg.norm(normal)
                if norm_length > 1e-10:
                    normal /= norm_length

                f.write(f"  facet normal {normal[0]:.6f} {normal[1]:.6f} {normal[2]:.6f}\n")
                f.write("    outer loop\n")
                f.write(f"      vertex {v0.x:.6f} {v0.y:.6f} {v0.z:.6f}\n")
                f.write(f"      vertex {v1.x:.6f} {v1.y:.6f} {v1.z:.6f}\n")
                f.write(f"      vertex {v2.x:.6f} {v2.y:.6f} {v2.z:.6f}\n")
                f.write("    endloop\n")
                f.write("  endfacet\n")

            f.write(f"endsolid {mesh.name}\n")

    @staticmethod
    def to_gltf(mesh: Mesh, filename: str) -> None:
        """Export mesh to GLTF format (JSON)."""
        # Flatten vertex data
        positions = []
        normals = []
        indices = []

        for v in mesh.vertices:
            positions.extend([v.x, v.y, v.z])
            normals.extend([v.nx, v.ny, v.nz])

        for face in mesh.faces:
            indices.extend([face.v1, face.v2, face.v3])

        # Compute bounds
        min_pos = [min(positions[i::3]) for i in range(3)]
        max_pos = [max(positions[i::3]) for i in range(3)]

        gltf = {
            "asset": {
                "version": "2.0",
                "generator": "Ceiling Panel Calculator"
            },
            "scene": 0,
            "scenes": [{"nodes": [0]}],
            "nodes": [{"mesh": 0, "name": mesh.name}],
            "meshes": [{
                "name": mesh.name,
                "primitives": [{
                    "attributes": {
                        "POSITION": 0,
                        "NORMAL": 1
                    },
                    "indices": 2,
                    "mode": 4  # TRIANGLES
                }]
            }],
            "accessors": [
                {
                    "bufferView": 0,
                    "componentType": 5126,  # FLOAT
                    "count": len(mesh.vertices),
                    "type": "VEC3",
                    "min": min_pos,
                    "max": max_pos
                },
                {
                    "bufferView": 1,
                    "componentType": 5126,
                    "count": len(mesh.vertices),
                    "type": "VEC3"
                },
                {
                    "bufferView": 2,
                    "componentType": 5125,  # UNSIGNED_INT
                    "count": len(indices),
                    "type": "SCALAR"
                }
            ],
            "bufferViews": [
                {"buffer": 0, "byteOffset": 0, "byteLength": len(positions) * 4},
                {"buffer": 0, "byteOffset": len(positions) * 4, "byteLength": len(normals) * 4},
                {"buffer": 0, "byteOffset": (len(positions) + len(normals)) * 4, "byteLength": len(indices) * 4}
            ],
            "buffers": [{
                "byteLength": (len(positions) + len(normals)) * 4 + len(indices) * 4,
                "uri": filename.replace('.gltf', '.bin')
            }]
        }

        # Write GLTF JSON
        with open(filename, 'w') as f:
            json.dump(gltf, f, indent=2)

        # Write binary buffer
        bin_filename = filename.replace('.gltf', '.bin')
        with open(bin_filename, 'wb') as f:
            for p in positions:
                f.write(struct.pack('<f', p))
            for n in normals:
                f.write(struct.pack('<f', n))
            for i in indices:
                f.write(struct.pack('<I', i))


class CeilingPanel3DGenerator:
    """Generate 3D models for ceiling panel layouts."""

    # Standard materials
    MATERIALS = {
        'white_panel': Material('white_panel', (0.9, 0.9, 0.9), (0.95, 0.95, 0.95)),
        'gray_panel': Material('gray_panel', (0.6, 0.6, 0.6), (0.7, 0.7, 0.7)),
        'wood_panel': Material('wood_panel', (0.4, 0.25, 0.1), (0.55, 0.35, 0.15)),
        'metal_panel': Material('metal_panel', (0.7, 0.72, 0.75), (0.85, 0.87, 0.9), shininess=64),
        'ceiling_frame': Material('ceiling_frame', (0.3, 0.3, 0.3), (0.4, 0.4, 0.4)),
    }

    def __init__(self, panel_thickness_mm: float = 15.0):
        self.panel_thickness = panel_thickness_mm

    def generate_layout_mesh(
        self,
        panels_x: int,
        panels_y: int,
        panel_width_mm: float,
        panel_height_mm: float,
        perimeter_gap_mm: float = 200,
        panel_gap_mm: float = 50,
        include_frame: bool = True,
        material_name: str = 'white_panel'
    ) -> Mesh:
        """
        Generate complete 3D mesh for ceiling panel layout.

        Args:
            panels_x: Number of panels in X direction
            panels_y: Number of panels in Y direction
            panel_width_mm: Width of each panel
            panel_height_mm: Height of each panel
            perimeter_gap_mm: Gap at ceiling edges
            panel_gap_mm: Gap between panels
            include_frame: Whether to include ceiling frame
            material_name: Material to use for panels

        Returns:
            Complete Mesh object
        """
        mesh = Mesh(name="ceiling_layout")

        # Add materials
        panel_mat = self.MATERIALS.get(material_name, self.MATERIALS['white_panel'])
        frame_mat = self.MATERIALS['ceiling_frame']
        mesh.materials = [panel_mat, frame_mat]

        # Calculate total ceiling size
        total_width = (panels_x * panel_width_mm +
                      (panels_x - 1) * panel_gap_mm +
                      2 * perimeter_gap_mm)
        total_height = (panels_y * panel_height_mm +
                       (panels_y - 1) * panel_gap_mm +
                       2 * perimeter_gap_mm)

        # Generate panels
        for py in range(panels_y):
            for px in range(panels_x):
                x = perimeter_gap_mm + px * (panel_width_mm + panel_gap_mm)
                y = perimeter_gap_mm + py * (panel_height_mm + panel_gap_mm)

                self._add_panel_box(
                    mesh,
                    x, y, 0,
                    panel_width_mm, panel_height_mm, self.panel_thickness,
                    material_id=0
                )

        # Generate frame if requested
        if include_frame:
            frame_width = 30  # mm
            frame_depth = 50  # mm

            # Perimeter frame
            self._add_frame_segment(mesh, 0, 0, -frame_depth,
                                   total_width, frame_width, frame_depth, 1)
            self._add_frame_segment(mesh, 0, total_height - frame_width, -frame_depth,
                                   total_width, frame_width, frame_depth, 1)
            self._add_frame_segment(mesh, 0, frame_width, -frame_depth,
                                   frame_width, total_height - 2*frame_width, frame_depth, 1)
            self._add_frame_segment(mesh, total_width - frame_width, frame_width, -frame_depth,
                                   frame_width, total_height - 2*frame_width, frame_depth, 1)

            # Grid frame between panels
            for px in range(1, panels_x):
                x = perimeter_gap_mm + px * (panel_width_mm + panel_gap_mm) - panel_gap_mm/2 - frame_width/2
                self._add_frame_segment(mesh, x, perimeter_gap_mm, -frame_depth,
                                       frame_width, total_height - 2*perimeter_gap_mm, frame_depth, 1)

            for py in range(1, panels_y):
                y = perimeter_gap_mm + py * (panel_height_mm + panel_gap_mm) - panel_gap_mm/2 - frame_width/2
                self._add_frame_segment(mesh, perimeter_gap_mm, y, -frame_depth,
                                       total_width - 2*perimeter_gap_mm, frame_width, frame_depth, 1)

        # Compute normals
        mesh.compute_normals()

        return mesh

    def _add_panel_box(
        self,
        mesh: Mesh,
        x: float, y: float, z: float,
        width: float, height: float, depth: float,
        material_id: int = 0
    ) -> None:
        """Add a box (panel) to the mesh."""
        # 8 vertices for box
        base_idx = len(mesh.vertices)

        # Bottom face vertices
        mesh.add_vertex(x, y, z)
        mesh.add_vertex(x + width, y, z)
        mesh.add_vertex(x + width, y + height, z)
        mesh.add_vertex(x, y + height, z)

        # Top face vertices
        mesh.add_vertex(x, y, z + depth)
        mesh.add_vertex(x + width, y, z + depth)
        mesh.add_vertex(x + width, y + height, z + depth)
        mesh.add_vertex(x, y + height, z + depth)

        # 12 triangles (2 per face)
        # Bottom face
        mesh.add_face(base_idx + 0, base_idx + 2, base_idx + 1, material_id)
        mesh.add_face(base_idx + 0, base_idx + 3, base_idx + 2, material_id)

        # Top face
        mesh.add_face(base_idx + 4, base_idx + 5, base_idx + 6, material_id)
        mesh.add_face(base_idx + 4, base_idx + 6, base_idx + 7, material_id)

        # Front face
        mesh.add_face(base_idx + 0, base_idx + 1, base_idx + 5, material_id)
        mesh.add_face(base_idx + 0, base_idx + 5, base_idx + 4, material_id)

        # Back face
        mesh.add_face(base_idx + 2, base_idx + 3, base_idx + 7, material_id)
        mesh.add_face(base_idx + 2, base_idx + 7, base_idx + 6, material_id)

        # Left face
        mesh.add_face(base_idx + 0, base_idx + 4, base_idx + 7, material_id)
        mesh.add_face(base_idx + 0, base_idx + 7, base_idx + 3, material_id)

        # Right face
        mesh.add_face(base_idx + 1, base_idx + 2, base_idx + 6, material_id)
        mesh.add_face(base_idx + 1, base_idx + 6, base_idx + 5, material_id)

    def _add_frame_segment(
        self,
        mesh: Mesh,
        x: float, y: float, z: float,
        width: float, height: float, depth: float,
        material_id: int
    ) -> None:
        """Add a frame segment (just a box with different material)."""
        self._add_panel_box(mesh, x, y, z, width, height, depth, material_id)


def demonstrate_3d_renderer():
    """Demonstrate 3D rendering capabilities."""
    print("="*80)
    print("3D CEILING PANEL RENDERER")
    print("="*80)

    generator = CeilingPanel3DGenerator(panel_thickness_mm=20)

    # Generate a sample layout
    print("\nGenerating 3x2 panel layout...")
    mesh = generator.generate_layout_mesh(
        panels_x=3,
        panels_y=2,
        panel_width_mm=800,
        panel_height_mm=600,
        perimeter_gap_mm=100,
        panel_gap_mm=50,
        include_frame=True,
        material_name='white_panel'
    )

    print(f"  Vertices: {len(mesh.vertices)}")
    print(f"  Faces: {len(mesh.faces)}")
    print(f"  Materials: {len(mesh.materials)}")

    min_pt, max_pt = mesh.get_bounds()
    print(f"  Bounding Box: ({min_pt[0]:.1f}, {min_pt[1]:.1f}, {min_pt[2]:.1f}) to "
          f"({max_pt[0]:.1f}, {max_pt[1]:.1f}, {max_pt[2]:.1f})")

    # Export to various formats
    print("\nExporting to formats:")

    MeshExporter.to_obj(mesh, "ceiling_layout.obj")
    print("  ✓ OBJ: ceiling_layout.obj")

    MeshExporter.to_stl(mesh, "ceiling_layout.stl", binary=True)
    print("  ✓ STL (binary): ceiling_layout.stl")

    MeshExporter.to_stl(mesh, "ceiling_layout_ascii.stl", binary=False)
    print("  ✓ STL (ASCII): ceiling_layout_ascii.stl")

    MeshExporter.to_gltf(mesh, "ceiling_layout.gltf")
    print("  ✓ GLTF: ceiling_layout.gltf")

    print("\n" + "="*80)
    print("3D RENDERING COMPLETE")
    print("="*80)


if __name__ == "__main__":
    demonstrate_3d_renderer()
