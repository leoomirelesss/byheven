"""Optional offline review: python render-review.py FLOAT_GLB SCREEN_DIR OUTPUT_DIR.

Uses trimesh, pyrender, Pillow, numpy, and PyOpenGL 3.1.10. Input is the optional
dequantized copy emitted by import-iphone.mjs. The display and geometry are real;
studio lighting approximates the browser's environment and omits microtexture.
"""
import os
os.environ['PYOPENGL_PLATFORM']='egl'
import sys
from pathlib import Path
import numpy as np
import trimesh
import pyrender
from PIL import Image
from trimesh.transformations import euler_matrix

source=trimesh.load(sys.argv[1]);screens=Path(sys.argv[2]);out=Path(sys.argv[3]);out.mkdir(parents=True,exist_ok=True)
renderer=pyrender.OffscreenRenderer(720,1080)
for view in ['home','collection','product','back']:
    rotation=euler_matrix(np.deg2rad(3),np.deg2rad(158 if view=='back' else -22),np.deg2rad(-6))
    scene=pyrender.Scene(bg_color=[0.,0.,0.,0.],ambient_light=[.25,.25,.25])
    for name in source.graph.nodes_geometry:
        matrix,geometry=source.graph[name];mesh=source.geometry[geometry]
        model=pyrender.Mesh.from_trimesh(mesh,smooth=False)
        material_name=getattr(mesh.visual.material,'name','')
        if material_name=='PLIEGUE Display':
            path=screens/f'screen-{view if view!="back" else "home"}.webp'
            texture=pyrender.Texture(source=Image.open(path).convert('RGBA'),source_channels='RGBA')
            model.primitives[0].material=pyrender.MetallicRoughnessMaterial(baseColorFactor=[0.,0.,0.,1.],emissiveFactor=[1.,1.,1.],emissiveTexture=texture,metallicFactor=0,roughnessFactor=1,doubleSided=True)
        elif material_name in ('Anodized aluminum','Frosted glass'):
            model.primitives[0].material.normalTexture=None
        scene.add(model,pose=rotation@matrix)
    pose=np.eye(4);pose[2,3]=8
    scene.add(pyrender.PerspectiveCamera(yfov=np.deg2rad(34)),pose=pose)
    for x,y,z,power in [(-3,4,5,2),(4,1,5,1.5),(0,-4,4,1)]:
        pose=np.eye(4);pose[:3,3]=[x,y,z];direction=-pose[:3,3];direction/=np.linalg.norm(direction)
        right=np.cross(direction,[0,1,0]);right/=np.linalg.norm(right);up=np.cross(right,direction)
        pose[:3,:3]=np.stack([right,up,-direction],axis=1)
        scene.add(pyrender.DirectionalLight(color=np.ones(3),intensity=power),pose=pose)
    color,_=renderer.render(scene,flags=pyrender.RenderFlags.RGBA)
    Image.fromarray(color).save(out/f'review-{view}.webp',quality=90,method=6)
    print('Rendered:',view,flush=True)
renderer.delete()
