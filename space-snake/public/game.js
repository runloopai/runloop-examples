const $=s=>document.querySelector(s),canvas=$('#space'),ctx=canvas.getContext('2d'),map=$('#map'),mc=map.getContext('2d');
let W,H,dpr;function resize(){W=innerWidth;H=innerHeight;dpr=Math.min(devicePixelRatio,2);canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}addEventListener('resize',resize);resize();
const palette=['#c4ff63','#a78bfa','#ff739d','#68dbff','#ffbd68','#65f4bd'];let color=palette[0],state={snakes:[],food:[]},id=null,playing=false,boost=false,angle=0,cam={x:3200,y:3200},world=6400,ws,connected=false,muted=true,audioCtx,keys={},last=0;
let local=null, pointer=null, inputMode='pointer', receivedAt=0;
const visuals=new Map();
function acceptState(m){
  collectEffects(m);receivedAt=performance.now();
  const alive=new Set(m.snakes.map(s=>s.id));
  for(const key of visuals.keys())if(!alive.has(key))visuals.delete(key);
  for(const s of m.snakes){
    if(!visuals.has(s.id))visuals.set(s.id,structuredClone(s));
  }
  state=m;
}
function steer(){
  const dx=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0);
  const dy=(keys.ArrowDown||keys.KeyS?1:0)-(keys.ArrowUp||keys.KeyW?1:0);
  if(dx||dy){angle=Math.atan2(dy,dx);return;}
  if(inputMode==='pointer'&&pointer&&local){
    const x=pointer.x-W/2,y=pointer.y-H/2;
    if(Math.hypot(x,y)>12)angle=Math.atan2(y,x);
  }
}
function sendInput(){if(playing&&connected&&ws.readyState===1){steer();ws.send(JSON.stringify({type:'input',angle,boost}));}}
// All visible snakes follow the authoritative path. Do not independently advance
// the local head then drag its entire trail back toward an older server packet.
// That previous approach caused sideways sliding and frame-rate-dependent bodies.
function animateSnakes(dt){
  const alpha=1-Math.exp(-dt*30);
  const age=Math.min(.05,Math.max(0,(performance.now()-receivedAt)/1000));
  for(const s of state.snakes){
    const v=visuals.get(s.id);if(!v)continue;
    const projected={x:s.x,y:s.y,a:s.a};
    Movement.step(projected,s.target,s.boost,age);
    v.x+=(projected.x-v.x)*alpha;
    v.y+=(projected.y-v.y)*alpha;
    v.a+=Math.atan2(Math.sin(projected.a-v.a),Math.cos(projected.a-v.a))*alpha;
    v.body=s.body.map((p,i)=>{const old=v.body[i]||p;return {x:old.x+(p.x-old.x)*alpha,y:old.y+(p.y-old.y)*alpha};});
    if(v.body.length)v.body[0]={x:v.x,y:v.y};
    v.score=s.score;v.boost=s.boost;
    if(s.id===id)local=v;
  }
}
const stars=Array.from({length:330},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.2+.2,a:Math.random()*.6+.15}));
for(const c of palette){const b=document.createElement('button');b.className='swatch'+(c===color?' active':'');b.style.setProperty('--c',c);b.setAttribute('aria-label','Choose '+c+' glow');b.onclick=()=>{color=c;document.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));b.classList.add('active')};$('#colors').append(b)}
function connect(){ws=new WebSocket(location.origin.replace(/^http/,'ws'));ws.onopen=()=>{connected=true;$('#connection').textContent='ALL SYSTEMS ONLINE';$('#play').disabled=false;};ws.onclose=()=>{connected=false;$('#connection').textContent='RECONNECTING…';$('#play').disabled=true;if(playing){playing=false;id=null;setUI();}setTimeout(connect,1800)};ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==='welcome')world=m.world;if(m.type==='joined'){id=m.id;playing=true;boost=false;keys={};inputMode='pointer';prevScore=0;local=structuredClone(m.snake);angle=local.a;cam={x:local.x,y:local.y};visuals.set(id,structuredClone(local));document.activeElement?.blur();setUI();sendInput();}if(m.type==='state'){acceptState(m);updateUI()}if(m.type==='dead'){playing=false;boost=false;$('#final-score').textContent=m.score.toLocaleString();$('#death').showModal();setUI();tone(100,.4)}}}connect();
function setUI(){document.body.classList.toggle('playing',playing);$('#hud').hidden=!playing;$('#game-tip').hidden=!playing;$('#mobile-boost').hidden=!playing;}
function join(){if(!connected)return;$('#death').close();ws.send(JSON.stringify({type:'join',name:$('#name').value||'Space cadet',color}));tone(520,.12)}$('#play').onclick=join;$('#retry').onclick=join;$('#name').addEventListener('keydown',e=>{if(e.key==='Enter')join()});$('#back').onclick=()=>$('#death').close();$('#leave').onclick=()=>{playing=false;id=null;ws.close();setUI()};$('#help').onclick=()=>$('#help-modal').showModal();$('.close').onclick=$('.close-help').onclick=()=>$('#help-modal').close();
function tone(freq,duration){if(muted)return;audioCtx??=new (window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(freq/2,audioCtx.currentTime+duration);g.gain.setValueAtTime(.09,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration)}$('#sound').onclick=()=>{muted=!muted;$('#sound').innerHTML='♫ <span>SOUND '+(muted?'OFF':'ON')+'</span>';tone(660,.2)};
let prevScore=0;function updateUI(){const sorted=[...state.snakes].sort((a,b)=>b.score-a.score);const leaders=$('#leaders');leaders.replaceChildren();sorted.slice(0,5).forEach((s,i)=>{const row=document.createElement('div');row.className='leader'+(s.id===id?' is-you':'');const pos=document.createElement('span');pos.className='pos';pos.textContent=String(i+1).padStart(2,'0');const dot=document.createElement('span');dot.className='dot';dot.style.background=s.color;const name=document.createElement('span');name.className='pilot';name.textContent=s.name+(s.id===id?' (you)':'');const mass=document.createElement('span');mass.className='mass';mass.textContent=s.score.toLocaleString();row.append(pos,dot,name,mass);leaders.append(row)});$('#population').textContent=`${state.players} PILOT${state.players===1?'':'S'} + ${state.snakes.filter(s=>s.bot).length} BOTS IN ORBIT`;const me=state.snakes.find(s=>s.id===id);if(me){$('#score').textContent=me.score.toLocaleString();$('#rank').textContent='#'+(sorted.findIndex(s=>s.id===id)+1);if(me.score>prevScore)tone(800,.06);prevScore=me.score;}mc.clearRect(0,0,220,140);for(const s of state.snakes){mc.fillStyle=s.id===id?'#fff':s.color;mc.globalAlpha=s.id===id?1:.55;mc.beginPath();mc.arc(s.x/world*220,s.y/world*140,s.id===id?3:1.8,0,7);mc.fill();}mc.globalAlpha=1;}
addEventListener('pointermove',e=>{if(e.target.closest('button,dialog'))return;pointer={x:e.clientX,y:e.clientY};inputMode='pointer';if(playing)sendInput();});
canvas.addEventListener('pointerdown',e=>{if(!playing)return;canvas.setPointerCapture(e.pointerId);pointer={x:e.clientX,y:e.clientY};inputMode='pointer';if(e.pointerType!=='touch')boost=true;sendInput();});
function release(){boost=false;sendInput();}
addEventListener('pointerup',release);addEventListener('pointercancel',release);
$('#mobile-boost').onpointerdown=e=>{e.preventDefault();e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);boost=true;sendInput();};
addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code)&&playing&&!$('#help-modal').open){e.preventDefault();keys[e.code]=true;if(e.code==='Space')boost=true;else inputMode='keyboard';sendInput();}});
addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='Space')boost=false;sendInput();});
addEventListener('blur',()=>{keys={};pointer=null;release();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys={};pointer=null;release();}});
setInterval(sendInput,1000/60);
function glow(x,y,r,c,alpha=1){ctx.globalAlpha=alpha;ctx.shadowColor=c;ctx.shadowBlur=r*4;ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.globalAlpha=1}
// Paint a continuous luminous hull, rather than overlapping beads.
function snake(points,c,r,t,name,headAngle){
  if(points.length<2)return;
  const path=()=>{ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length-1;i++){const next=points[i+1];ctx.quadraticCurveTo(points[i].x,points[i].y,(points[i].x+next.x)/2,(points[i].y+next.y)/2);}const end=points[points.length-1];ctx.lineTo(end.x,end.y);};
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';path();
  ctx.shadowColor=c;ctx.shadowBlur=r*2;ctx.strokeStyle=c+'40';ctx.lineWidth=r*2.7;ctx.stroke();
  ctx.shadowBlur=0;ctx.strokeStyle='#101724';ctx.lineWidth=r*2.15;ctx.stroke();
  ctx.strokeStyle=c;ctx.lineWidth=r*1.85;ctx.stroke();
  ctx.strokeStyle='#ffffff38';ctx.lineWidth=r*.62;ctx.stroke();
  // Discrete hull lights follow arc length so detail stays consistent at any frame rate.
  let distance=0;
  for(let i=points.length-1;i>0;i--){distance+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);if(distance<r*1.6)continue;distance=0;const p=points[i],n=points[i-1],a=Math.atan2(n.y-p.y,n.x-p.x);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.strokeStyle='#17252e60';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-r*.25,-r*.72);ctx.quadraticCurveTo(r*.2,0,-r*.25,r*.72);ctx.stroke();ctx.fillStyle='#ffffff99';ctx.fillRect(-1,-r*.62,2,2);ctx.restore();}
  const head=points[0],a=headAngle??Math.atan2(head.y-points[1].y,head.x-points[1].x);
  ctx.translate(head.x,head.y);ctx.rotate(a);
  ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,r*1.1,r,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#07131e';ctx.beginPath();ctx.ellipse(r*.38,0,r*.47,r*.75,0,0,Math.PI*2);ctx.fill();
  for(const side of [-1,1]){ctx.fillStyle='#f2fff5';ctx.shadowColor=c;ctx.shadowBlur=5;ctx.beginPath();ctx.ellipse(r*.55,side*r*.39,r*.14,r*.17,0,0,7);ctx.fill();}
  ctx.restore();
  if(name){ctx.save();ctx.font='500 10px "Space Grotesk",sans-serif';ctx.textAlign='center';const width=ctx.measureText(name).width+18;ctx.fillStyle='#090d19c9';ctx.beginPath();ctx.roundRect(head.x-width/2,head.y-r-32,width,21,6);ctx.fill();ctx.fillStyle=c;ctx.fillText(name,head.x,head.y-r-18);ctx.restore();}
}
const atmosphere=document.createElement('canvas');atmosphere.width=1200;atmosphere.height=800;
const ac=atmosphere.getContext('2d');
for(const [x,y,r,c] of [[760,320,440,'#514093'],[980,560,330,'#155e75'],[420,670,380,'#3b245d'],[630,220,180,'#66539c']]){const g=ac.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c+'55');g.addColorStop(.45,c+'20');g.addColorStop(1,c+'00');ac.fillStyle=g;ac.fillRect(0,0,1200,800);}
const particles=[];let previousFood=new Map();
function collectEffects(m){
  if(playing&&local)for(const f of m.food){const old=previousFood.get(f.id);if(old&&Math.hypot(old.x-f.x,old.y-f.y)>100&&Math.hypot(old.x-local.x,old.y-local.y)<95){for(let i=0;i<8;i++){const a=Math.random()*Math.PI*2,v=35+Math.random()*80;particles.push({x:old.x,y:old.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:1,c:old.c});}}}
  previousFood=new Map(m.food.map(f=>[f.id,{x:f.x,y:f.y,c:f.c}]));
  if(particles.length>160)particles.splice(0,particles.length-160);
}
function planet(x,y,r){
  ctx.save();ctx.translate(x,y);ctx.rotate(-.38);
  ctx.strokeStyle='#a89be51a';ctx.lineWidth=11;ctx.beginPath();ctx.ellipse(0,0,r*1.7,r*.38,0,0,Math.PI*2);ctx.stroke();
  const glow=ctx.createRadialGradient(-r*.35,-r*.4,0,0,0,r);glow.addColorStop(0,'#53516d');glow.addColorStop(.45,'#272c46');glow.addColorStop(.85,'#101628');glow.addColorStop(1,'#8682bd');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();
  ctx.strokeStyle='#b6aaee38';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(0,0,r*1.7,r*.38,0,0,Math.PI);ctx.stroke();ctx.restore();
}
function render(t){requestAnimationFrame(render);const dt=Math.min(50,t-last);last=t;ctx.clearRect(0,0,W,H);ctx.fillStyle='#080912';ctx.fillRect(0,0,W,H);const g=ctx.createRadialGradient(W*.63,H*.49,0,W*.6,H*.5,W*.6);g.addColorStop(0,'#241b3e88');g.addColorStop(.5,'#14132b44');g.addColorStop(1,'#08091200');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.drawImage(atmosphere,0,0,W,H);if(playing){animateSnakes(dt/1000);document.body.classList.toggle('boosting',boost);$('#drive-label').textContent=boost?'HYPERDRIVE ACTIVE':'CRUISE MODE';$('#speed-value').textContent=boost?'540':'300';}else document.body.classList.remove('boosting');const me=local;if(playing&&me){cam.x=me.x;cam.y=me.y}for(const s of stars){let x=((s.x*W-cam.x*.035)%W+W)%W,y=((s.y*H-cam.y*.035)%H+H)%H;ctx.fillStyle=`rgba(204,202,234,${s.a*(.8+.2*Math.sin(t*.0007+s.x*9))})`;ctx.beginPath();ctx.arc(x,y,s.r,0,7);ctx.fill();if(s.r>1.25){ctx.fillStyle='#ad9fd622';ctx.fillRect(x-4,y-.4,8,.8);ctx.fillRect(x-.4,y-4,.8,8)}}
if(playing){const zoom=.9;const project=p=>({x:(p.x-cam.x)*zoom+W/2,y:(p.y-cam.y)*zoom+H/2});ctx.strokeStyle='#a69ad510';ctx.lineWidth=1;for(let x=(W/2-cam.x*zoom)%90;x<W;x+=90){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=(H/2-cam.y*zoom)%90;y<H;y+=90){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}if(local){
  ctx.save();ctx.translate(W/2,H/2);ctx.rotate(angle);
  ctx.strokeStyle=color+'70';ctx.lineWidth=1.5;ctx.setLineDash([3,7]);
  ctx.beginPath();ctx.moveTo(26,0);ctx.lineTo(65,0);ctx.stroke();ctx.setLineDash([]);
  ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(69,-4);ctx.lineTo(75,0);ctx.lineTo(69,4);ctx.stroke();ctx.restore();
  if(pointer&&inputMode==='pointer'){ctx.save();ctx.strokeStyle=color+'90';ctx.lineWidth=1;ctx.beginPath();ctx.arc(pointer.x,pointer.y,8,0,Math.PI*2);ctx.stroke();ctx.fillStyle=color;ctx.fillRect(pointer.x-1,pointer.y-1,2,2);ctx.restore();}
}const planetPos=project({x:world*.55,y:world*.45});if(planetPos.x>-300&&planetPos.x<W+300&&planetPos.y>-300&&planetPos.y<H+300){ctx.globalAlpha=.42;planet(planetPos.x,planetPos.y,140);ctx.globalAlpha=1;}const edge=project({x:0,y:0});ctx.strokeStyle='#ff6e8d';ctx.lineWidth=3;ctx.shadowColor='#ff6e8d';ctx.shadowBlur=20;ctx.strokeRect(edge.x,edge.y,world*zoom,world*zoom);ctx.shadowBlur=0;for(const f of state.food){const p=project(f);if(p.x>-10&&p.x<W+10&&p.y>-10&&p.y<H+10){glow(p.x,p.y,f.v===3?5:2.5,f.c,.8+.2*Math.sin(t*.003+f.id));ctx.fillStyle='#ffffffcc';ctx.fillRect(p.x-.7,p.y-.7,1.4,1.4);}}for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt/650;if(p.life<=0){particles.splice(i,1);continue;}p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;const screen=project(p);glow(screen.x,screen.y,2*p.life,p.c,p.life);}for(const s of visuals.values()){const points=s.body.map(project);if(points.some(p=>p.x>-100&&p.x<W+100&&p.y>-100&&p.y<H+100))snake(points,s.color,10+(s.score/1000),t,s.name,s.a);if(s.boost&&points.length){const h=points[0];ctx.save();ctx.translate(h.x,h.y);ctx.rotate(s.a);ctx.strokeStyle=s.color;ctx.lineWidth=1.4;for(let j=0;j<7;j++){const phase=(t*.35+j*19)%95;ctx.globalAlpha=(1-phase/95)*.65;const side=j%2?1:-1;ctx.beginPath();ctx.moveTo(-phase-22,side*(17+j*2));ctx.lineTo(-phase-8,side*(17+j*2));ctx.stroke();}ctx.restore();}}}else{const cx=W*(W<761?.73:.63),cy=H*(W<761?.84:.49),scale=Math.min(W/(W<761?1150:1400),H/850);ctx.save();ctx.translate(cx,cy);ctx.scale(scale,scale);ctx.globalAlpha=.6;planet(160,180,90);ctx.globalAlpha=1;ctx.strokeStyle='#9e85d710';ctx.lineWidth=1;for(let r of [190,310,430]){ctx.beginPath();ctx.ellipse(0,0,r,r*.75,-.3,0,7);ctx.stroke()}for(let i=0;i<80;i++){let a=i*2.399,r=110+(i*43)%420;glow(Math.cos(a)*r,Math.sin(a)*r*.8,1.5+(i%3),palette[i%6],.5+.3*Math.sin(t*.001+i))}const points=[];for(let i=0;i<110;i++){const u=i/109;points.push({x:30+Math.sin(u*6.2-.6)*160+Math.sin(t*.0004+u*3)*9,y:-175+u*340+Math.cos(u*7)*20})}snake(points,color,23,t,null,-1.2);const p2=[];for(let i=0;i<60;i++){const u=i/59;p2.push({x:-210+Math.cos(u*3.3)*110,y:180+u*140+Math.sin(u*6+t*.0005)*16})}snake(p2,'#9b7aef',12,t,'nightshift',-1);const p3=[];for(let i=0;i<45;i++){let u=i/44;p3.push({x:205+u*140,y:-230+Math.sin(u*4)*55})}snake(p3,'#6cceef',9,t,'ORBIT',3);ctx.restore();}}
requestAnimationFrame(render);
