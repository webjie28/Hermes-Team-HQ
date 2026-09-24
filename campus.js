import * as THREE from './vendor/three.module.js'

const $ = s => document.querySelector(s)
const safe = (v = '') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const duration = s => `${Math.floor((s || 0)/3600)}h ${Math.floor((s || 0)%3600/60)}m`
const positions = { benjie:[-9,-6], judith:[-4.6,-6], david:[1,-6], jake:[6,-6], ralph:[-9,0], rick:[-4.6,0], fulton:[1,0], joem:[6,0] }
const names = Object.keys(positions)
const meetingSeats = [[-17,-5.7],[-15.5,-5.7],[-14,-5.7],[-17,-2.7],[-15.5,-2.7],[-14,-2.7],[-18.5,-4.2],[-12.7,-4.2]]
const diningSeats = [-8.8,-6.8,-4.8,-2.8].flatMap(x => [[x,-15.8],[x,-12.6]])
const diningEntry = [-1.05,-11.1]
const diningApproach = index => [diningEntry,[-1.05,index%2===0 ? -17 : -11.1],[diningSeats[index][0],index%2===0 ? -17 : -11.1],diningSeats[index]]
const colors = ['#6e9d8b','#a497c6','#89a1ba','#cbad78','#b8a2c4','#86aeb7','#c4978d','#a1ac85']
const beds = Object.fromEntries(names.map((n,i) => [n, [2.2+(i%4)*2.2, 5.1+Math.floor(i/4)*3.15]]))
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

export class Campus {
  constructor() {
    this.selected = 'judith'; this.people = new Map(); this.preview = 'live'; this.zoom = 1; this.yaw = .58; this.tour = false
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#b2bf88')
    this.camera = new THREE.OrthographicCamera(-24,24,20,-20,.1,180)
    this.renderer = new THREE.WebGLRenderer({antialias:true,alpha:false})
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7)); this.renderer.shadowMap.enabled=true
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace=THREE.SRGBColorSpace
    $('#campus-stage').append(this.renderer.domElement)
    this.scene.add(new THREE.HemisphereLight('#fff8e5','#81935e',2.5))
    const sun=new THREE.DirectionalLight('#fff0d7',3.2); sun.position.set(-16,32,15); sun.castShadow=true
    Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,far:100}); sun.shadow.mapSize.set(2048,2048); sun.shadow.bias=-.001; sun.shadow.normalBias=.06
    this.scene.add(sun)
    this.materials=new Map(); this.clock=new THREE.Clock(); this.textureLoader=new THREE.TextureLoader()
    this.buildCampus(); this.bind(); this.resize()
    this.observer=new ResizeObserver(()=>this.resize()); this.observer.observe($('#office-map'))
    this.renderer.setAnimationLoop(()=>this.frame())
  }
  material(color) {
    if (!this.materials.has(color)) this.materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.85}))
    return this.materials.get(color)
  }
  box(x,y,z,w,h,d,color,parent=this.scene) {
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),this.material(color)); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m
  }
  cylinder(x,y,z,r,h,color,parent=this.scene,r2=r) {
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r2,r,h,10),this.material(color)); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m
  }
  plant(x,z,scale=1) {
    this.cylinder(x,.42,z,.27,.6,'#bfaa88'); const leaves=new THREE.Mesh(new THREE.IcosahedronGeometry(.47*scale,0),this.material('#5c8454')); leaves.position.set(x,.9,z); leaves.scale.y=1.2; leaves.castShadow=true; this.scene.add(leaves)
  }
  tree(x,z,scale=1) {
    this.cylinder(x,1.0,z,.18,2,'#877153')
    for(let i=0;i<3;i++) {const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry((1.3-i*.18)*scale,1),this.material(['#749550','#88a95e','#9bb36b'][i])); leaf.position.set(x+(i-1)*.25,2+i*.64,z); leaf.castShadow=true;this.scene.add(leaf)}
  }
  sign(text,x,y,z,width=3.4,color='#4b6250') {
    const c=document.createElement('canvas');c.width=512;c.height=100;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,512,100);ctx.fillStyle='#fff9e8';ctx.font='600 29px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,61)
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace
    const m=new THREE.Mesh(new THREE.PlaneGeometry(width,width/5.12),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));m.position.set(x,y,z);this.scene.add(m);return m
  }
  monitor(x,z,width=1.0,color='#81b6b0') {
    this.box(x,1.6,z,.13,.6,.12,'#464d4b');this.box(x,1.35,z+.08,.48,.05,.32,'#454d4c')
    this.box(x,1.99,z,width,.72,.11,'#364348');this.box(x,1.99,z+.065,width-.1,.6,.015,color)
    for(let i=0;i<3;i++)this.box(x-width*.19,2.08-i*.12,z+.08,width*.36,.023,.01,'#e1eee0')
  }
  desk(name,x,z) {
    this.box(x,1.23,z,3.4,.15,1.5,'#c0a17a')
    for(const dx of [-1.4,1.4])for(const dz of [-.5,.5])this.box(x+dx,.65,z+dz,.09,1.2,.09,'#e1dfd1')
    if(name==='judith') {this.monitor(x-.48,z-.35,1.4);this.monitor(x+.84,z-.3,.72,'#acd2c2')}
    else if(name==='david') {this.monitor(x+.65,z-.32,1.1,'#9abdd0');this.box(x-.65,1.34,z+.12,.88,.05,.65,'#626d72');this.monitor(x-.65,z-.16,.82,'#a9cbd2')}
    else if(['ralph','joem'].includes(name))this.monitor(x,z-.32,1.18,'#b5bbd1')
    else {this.monitor(x-.63,z-.32,1.02);this.monitor(x+.53,z-.32,1.02)}
    this.box(x,1.34,z+.43,.83,.035,.28,'#e7e5d9');this.box(x+.63,1.34,z+.4,.14,.05,.2,'#3a4347')
    this.cylinder(x+1.35,1.48,z+.3,.105,.26,'#f8f1db');this.box(x-1.28,1.34,z+.2,.35,.035,.48,'#efe3bc')
    this.chair(x,z+1.3);this.plant(x-1.5,z-.44,.48)
  }
  chair(x,z,rotation=0) {
    const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=rotation;this.scene.add(group)
    this.cylinder(0,.42,0,.065,.65,'#5a6565',group);this.box(0,.8,0,.72,.14,.72,'#536669',group);this.box(0,1.07,.36,.72,.55,.1,'#536669',group)
    this.box(0,.16,0,.76,.06,.1,'#56605c',group);this.box(0,.16,0,.1,.06,.76,'#56605c',group)
  }
  bed(name,x,z,i) {
    this.box(x,.4,z,1.6,.52,2.5,'#ab9171');this.box(x,.76,z,1.48,.24,2.36,'#eeeadc');this.box(x,.8,z-1.19,1.7,1.3,.12,'#bca480')
    this.box(x,.94,z-.76,1.12,.16,.56,'#fff9e7');this.box(x,.93,z+.35,1.47,.15,1.53,colors[i]);this.box(x,1.02,z-.27,1.47,.04,.28,'#d5dfd0')
    this.box(x+.93,.5,z-.68,.23,.8,.5,'#c3aa89')
  }
  buildCampus() {
    this.box(0,-.35,0,48,.5,38,'#a6b579')
    // Street, pavement, parking and garden form a real exterior around the cutaway.
    this.box(17,-.04,0,5,.09,38,'#646d68');this.box(13.9,.015,0,1.1,.13,38,'#d0ccba')
    for(let z=-18;z<19;z+=3)this.box(17,.025,z,.12,.012,1.5,'#e9e4cc')
    for(let i=0;i<6;i++)this.box(15.9+i*.38,.03,11, .19,.012,2,'#eae6d6')
    this.box(-3,.01,13,26,.12,2,'#d1cbb6');this.box(-.7,.04,10.5,2,.12,4,'#d1cbb6')
    this.box(-6,.015,16,18,.1,4.4,'#8a9384')
    for(let i=0;i<7;i++) {const x=-14.5+i*2.7;this.box(x,.08,16,.06,.02,4,'#e6e4cb');if(i<6)this.car(x+1.3,16,['#68858e','#b96e56','#d1c3a6','#738b66','#b09d7c','#676f82'][i])}
    for(const [x,z,s] of [[-17,-12,1.1],[-20,-9,1],[-20,5,1.1],[-14,11,.8],[11,-13,1.1],[12,4,.8],[11,11,1],[21,-9,1],[21,8,1],[-12.5,-17,.9]])this.tree(x,z,s)
    for(let i=0;i<4;i++) {const x=3.7+i*2.1;this.box(x,.15,-11,.8,.3,.9,'#80915c')}
    for(const z of [5]) {this.box(-14,.58,z,1.1,.18,2.9,'#b4946f');this.box(-14.5,.95,z,.15,.85,2.9,'#ac8b63');for(const d of [-1,1])this.box(-14,.28,z+d,.65,.55,.13,'#525e51')}
    this.box(-14,.07,-.5,2.4,.1,4,'#c5c7a0');this.cylinder(-14,.85,-.5,.65,.12,'#dfd5bb');this.cylinder(-14,.42,-.5,.11,.8,'#797867')
    this.box(-8,.1,0,7,.25,19,'#c4bea8');this.box(4,.1,0,17,.25,19,'#c4bea8')
    this.box(-.5,.3,0,24,.25,19,'#dfc6a0')
    for(let z=-9;z<9.5;z+=.55)this.box(-.5,.431,z,23.8,.008,.02,'#c9ae84')
    for(let x=-12;x<12;x+=2.1)for(let z=-9;z<9;z+=1.1)this.box(x,.434,z,.016,.006,.52,'#c3a780')
    // High back wall, low front walls and open doorways keep the rooms visible.
    // Rear doorway leads to the dining pavilion, not into the workstation aisle.
    this.box(-7.1,1.9,-9.4,10.8,3.02,.22,'#f0e8d5');this.box(5.55,1.9,-9.4,11.9,3.02,.22,'#f0e8d5');this.box(-12.4,1.15,0,.22,1.8,19,'#ede4ce')
    this.box(11.4,.85,0,.18,1,19,'#e8dfc8');this.box(-6.8,.7,9.4,11.4,.6,.2,'#eee4cc');this.box(6,.7,9.4,10.8,.6,.2,'#eee4cc')
    for(let x=-10;x<10;x+=4.4) {if(Math.abs(x+1.2)<.1)continue;this.box(x,2.15,-9.25,2.6,1.45,.04,'#b4cbd0');this.box(x,2.15,-9.2,.04,1.45,.03,'#fdf6de');this.box(x,2.12,-9.2,2.6,.05,.03,'#fdf6de')}
    // Shared private office: both desks inside one room, with a real doorway.
    this.box(-1.8,1.25,-5,.15,1.65,8.5,'#ece3cf')
    this.box(-8.1,1.1,-1.1,8.5,1.3,.15,'#ece3cf')
    this.box(-2.1,1.1,-1.1,.6,1.3,.15,'#ece3cf')
    this.box(-3.1,1.3,-1.7,.12,2,1.2,'#947956')
    this.box(-.5,.45,2.6,23.7,.025,1.3,'#ebe1c8')
    // Lower floor: gym, dining/lounge, meeting point, and quiet sleeping wing.
    this.box(-9,.46,6,6.6,.035,5.8,'#788678');this.box(-3.6,.46,6,3.8,.035,5.8,'#d7d2b9');this.box(5.2,.46,6.2,11.9,.035,5.7,'#cdd7cd')
    this.box(-5.6,.9,6,.13,.9,5.7,'#e7dec8');this.box(-.7,.9,6,.13,.9,5.7,'#e7dec8')
    this.treadmill(-10.6,5);this.treadmill(-8.7,5)
    this.box(-7,1.1,7.6,1.5,.15,.5,'#333d3e');for(const x of [-7.6,-7.1,-6.6]) {this.box(x,1.3,7.6,.42,.07,.08,'#b2b5a8');for(const dx of [-.2,.2])this.cylinder(x+dx,1.3,7.6,.14,.13,'#343b39')}
    this.box(-10.7,.75,7.8,1.2,.22,2,'#424c4b');for(const x of [-11.3,-10.1])this.box(x,1.35,7.2,.06,1.8,.08,'#c0c4b5');this.box(-10.7,2.1,7.2,1.65,.07,.07,'#b8bdba')
    for(const x of [-11.35,-10.05])this.box(x,2.1,7.2,.15,.52,.52,'#303a39')
    this.box(-7.8,.49,6.2,1.1,.035,2,'#b3a6b9')
    this.sofa(-3.6,7.6);this.sofa(-3.6,4.4,-1);this.box(-3.6,.78,6,2.1,.14,1.1,'#c5a682');this.box(-3.6,.57,6,.2,.45,.7,'#8c7c64');this.plant(-4.7,4.1)
    for(const x of [-4.1,-3.1]) {this.cylinder(x,.94,6,.12,.2,'#fff4da');this.cylinder(x,1.046,6,.09,.012,'#674830')}
    // Separate dining pavilion: generous circulation behind all eight chairs.
    this.box(-4.5,.3,-14.2,13,.25,7.6,'#ded3b9')
    for(let z=-17.8;z<-10.4;z+=.6)this.box(-4.5,.435,z,12.8,.008,.018,'#c8b99a')
    this.box(-4.5,1.4,-18,13,2,.18,'#eee5d4');this.box(-11,.85,-14.2,.16,1,7.6,'#eee5d4');this.box(2,.85,-14.2,.16,1,7.6,'#eee5d4')
    this.box(-1.05,.3,-9.95,1.3,.25,1.1,'#ded3b9')
    this.box(-5.8,1.12,-14.2,8.2,.18,1.7,'#b9946a')
    for(const x of [-9.3,-2.3])for(const z of [-14.8,-13.6])this.box(x,.74,z,.12,.7,.12,'#726752')
    diningSeats.forEach(([x,z],i)=>{this.chair(x,z,i%2===0?Math.PI:0);this.cylinder(x,1.23,i%2===0?-14.65:-13.75,.25,.025,'#f5f0dd')})
    // Kitchenette stays on the side; the entrance and seating aisles stay clear.
    this.box(.8,.9,-14.8,1.2,1,3.3,'#aab395');this.box(.8,1.44,-14.8,1.35,.1,3.4,'#f0e9d6')
    this.box(.8,1.73,-15.7,.55,.5,.6,'#475954');this.cylinder(.8,1.62,-14.5,.17,.25,'#ece6cd')
    this.plant(1,-17.2);this.plant(-10.3,-17.2)
    this.sign('DINING PAVILION | 8 SEATS',-5.2,2.5,-17.85,6.5)
    // Enclosed meeting annex, eight dedicated seats, open door, and smart TV.
    this.box(-15.6,.3,-4.2,7.4,.25,6.8,'#d8c4a5')
    this.box(-15.6,1.6,-7.6,7.4,2.5,.18,'#eee5d4')
    this.box(-19.3,1.1,-4.2,.18,1.5,6.8,'#eee5d4')
    this.box(-15.6,.95,-.8,7.4,1.2,.18,'#eee5d4')
    this.box(-11.9,1.1,-6,.18,1.5,3.2,'#eee5d4');this.box(-11.9,1.1,-1.5,.18,1.5,1.4,'#eee5d4')
    this.box(-12.5,1.25,-3.9,1.2,2,.12,'#977b58')
    this.box(-15.6,1,-4.2,4.4,.18,1.7,'#927454')
    for(const [x,z] of meetingSeats)this.chair(x,z)
    this.box(-15.6,2.15,-7.45,3.5,1.8,.12,'#222b2e');this.box(-15.6,2.15,-7.37,3.3,1.6,.02,'#355c65')
    this.sign('MONDAY 09:00 | TEAM SYNC',-15.6,2.15,-7.34,3.1)
    // Outdoor smoking area stays away from entrances and food areas.
    this.box(-16.7,.08,6.2,3.8,.1,4.2,'#9ca18f');this.box(-17,.58,6.2,1.1,.18,2.7,'#8a755e');this.cylinder(-15.8,.75,7.2,.18,.65,'#555c56');this.cylinder(-15.8,1.1,7.2,.32,.08,'#3f4741')
    this.box(-2.3,1.1,4.1,1,.13,.7,'#d6c5a6');this.box(-2.3,1.4,4.1,.47,.52,.4,'#4b554d')
    for(const [i,name] of names.entries()) {this.desk(name,...positions[name]);this.bed(name,...beds[name],i)}
    this.sign('BENJIE + JUDITH | PRIVATE OFFICE',-7,3.25,-9.12,7.8);this.sign('THE DEVELOPMENT STUDIO',3.9,3.25,-9.12,6.2)
    this.sign('GYM & RECOVERY',-9,1.5,3.5,3.2);this.sign('COFFEE LOUNGE',-3.6,1.5,3.5,3.2);this.sign('MEETING ROOM | 8 SEATS',-15.6,1.5,-.65,5);this.sign('QUIET HOURS',5.2,1.3,3.5,3,'#6d7e7c');this.sign('SMOKING AREA',-16.7,2.1,8.5,4.2,'#62695e')
    for(const x of [-18.5,-14.9])this.box(x,1,8.5,.09,2,.09,'#62695e')
    this.sign('BENJIE CREATIVE CAMPUS',-7,1.3,11,5.3);for(const x of [-9,-5])this.box(x,.6,11,.08,1.2,.09,'#647151')
    for(const [x,z] of [[-11.8,-8.3],[-2.3,-8.3],[10.5,-8.3],[10.5,1.2],[-11.8,1.2],[.3,8.8]])this.plant(x,z)
  }
  car(x,z,color) {
    this.box(x,.48,z,1.65,.65,3,color);this.box(x,.98,z-.15,1.42,.55,1.5,color);this.box(x,1.05,z+.64,1.3,.43,.04,'#b6ced0');this.box(x,1.05,z-.94,1.3,.4,.04,'#b6ced0')
    for(const dx of [-.8,.8])for(const dz of [-.93,.93])this.box(x+dx,.3,z+dz,.17,.48,.53,'#343c38')
  }
  treadmill(x,z) {
    this.box(x,.63,z,1.25,.25,2.2,'#d0d2c6');this.box(x,.79,z, .89,.05,1.87,'#364344')
    for(let i=0;i<6;i++)this.box(x,.82,z-.7+i*.29,.83,.013,.024,'#64736a')
    for(const dx of [-.56,.56])this.box(x+dx,1.3,z-.72,.07,1.45,.07,'#cad0c1');this.box(x,2.05,z-.75,1.22,.25,.4,'#424f4d');this.box(x,2.19,z-.74,.4,.013,.24,'#97cbbb')
  }
  sofa(x,z,facing=1) {
    this.box(x,.81,z,2.2,.6,.95,'#b7bc98');this.box(x,1.14,z+.44*facing,2.2,.9,.2,'#b7bc98');for(const dx of [-1,1])this.box(x+dx,1.05,z,.23,.6,1.05,'#a5ae8a')
  }
  makePerson(member) {
    const tex=this.textureLoader.load(`/workadventure-map/tilesets/characters/${member.profile}.png?v=7`);tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;tex.colorSpace=THREE.SRGBColorSpace;tex.repeat.set(1/3,1/4)
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,alphaTest:.08}));sprite.scale.set(1.28,1.28,1);this.scene.add(sprite)
    // A separate cropped head lies flat on the pillow, with the body under the duvet.
    const headTex=tex.clone();headTex.repeat.set(1/3,15/128);headTex.offset.set(1/3,1-15/128)
    const head=new THREE.Mesh(new THREE.PlaneGeometry(.53,.5),new THREE.MeshBasicMaterial({map:headTex,transparent:true,alphaTest:.08,side:THREE.DoubleSide}));head.rotation.x=-Math.PI/2;this.scene.add(head)
    const tag=document.createElement('button');tag.className='campus-tag';tag.addEventListener('click',()=>this.select(member.profile));$('#campus-labels').append(tag)
    const p={member,sprite,tex,head,tag,x:0,z:0,initialized:false,route:[],mode:'desk'};this.people.set(member.profile,p);return p
  }
  update(snapshot) {
    this.snapshot=snapshot
    const manager={profile:'benjie',name:'BENJIE',role:'Hermes Main',level:'Manager',state:snapshot.manager.on_shift?'available':'off_shift',state_label:snapshot.manager.on_shift?'On shift · no tracked task':'Off shift',skills:['Team coordination','Review & approvals'],shift_label:'10 PM–8 AM',personal:'Night shift',recorded_seconds_today:null,recorded_seconds_week:null}
    Object.assign(manager,{activity:snapshot.manager.activity,activity_label:snapshot.manager.activity_label,activity_source:snapshot.manager.activity_source,state_label:snapshot.manager.on_shift?'On shift':snapshot.manager.activity_label})
    this.members=[manager,...snapshot.members]
    for(const m of this.members) {const p=this.people.get(m.profile)||this.makePerson(m);p.member=m;p.tag.className=`campus-tag ${m.state} ${m.profile===this.selected?'selected':''}`;p.tag.innerHTML=`<strong><i></i>${safe(m.name)}</strong><small>${safe(m.state_label)} · ${m.recorded_seconds_today == null?'untracked':duration(m.recorded_seconds_today)}</small>`;p.tag.setAttribute('aria-label',`${m.name}: ${m.state_label}. ${m.current_task?.title || 'No active task'}`);this.place(p)}
    for(const m of this.members) {
      const tag=this.people.get(m.profile).tag
      const role=document.createElement('span');role.className='campus-position';role.textContent=m.role
      tag.prepend(role)
      tag.title=`${m.role} · ${m.level} — ${m.name}`
      tag.setAttribute('aria-label',`${m.role}, ${m.name}: ${m.state_label}. ${m.current_task?.title || 'No active task'}`)
    }
    const signature=JSON.stringify(this.members)
    if(signature!==this.lastUISignature && document.activeElement?.id!=='routine-preview') {
      this.renderInspector();this.renderRoster();this.lastUISignature=signature
    }
  }
  modeFor(p) {
    if(p.member.profile===this.selected && this.preview!=='live')return this.preview
    if(p.member.state==='leave')return 'leave'
    if(p.member.activity==='meeting')return 'meeting'
    if(p.member.state==='off_shift')return ({coffee:'lounge',private:'desk'}[p.member.activity]||p.member.activity||'lounge')
    if(p.member.state==='break')return 'break'
    return p.member.state==='off_shift'?'sleep':'desk'
  }
  place(p) {
    const mode=this.modeFor(p);let target
    if(mode==='sleep')target=beds[p.member.profile]
    else if(mode==='gym')target=[names.indexOf(p.member.profile)%2 ? -10.6 : -8.7,5]
    else if(['walk','break','lounge'].includes(mode))target=[-4.2+(names.indexOf(p.member.profile)%2)*1.2,names.indexOf(p.member.profile)%4<2 ? 7.3 : 4.7]
    else if(mode==='dining')target=diningSeats[names.indexOf(p.member.profile)]
    else if(mode==='meeting')target=meetingSeats[names.indexOf(p.member.profile)]
    else if(mode==='smoke')target=[-17,6.2]
    else target=[positions[p.member.profile][0],positions[p.member.profile][1]+1.25]
    const changed=p.mode!==mode;p.mode=mode
    if(!p.initialized) {p.x=target[0];p.z=target[1];p.initialized=true}
    else if(changed) {
      // Rooms connect through the cross corridor. Rest/leave changes settle immediately.
      if(mode==='sleep'||mode==='leave'||p.lastMode==='sleep'||p.lastMode==='leave') {p.x=target[0];p.z=target[1];p.route=[]}
      else {
        // Leave desks through the side aisle, never through the next row's furniture.
        const fromAisle=p.lastMode==='desk'?positions[p.member.profile][0]+1.95:p.x
        const toAisle=mode==='desk'?positions[p.member.profile][0]+1.95:target[0]
        p.route=[[fromAisle,p.z],[fromAisle,2.6],[toAisle,2.6],[toAisle,target[1]],target]
        if(mode==='dining')p.route=[[fromAisle,p.z],[fromAisle,2.6],[-1.05,2.6],...diningApproach(names.indexOf(p.member.profile))]
        else if(p.lastMode==='dining')p.route=[...diningApproach(names.indexOf(p.member.profile)).slice().reverse(),[-1.05,2.6],[toAisle,2.6],[toAisle,target[1]],target]
      }
    }
    p.lastMode=mode
    p.tag.classList.toggle('sleeping-pose',mode==='sleep')
    const caption=p.tag.querySelector('small')
    if(caption)caption.textContent=`${p.member.profile===this.selected && this.preview!=='live'?'Preview: '+mode:p.member.state_label} · ${p.member.recorded_seconds_today==null?'untracked':duration(p.member.recorded_seconds_today)}`
  }
  select(profile) {this.selected=profile;this.preview='live';for(const p of this.people.values()){p.tag.classList.toggle('selected',p.member.profile===profile);this.place(p)}this.renderInspector();this.renderRoster()}
  renderInspector() {
    const m=this.members.find(m=>m.profile===this.selected);if(!m)return
    const task=m.current_task
    $('#campus-inspector').innerHTML=`<span class="inspector-kicker">TEAM MEMBER</span><div class="inspector-portrait"><span style="background-image:url('./workadventure-map/tilesets/characters/${m.profile}.png?v=7')"></span></div><h3>${safe(m.name)}</h3><p class="role">${safe(m.role)}<br>${safe(m.level)} · ${m.profile==='judith'?'Female':'Male'}</p><span class="inspector-state">${safe(m.state_label)}</span><div class="inspector-task"><span class="inspector-kicker">${task?'CURRENT ASSIGNMENT':'CURRENT ACTIVITY'}</span>${task?safe(task.title):m.state==='off_shift'?'Off shift · resting in the campus visualization.':m.state==='leave'?'On leave · away from campus.':m.state==='break'?'On a scheduled 30-minute rest break.':'No active assignment. Ready for a task.'}${task?`<div class="inspector-meta">${safe(task.status)}${m.task_elapsed_seconds!=null?' · '+duration(m.task_elapsed_seconds)+' since task started':''}</div>`:''}</div><span class="inspector-kicker">RECORDED WORK TODAY</span><div class="inspector-time">${m.recorded_seconds_today==null?'Not tracked':duration(m.recorded_seconds_today)}</div><p class="inspector-meta">This week: ${m.recorded_seconds_week==null?'not tracked':duration(m.recorded_seconds_week)}<br>${safe(m.shift_label || (m.shift==='night'?'10 PM–8 AM':'9 AM–5 PM'))}<br>${safe(m.personal||'')}</p><p class="inspector-meta">${(m.skills||[]).map(safe).join(' · ')}</p>${m.telegram_url?`<div class="inspector-links"><a href="${safe(m.telegram_url)}" target="_blank" rel="noreferrer">Open Telegram desk ↗</a></div>`:''}<div class="routine-controls"><label class="inspector-kicker" for="routine-preview">PREVIEW CHARACTER ROUTINE</label><select id="routine-preview"></select><p class="routine-note">${this.preview==='live'?'Routines illustrate status; recorded time comes from Hermes.':'Animation preview only. Hermes status and work time are unchanged.'}</p></div>`
    const routines=document.createElement('div');routines.className='routine-buttons';routines.setAttribute('role','group');routines.setAttribute('aria-label','Preview character routine')
    for(const [value,label] of [['live','Live'],['desk','Computer'],['walk','Sofa'],['dining','Dining'],['meeting','Meeting'],['smoke','Smoking area'],['gym','Gym'],['sleep','Rest']]) {
      const button=document.createElement('button');button.textContent=label;button.setAttribute('aria-pressed',String(this.preview===value));button.onclick=()=>{this.preview=value;this.place(this.people.get(this.selected));this.renderInspector()};routines.append(button)
    }
    $('#routine-preview').replaceWith(routines)
    const life=document.createElement('p');life.className='inspector-meta';life.textContent=`${m.activity_label||''} · ${m.activity_source||'Schedule'} · ${m.completed_tasks||0} verified tasks done`;document.querySelector('.inspector-task').prepend(life)
    document.querySelector('.routine-controls label').removeAttribute('for')
    if(m.profile!=='benjie') {const reviewButton=document.createElement('button');reviewButton.className='review-worker-button';reviewButton.textContent='Review work & access';reviewButton.onclick=()=>document.dispatchEvent(new CustomEvent('worker-review',{detail:m.profile}));document.querySelector('.inspector-task').after(reviewButton)}
    if(task?.scheduled_for) {
      const schedule=document.createElement('p');schedule.className='inspector-meta';schedule.textContent='Earliest start: '+new Date(task.scheduled_for).toLocaleString('en-PH',{timeZone:'Asia/Singapore',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' · waits for prerequisite';document.querySelector('.inspector-task').append(schedule)
    }
  }
  renderRoster() {
    $('#campus-roster').innerHTML=this.members.map(m=>`<button class="roster-person ${m.profile===this.selected?'selected':''}" data-person="${m.profile}"><strong>${safe(m.name)}</strong><span title="${safe(m.current_task?.title||m.state_label)}">${safe(m.current_task?.title||m.state_label)}</span><small>${m.recorded_seconds_today==null?'Work time untracked':duration(m.recorded_seconds_today)+' recorded today'}</small></button>`).join('')
    document.querySelectorAll('[data-person]').forEach(b=>b.addEventListener('click',()=>this.select(b.dataset.person)))
  }
  resize() {const el=$('#office-map');if(!el.clientWidth||!el.clientHeight)return;this.renderer.setSize(el.clientWidth,el.clientHeight);const aspect=el.clientWidth/el.clientHeight;const h=22/Math.min(1,aspect);this.camera.left=-h*aspect;this.camera.right=h*aspect;this.camera.top=h;this.camera.bottom=-h;this.camera.zoom=this.zoom;this.camera.updateProjectionMatrix()}
  bind() {
    $('#campus-zoom-in').onclick=()=>{this.zoom=Math.min(2.8,this.zoom+.2);this.resize()};$('#campus-zoom-out').onclick=()=>{this.zoom=Math.max(.65,this.zoom-.2);this.resize()};$('#campus-reset').onclick=()=>{this.zoom=1;this.yaw=.58;this.tour=false;$('#campus-tour').setAttribute('aria-pressed','false');this.resize()};$('#campus-tour').onclick=()=>{this.tour=!this.tour;$('#campus-tour').setAttribute('aria-pressed',String(this.tour))}
    const canvas=this.renderer.domElement;let pointer=null
    canvas.addEventListener('pointerdown',e=>{pointer=e.clientX;canvas.setPointerCapture(e.pointerId)})
    canvas.addEventListener('pointermove',e=>{if(pointer!==null){this.yaw+=(e.clientX-pointer)*.004;pointer=e.clientX;this.tour=false;$('#campus-tour').setAttribute('aria-pressed','false')}})
    canvas.addEventListener('pointerup',()=>pointer=null);canvas.addEventListener('pointercancel',()=>pointer=null)
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom=THREE.MathUtils.clamp(this.zoom-e.deltaY*.001,.65,2.8);this.resize()},{passive:false})
  }
  frame() {
    const delta=Math.min(this.clock.getDelta(),.05);const t=this.clock.elapsedTime
    if(document.hidden || !$('#office-view').classList.contains('active'))return
    if(this.tour && !reduced)this.yaw+=delta*.12
    this.camera.position.set(Math.sin(this.yaw)*39,36,Math.cos(this.yaw)*39);this.camera.lookAt(0,0,1);this.camera.updateMatrixWorld()
    const labels=[]
    for(const p of this.people.values()) {
      let direction=9;let walking=false
      if(p.route.length) {const [x,z]=p.route[0];const dx=x-p.x,dz=z-p.z,dist=Math.hypot(dx,dz);walking=true;direction=Math.abs(dx)>Math.abs(dz)?(dx>0?6:3):(dz>0?0:9);if(dist<.05||reduced){p.x=x;p.z=z;p.route.shift()}else{const step=Math.min(dist,delta*2.2);p.x+=dx/dist*step;p.z+=dz/dist*step}}
      if(p.mode==='gym'&&!p.route.length){walking=true;direction=9}
      if(p.mode==='dining'&&!walking)direction=names.indexOf(p.member.profile)%2===0?0:9
      const frame=walking&&!reduced?[0,1,2,1][Math.floor(t*7)%4]:1
      p.tex.offset.set(frame/3,1-(Math.floor(direction/3)+1)/4)
      const seated=['walk','break','lounge','dining','meeting'].includes(p.mode)&&!walking
      p.sprite.position.set(p.x,seated ? .78 : p.mode==='desk'&&!walking ? 1.33 : 1.1,p.z);p.sprite.scale.set(1.28,seated ? .9 : 1.28,1);p.sprite.visible=!['sleep','leave'].includes(p.mode)
      p.head.visible=p.mode==='sleep';const [bx,bz]=beds[p.member.profile];p.head.position.set(bx,1.04,bz-.78)
      const anchor=new THREE.Vector3(p.x,p.mode==='sleep'?1.0:2.2,p.z+(p.mode==='sleep'?1.3:0)).project(this.camera);const stage=$('#office-map');const x=(anchor.x*.5+.5)*stage.clientWidth,y=(-anchor.y*.5+.5)*stage.clientHeight
      p.tag.style.display=p.mode==='leave'||Math.abs(anchor.x)>1||Math.abs(anchor.y)>1?'none':''
      if(p.tag.style.display!=='none')labels.push({p,x,y,w:p.tag.offsetWidth,h:p.tag.offsetHeight})
    }
    const placed=[]
    for(const label of labels.sort((a,b)=>a.y-b.y)) {
      let y=label.y-label.h
      for(let attempt=0;attempt<12;attempt++) {const hit=placed.find(q=>Math.abs(label.x-q.x)<(label.w+q.w)/2+3 && y<q.y+q.h+3 && y+label.h>q.y-3);if(!hit)break;y=hit.y+hit.h+4}
      label.p.tag.style.transform=`translate(${label.x}px,${y}px) translateX(-50%)`;placed.push({...label,y})
    }
    this.renderer.render(this.scene,this.camera)
  }
}
