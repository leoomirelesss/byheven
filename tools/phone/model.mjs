import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

// Original, unbranded phone. Units are normalized to a 2 × 4.23 body.
export function roundedShape(w, h, r) {
  const s = new T.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export function createPhone() {
  const phone = new T.Group(); phone.name = 'HevenPhone';
  const metal = new T.MeshStandardMaterial({name:'Graphite titanium', color:0x72747a, metalness:1, roughness:.25});
  const edge = new T.MeshStandardMaterial({name:'Polished chamfer', color:0xb4b6bc, metalness:1, roughness:.15});
  const black = new T.MeshStandardMaterial({name:'Black ceramic', color:0x08090b, roughness:.24, metalness:.2});
  const back = new T.MeshPhysicalMaterial({name:'Satin graphite back', color:0x23252a, metalness:.22, roughness:.32, clearcoat:.6, clearcoatRoughness:.22});
  const lens = new T.MeshPhysicalMaterial({name:'Optical glass', color:0x090f17, metalness:.5, roughness:.09, clearcoat:1});
  function add(name, geometry, material, position = [0,0,0]) {
    const mesh = new T.Mesh(geometry, material); mesh.name = name;
    mesh.position.set(...position); phone.add(mesh); return mesh;
  }
  function slab(name,w,h,r,depth,material,z=0,x=0,y=0) {
    const geometry = new T.ExtrudeGeometry(roundedShape(w,h,r), {depth, bevelEnabled:true, bevelSegments:3, steps:1, bevelSize:.012, bevelThickness:.012, curveSegments:10});
    geometry.translate(0,0,-depth/2);
    return add(name,geometry,material,[x,y,z]);
  }
  slab('TitaniumFrame',1.976,4.206,.26,.18,metal);
  slab('FrontChamfer',1.975,4.205,.26,.012,edge,.095);
  slab('FrontCeramic',1.95,4.18,.25,.01,black,.111);
  slab('BackGlass',1.945,4.175,.25,.012,back,-.104);
  const screenW=1.858, screenH=4.10;
  const screenGeometry = new T.ShapeGeometry(roundedShape(screenW,screenH,.225),18);
  const positions = screenGeometry.attributes.position;
  const uv = screenGeometry.attributes.uv;
  for(let i=0;i<positions.count;i++) uv.setXY(i,positions.getX(i)/screenW+.5,.5-positions.getY(i)/screenH);
  add('Display',screenGeometry,new T.MeshBasicMaterial({name:'Display texture',color:0xffffff,toneMapped:false}),[0,0,.132]);
  slab('CameraIsland',.55,.105,.052,.008,black,.144,0,1.987);
  // Tiny front lens catches light independently of the screen.
  add('FrontLens',new T.CircleGeometry(.025,24),lens,[.19,1.987,.163]);
  slab('HomeIndicator',.55,.018,.009,.002,black,.145,0,-2.008);
  for(const [name,x,y,h] of [['Power',1.005,.62,.47],['VolumeUp',-1.005,.73,.29],['VolumeDown',-1.005,.29,.29],['Action',-1.005,1.22,.14]]) {
    const button=slab(name,.035,h,.016,.075,edge,0,x,y);
    button.rotation.y=Math.PI/2;
  }
  const bandMaterial=new T.MeshStandardMaterial({name:'Antenna inlays',color:0x24262b,roughness:.7});
  for(const x of [-.997,.997]) for(const y of [-1.57,1.57]) add('Antenna',new T.BoxGeometry(.018,.028,.16),bandMaterial,[x,y,0]);
  // Back camera platform and three individually modeled lenses.
  slab('CameraPlatform',.86,.91,.17,.065,back,-.158,-.46,1.48);
  for(const [i,x,y] of [[1,-.65,1.68],[2,-.27,1.45],[3,-.65,1.25]]) {
    add(`LensRing${i}`,new T.TorusGeometry(.135,.022,10,32),edge,[x,y,-.216]);
    const barrel=add(`LensBarrel${i}`,new T.CylinderGeometry(.133,.133,.052,32),black,[x,y,-.214]); barrel.rotation.x=Math.PI/2;
    const glass=add(`LensGlass${i}`,new T.CircleGeometry(.107,32),lens,[x,y,-.246]); glass.rotation.y=Math.PI;
    const core=add(`LensCore${i}`,new T.CircleGeometry(.05,24),black,[x,y,-.247]); core.rotation.y=Math.PI;
  }
  const flash=add('Flash',new T.CircleGeometry(.052,24),new T.MeshStandardMaterial({color:0xe9e6d8,roughness:.35}),[-.25,1.76,-.197]); flash.rotation.y=Math.PI;
  // Port, microphone and speaker bores on the lower edge.
  add('USBPort',new T.BoxGeometry(.23,.012,.065),black,[0,-2.109,0]);
  for(const sign of [-1,1]) for(let i=0;i<5;i++) {
    add('SpeakerBore',new T.CylinderGeometry(.014,.014,.014,10),black,[sign*(.38+i*.074),-2.109,0]);
  }
  phone.userData = {author:'BY HEVEN', originalModel:true, dimensions:'2 × 4.23 × 0.26 normalized units', screen:'Display', textureOrder:['home','collection','product']};
  phone.traverse(mesh=> {
    if(!mesh.geometry) return;
    const source=mesh.geometry; mesh.geometry=mergeVertices(source); source.dispose();
  });
  phone.updateMatrixWorld(true);
  return phone;
}
