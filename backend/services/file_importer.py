import os
import base64
import tempfile
from typing import Dict, Any, List, Optional

class BlenderFileImporter:
    """
    Handles importing and processing various file formats into Blender
    - SVG: Vector graphics that can be extruded into 3D
    - DXF: CAD file format
    """
    
    def __init__(self):
        self.supported_formats = ["svg", "dxf"]
    
    def import_and_process(self, file_data: str, file_format: str, 
                          extrude: bool = True, extrude_depth: float = 0.1) -> Dict[str, Any]:
        """
        Import a file and process it in Blender
        
        Args:
            file_data (str): Base64 encoded file data
            file_format (str): File format (svg, dxf)
            extrude (bool): Whether to extrude the imported curves
            extrude_depth (float): Depth of extrusion
            
        Returns:
            dict: Result with status and generated code
        """
        if file_format.lower() not in self.supported_formats:
            return {
                "success": False,
                "error": f"Unsupported file format: {file_format}. Supported formats: {', '.join(self.supported_formats)}"
            }
        
        try:
            # Decode base64 data
            decoded_data = base64.b64decode(file_data)
            
            # Create a temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_format}")
            temp_file.write(decoded_data)
            temp_file.close()
            
            # Generate Blender code based on file format
            code = self._generate_import_code(temp_file.name, file_format, extrude, extrude_depth)
            
            return {
                "success": True,
                "code": code,
                "temp_file": temp_file.name
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error processing file: {str(e)}"
            }
    
    def _generate_import_code(self, file_path: str, file_format: str, 
                             extrude: bool, extrude_depth: float) -> str:
        """Generate the Blender Python code to import and process the file"""
        
        if file_format.lower() == "svg":
            code = self._generate_svg_import_code(file_path, extrude, extrude_depth)
        elif file_format.lower() == "dxf":
            code = self._generate_dxf_import_code(file_path, extrude, extrude_depth)
        else:
            code = "# Unsupported format"
        
        # Add cleanup code to remove the temp file
        code += f"""
# Clean up temporary file
import os
os.remove("{file_path}")
"""
        return code
    
    def _generate_svg_import_code(self, file_path: str, extrude: bool, extrude_depth: float) -> str:
        """Generate code to import and process an SVG file"""
        code = f"""
import bpy

# Import SVG file
bpy.ops.import_curve.svg(filepath="{file_path}")

# Get all imported curves
imported_curves = [obj for obj in bpy.context.scene.objects if obj.type == 'CURVE' and obj.select_get()]

# Organize curves
for curve in imported_curves:
    # Set origin to geometry
    bpy.context.view_layer.objects.active = curve
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY')
    
    # Set all curves to 2D
    curve.data.dimensions = '2D'
"""
        
        # Add extrusion code if requested
        if extrude:
            code += f"""
# Extrude all curves
for curve in imported_curves:
    bpy.context.view_layer.objects.active = curve
    curve.data.extrude = {extrude_depth}
    curve.data.dimensions = '3D'  # Switch to 3D after extrusion
"""
        
        return code
    
    def _generate_dxf_import_code(self, file_path: str, extrude: bool, extrude_depth: float) -> str:
        """Generate code to import and process a DXF file"""
        code = f"""
import bpy

# Import DXF file
bpy.ops.import_scene.dxf(filepath="{file_path}")

# Get all imported curves
imported_curves = [obj for obj in bpy.context.scene.objects if obj.type == 'CURVE' and obj.select_get()]

# Organize curves
for curve in imported_curves:
    # Set origin to geometry
    bpy.context.view_layer.objects.active = curve
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY')
"""
        
        # Add extrusion code if requested
        if extrude:
            code += f"""
# Extrude all curves
for curve in imported_curves:
    bpy.context.view_layer.objects.active = curve
    curve.data.extrude = {extrude_depth}
    curve.data.dimensions = '3D'  # Ensure 3D after extrusion
"""
        
        return code 