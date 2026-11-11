// Exercise the actual delivered player script without claiming browser review.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=process.argv[2],doc=fs.readFileSync(path.join(root,'index.html'),'utf8');
const elements={};
function element(id){return elements[id]??=( {value:'0',checked:true,currentTime:0,children:[],add(x){this.children.push(x)},replaceChildren(){this.children=[]},append(x){this.children.push(x)},play(){this.played=true;return Promise.resolve()},classList:{toggle(){}}} )}
element('edition').value='video';
const context={document:{getElementById:element,createElement:()=>({classList:{toggle(){}}}),querySelectorAll:()=>element('timeline').children},Option:function(text,value){this.text=text;this.value=value}};
vm.createContext(context);vm.runInContext(doc.match(/<script>([\s\S]*)<\/script>/)[1],context);
assert.equal(element('preset').children.length,8);
for(let p=0;p<8;p++){
 element('preset').value=String(p);element('preset').onchange();
 assert.equal(element('timeline').children.length,10);
 for(let i=0;i<10;i++){
  element('timeline').children[i].onclick();assert.equal(element('video').currentTime,2*i);
  element('video').ontimeupdate();assert.ok(element('shot').textContent.startsWith(`${2*i}–${2*i+2}`));
 }
 assert.ok(fs.existsSync(path.join(root,element('video').src)));
}
element('preset').value='0';element('edition').value='clean';element('edition').onchange();assert.match(element('video').src,/clean.mp4$/);
element('video').onended();assert.equal(+element('preset').value,1);
element('continuous').checked=false;element('video').onended();assert.equal(+element('preset').value,1);
element('continuous').checked=true;element('preset').value='7';element('video').onended();assert.equal(+element('preset').value,7);
console.log('PASS: 8 presets, 80 timeline seeks, clean source, automatic progression and final stop');
