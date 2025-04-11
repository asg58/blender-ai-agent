import requests
import base64
import os
import argparse

def import_file(file_path, extrude=True, extrude_depth=0.1):
    """
    Import an SVG or DXF file into Blender using the API
    
    Args:
        file_path (str): Path to the SVG or DXF file
        extrude (bool): Whether to extrude the imported curves
        extrude_depth (float): Depth of extrusion
    """
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' does not exist")
        return
    
    # Get file format from extension
    file_format = file_path.split('.')[-1].lower()
    
    # Check if format is supported
    if file_format not in ['svg', 'dxf']:
        print(f"Error: Unsupported file format: {file_format}. Supported formats: svg, dxf")
        return
    
    # Read file
    with open(file_path, 'rb') as f:
        file_content = f.read()
    
    # Encode file as base64
    file_data = base64.b64encode(file_content).decode('utf-8')
    
    # Send to API using JSON request
    api_url = "http://localhost:8000/import-file"
    payload = {
        "file_data": file_data,
        "file_format": file_format,
        "extrude": extrude,
        "extrude_depth": extrude_depth
    }
    
    print(f"Sending file to API: {file_path}")
    print(f"File format: {file_format}")
    print(f"Extrude: {extrude}, Depth: {extrude_depth}")
    
    try:
        response = requests.post(api_url, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            print("Success! File imported into Blender")
            print(f"Message: {result.get('message', '')}")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error: {str(e)}")

def upload_file(file_path, extrude=True, extrude_depth=0.1):
    """
    Upload an SVG or DXF file to Blender using the multipart file upload API
    
    Args:
        file_path (str): Path to the SVG or DXF file
        extrude (bool): Whether to extrude the imported curves
        extrude_depth (float): Depth of extrusion
    """
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' does not exist")
        return
    
    # Get file format from extension
    file_format = file_path.split('.')[-1].lower()
    
    # Check if format is supported
    if file_format not in ['svg', 'dxf']:
        print(f"Error: Unsupported file format: {file_format}. Supported formats: svg, dxf")
        return
    
    # Open file for sending
    with open(file_path, 'rb') as f:
        files = {'file': (os.path.basename(file_path), f, f'application/{file_format}')}
        data = {
            'extrude': str(extrude).lower(),
            'extrude_depth': str(extrude_depth)
        }
        
        print(f"Uploading file to API: {file_path}")
        print(f"File format: {file_format}")
        print(f"Extrude: {extrude}, Depth: {extrude_depth}")
        
        try:
            response = requests.post(
                "http://localhost:8000/upload-file",
                files=files,
                data=data
            )
            
            if response.status_code == 200:
                result = response.json()
                print("Success! File uploaded and imported into Blender")
                print(f"Message: {result.get('message', '')}")
            else:
                print(f"Error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Import SVG or DXF files into Blender')
    parser.add_argument('file', help='Path to the SVG or DXF file')
    parser.add_argument('--no-extrude', dest='extrude', action='store_false', help='Do not extrude the curves')
    parser.add_argument('--depth', type=float, default=0.1, help='Extrusion depth (default: 0.1)')
    parser.add_argument('--upload', action='store_true', help='Use file upload API instead of JSON payload')
    
    args = parser.parse_args()
    
    if args.upload:
        upload_file(args.file, args.extrude, args.depth)
    else:
        import_file(args.file, args.extrude, args.depth) 