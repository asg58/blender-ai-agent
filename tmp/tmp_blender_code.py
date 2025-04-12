
import bpy

# Verwijder bestaande objecten
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Maak een nieuwe kubus
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
cube = bpy.context.active_object
cube.name = "RedCube"

# Maak een rood materiaal
mat = bpy.data.materials.new(name="Red_Material")
mat.use_nodes = True
mat.diffuse_color = (1, 0, 0, 1)  # RGBA (Rood)

# Wijs het materiaal toe aan de kubus
if cube.data.materials:
    cube.data.materials[0] = mat
else:
    cube.data.materials.append(mat)

# Sla het resultaat op
bpy.ops.wm.save_as_mainfile(filepath="C:/Users/ahmet/Documents/red_cube.blend")

print("Rode kubus succesvol gemaakt en opgeslagen als red_cube.blend!")
