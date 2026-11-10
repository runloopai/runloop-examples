const test=require('node:test');const assert=require('node:assert/strict');const WebSocket=require('ws');
function client(){return new Promise((resolve,reject)=>{const ws=new WebSocket('ws://localhost:3000');ws.on('error',reject);ws.once('open',()=>resolve(ws))})}
function message(ws,predicate){return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{ws.off('message',handler);reject(new Error('Message timeout'))},5000);function handler(raw){const m=JSON.parse(raw);if(predicate(m)){clearTimeout(timeout);ws.off('message',handler);resolve(m)}}ws.on('message',handler)})}
test('serves game and assets',async()=>{for(const path of ['/','/style.css','/game.js'])assert.equal((await fetch('http://localhost:3000'+path)).status,200)});
test('two pilots share an arena, steer, and respawn',async()=>{const a=await client(),b=await client();try{let joined=message(a,m=>m.type==='joined');a.send(JSON.stringify({type:'join',name:'Test Alpha',color:'#c4ff63'}));let first=await joined;joined=message(b,m=>m.type==='joined');b.send(JSON.stringify({type:'join',name:'Test Beta'}));let second=await joined;assert.notEqual(first.id,second.id);let s=await message(a,m=>m.type==='state'&&m.snakes.some(s=>s.id===second.id));assert.equal(s.food.length,850);assert.ok(s.snakes.some(s=>s.id===first.id));assert.ok(s.snakes.filter(s=>s.bot).length===18);a.send(JSON.stringify({type:'input',angle:1,boost:true}));s=await message(b,m=>m.type==='state'&&m.snakes.some(s=>s.id===first.id&&s.boost));assert.ok(s.players>=2);joined=message(a,m=>m.type==='joined');a.send(JSON.stringify({type:'join',name:'Respawn'}));const next=await joined;assert.notEqual(next.id,first.id);s=await message(a,m=>m.type==='state');assert.ok(!s.snakes.some(s=>s.id===first.id));}finally{a.close();b.close()}});
const Movement=require('./public/movement.js');
test('responsive steering, wraparound and faster boost',()=>{
 const s={x:0,y:0,a:0};for(let i=0;i<60;i++)Movement.step(s,0,false,1/60);assert.ok(Math.abs(s.x-300)<.001);
 const fast={x:0,y:0,a:0};for(let i=0;i<60;i++)Movement.step(fast,0,true,1/60);assert.ok(Math.abs(fast.x-540)<.001);
 const turn={x:0,y:0,a:0};for(let i=0;i<12;i++)Movement.step(turn,Math.PI/2,false,1/60);assert.ok(Math.abs(turn.a-Math.PI/2)<.001);
 const wrap={x:0,y:0,a:Math.PI-.01};Movement.step(wrap,-Math.PI+.01,false,1/60);assert.ok(wrap.a>Math.PI);
});
