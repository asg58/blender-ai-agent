import os
import tempfile
import uuid
from typing import Dict, List, Optional, Any
from fastapi import UploadFile
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("BlenderFileImporter")

class BlenderFileImporter:
    def __init__(self):
        """Initialize the BlenderFileImporter with a temporary directory for storing uploaded files"""
        self.temp_dir = os.path.join(tempfile.gettempdir(), "blender_imports")
        os.makedirs(self.temp_dir, exist_ok=True)
        logger.info(f"BlenderFileImporter initialized with temp directory: {self.temp_dir}")
        
        # Store a list of imported files for cleanup
        self.imported_files: List[str] = []
        
    async def import_and_process(self, file: UploadFile, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Import a file and process it in Blender
        
        Args:
            file (UploadFile): The uploaded file
            options (Optional[Dict[str, Any]]): Optional processing options
            
        Returns:
            Dict[str, Any]: The result of the import operation
        """
        # Create a unique filename
        filename = f"{uuid.uuid4()}_{file.filename}"
        temp_file_path = os.path.join(self.temp_dir, filename)
        
        try:
            # Save the uploaded file
            file_content = await file.read()
            with open(temp_file_path, "wb") as f:
                f.write(file_content)
            
            # Track this file for cleanup
            self.imported_files.append(temp_file_path)
            
            # Log the import
            logger.info(f"File saved to {temp_file_path}, size: {len(file_content)} bytes")
            
            # Generate import code based on file type
            filename = file.filename or ""  # Gebruik een lege string als filename None is
            file_extension = os.path.splitext(filename)[1].lower()
            
            if options is None:
                options = {}
            
            import_code = self._generate_import_code(temp_file_path, file_extension, options)
            
            return {
                "status": "success",
                "message": f"File {file.filename} imported successfully",
                "code": import_code,
                "file_path": temp_file_path,
                "file_size": len(file_content),
                "file_type": file_extension
            }
            
        except Exception as e:
            logger.error(f"Error importing file: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to import file: {str(e)}"
            }
    
    def _generate_import_code(self, file_path: str, file_extension: str, options: Dict[str, Any]) -> str:
        """
        Generate Blender Python code to import and process the file
        
        Args:
            file_path (str): Path to the file
            file_extension (str): File extension
            options (Dict[str, Any]): Processing options
            
        Returns:
            str: Blender Python code
        """
        # Handle different file types
        if file_extension in ['.svg', '.SVG']:
            return self._generate_svg_import_code(file_path, options)
        elif file_extension in ['.dxf', '.DXF']:
            return self._generate_dxf_import_code(file_path, options)
        else:
            logger.warning(f"Unsupported file type: {file_extension}")
            return f"""
import bpy
# Unsupported file type: {file_extension}
# File path: {file_path}
print("Warning: Unsupported file type {file_extension}")
"""
    
    def _generate_svg_import_code(self, file_path: str, options: Dict[str, Any]) -> str:
        """
        Generate code to import and process an SVG file
        
        Args:
            file_path (str): Path to the SVG file
            options (Dict[str, Any]): Processing options
            
        Returns:
            str: Blender Python code for SVG import
        """
        scale = options.get('scale', 1.0)
        extrude = options.get('extrude', 0.0)
        
        # Normalize file path for Windows/Unix compatibility
        normalized_path = os.path.normpath(file_path).replace('\\', '\\\\')
        
        return f"""
import bpy

# Import SVG file
bpy.ops.import_curve.svg(filepath="{normalized_path}")

# Get the imported curve objects
imported_curves = [obj for obj in bpy.context.selected_objects if obj.type == 'CURVE']

for curve in imported_curves:
    # Apply scale
    curve.scale = ({scale}, {scale}, {scale})
    
    # Apply extrusion if specified
    if {extrude} > 0:
        curve.data.extrude = {extrude}
        curve.data.dimensions = '3D'
    
    # Apply transformation
    bpy.context.view_layer.objects.active = curve
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

print(f"Imported {{len(imported_curves)}} curves from SVG file")
"""
    
    def _generate_dxf_import_code(self, file_path: str, options: Dict[str, Any]) -> str:
        """
        Generate code to import and process a DXF file
        
        Args:
            file_path (str): Path to the DXF file
            options (Dict[str, Any]): Processing options
            
        Returns:
            str: Blender Python code for DXF import
        """
        scale = options.get('scale', 1.0)
        extrude = options.get('extrude', 0.0)
        merge = options.get('merge', True)
        
        # Normalize file path for Windows/Unix compatibility
        normalized_path = os.path.normpath(file_path).replace('\\', '\\\\')
        
        return f"""
import bpy

# Import DXF file
bpy.ops.import_scene.dxf(filepath="{normalized_path}")

# Get the imported objects
imported_objects = bpy.context.selected_objects

for obj in imported_objects:
    # Apply scale
    obj.scale = ({scale}, {scale}, {scale})
    
    # Apply transformation
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    
    # Apply extrusion for curve objects
    if obj.type == 'CURVE' and {extrude} > 0:
        obj.data.extrude = {extrude}
        obj.data.dimensions = '3D'

# Merge objects if requested
if {merge} and len(imported_objects) > 1:
    bpy.ops.object.select_all(action='DESELECT')
    for obj in imported_objects:
        obj.select_set(True)
    
    # Set the active object
    bpy.context.view_layer.objects.active = imported_objects[0]
    
    # Join objects
    bpy.ops.object.join()
    print(f"Merged {{len(imported_objects)}} objects into one")
else:
    print(f"Imported {{len(imported_objects)}} objects from DXF file")
"""

    def cleanup_temp_files(self) -> List[str]:
        """
        Remove all temporary files created for imports
        
        Returns:
            List[str]: List of files that were successfully cleaned up
        """
        cleaned_files = []
        for file_path in self.imported_files[:]:  # Use a copy of the list to avoid modification during iteration
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    cleaned_files.append(file_path)
                    self.imported_files.remove(file_path)
                    logger.info(f"Removed temporary file: {file_path}")
            except Exception as e:
                logger.error(f"Failed to remove temporary file {file_path}: {str(e)}")
        
        return cleaned_files 