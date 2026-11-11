// Exercise the actual delivered player script without claiming browser review.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=process.argv[2],doc=fs.readFileSync(path.join(root,'index.html'),'utf8');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'presets.json'),'utf8')).presets;
const elements={};
function element(id){return elements[id]??=( {value:'0',checked:true,currentTime:0,children:[],add(x){this.children.push(x)},replaceChildren(){this.children=[]},append(x){this.children.push(x)},play(){this.played=true;return Promise.resolve()},classList:{toggle(){}}} )}
element('edition').value='video';
const context={document:{getElementById:element,createElement:()=>({classList:{toggle(){}}}),querySelectorAll:()=>element('timeline').children},Option:function(text,value){this.text=text;this.value=value}};
vm.createContext(context);vm.runInContext(doc.match(/<script>([\s\S]*)<\/script>/)[1],context);
assert.equal(element('preset').children.length,catalog.length);
for(let p=0;p<catalog.length;p++){
 element('preset').value=String(p);element('preset').onchange();
 assert.equal(element('timeline').children.length,catalog[p].shots.length);
 for(let i=0;i<catalog[p].shots.length;i++){
  const shot=catalog[p].shots[i];
  element('timeline').children[i].onclick();assert.equal(element('video').currentTime,shot.start);
  element('video').ontimeupdate();assert.ok(element('shot').textContent.startsWith(`${shot.start}–${shot.end}`));
  element('video').currentTime=shot.end-1/120;element('video').ontimeupdate();assert.ok(element('shot').textContent.startsWith(`${shot.start}–${shot.end}`));
 }
 element('video').currentTime=catalog[p].seconds;element('video').ontimeupdate();assert.ok(element('shot').textContent.includes(catalog[p].shots.at(-1).id));
 assert.ok(fs.existsSync(path.join(root,element('video').src)));
}
element('preset').value='0';element('edition').value='clean';element('edition').onchange();assert.equal(element('video').src,catalog[0].clean);
element('video').onended();assert.equal(+element('preset').value,1);
element('continuous').checked=false;element('video').onended();assert.equal(+element('preset').value,1);
element('continuous').checked=true;element('preset').value=String(catalog.length-1);element('video').onended();assert.equal(+element('preset').value,catalog.length-1);
console.log(`PASS: ${catalog.length} presets, ${catalog.reduce((n,p)=>n+p.shots.length,0)} timeline seeks, clean source, automatic progression and final stop`);
