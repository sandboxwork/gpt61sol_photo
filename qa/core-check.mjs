import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {createCanvas,CanvasElement,ImageData,DOMMatrix,DOMPoint,Image} from '@napi-rs/canvas';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),psd=require('../atelier/node_modules/ag-psd');
Object.assign(globalThis,{HTMLCanvasElement:CanvasElement,ImageData,DOMMatrix,DOMPoint,Image,document:{createElement:t=>{assert.equal(t,'canvas');return createCanvas(1,1)}}});
const {processPixels,floodFill}=await import('../atelier/src/worker.js');
psd.initializeCanvas(createCanvas,undefined,(w,h)=>new ImageData(w,h));
class FakeWorker {postMessage(m){queueMicrotask(()=>{try{let reply;if(m.type==='psd')reply={id:m.id,psd:psd.readPsd(m.buffer,{useImageData:true,skipThumbnail:true})};else reply={id:m.id,data:m.type==='flood'?floodFill(m):processPixels(m.data,m.width,m.height,m.params)};this.onmessage({data:reply})}catch(e){this.onmessage({data:{id:m.id,error:e.message}})}})}}
globalThis.Worker=FakeWorker;
const {Editor,newLayer,canvas,sampleDocument}=await import('../atelier/src/engine.js');
const pixel=(c,x=1,y=1)=>[...c.getContext('2d').getImageData(x,y,1,1).data];
const e=new Editor();e.doc={name:'test',width:20,height:20,guides:[],layers:[]};
const base=newLayer('shape','base',{w:20,h:20,color:'#ff0000'});e.add(base);assert.deepEqual(pixel(await e.render()),[255,0,0,255]);
base.opacity=.5;e.commit('opacity');assert.equal(pixel(await e.render())[3],128);e.undo();assert.equal(e.layer().opacity,1);e.redo();assert.equal(e.layer().opacity,.5);e.undo();
const b=newLayer('shape','blue',{w:10,h:10,color:'#0000ff',x:5,y:5});e.add(b);assert.deepEqual(pixel(await e.render(),8,8),[0,0,255,255]);b.blend='multiply';e.commit('blend');assert.deepEqual(pixel(await e.render(),8,8),[0,0,0,255]);
e.selected=[b.id];e.duplicate();assert.equal(e.doc.layers.length,3);e.undo();assert.equal(e.doc.layers.length,2);e.selected=[base.id,b.id];e.group();const group=e.layer();assert.equal(group.type,'group');assert(e.doc.layers.filter(l=>l.id!==group.id).every(l=>l.parent===group.id));group.opacity=.5;e.commit('group opacity');assert.equal(pixel(await e.render(),8,8)[3],128);assert.throws(()=>e.ungroup());group.opacity=1;e.ungroup();assert.equal(e.doc.layers.length,2);
e.doc.layers[0].opacity=1;e.doc.layers[1].visible=false;e.commit('reset');const l=e.doc.layers[0];l.mask=canvas(20,20);l.mask.getContext('2d').fillStyle='white';l.mask.getContext('2d').fillRect(0,0,10,20);e.commit('mask');assert.equal(pixel(await e.render(),15,5)[3],0);assert.equal(pixel(await e.render(),5,5)[3],255);
l.filters=[{params:{invert:true}}];e.commit('invert');assert.deepEqual(pixel(await e.render(),5,5),[0,255,255,255]);l.filters=[];delete l.mask;e.commit('reset');
const adj=newLayer('adjustment','invert',{w:20,h:20,params:{invert:true},opacity:.5});e.add(adj);assert.deepEqual(pixel(await e.render()),[128,128,128,255]);adj.opacity=1;e.commit('full');assert.deepEqual(pixel(await e.render()),[0,255,255,255]);
const exported=await e.serialize();assert.equal(exported.format,'atelier');const restored=new Editor();await restored.load(structuredClone(exported));assert.deepEqual(pixel(await restored.render()),[0,255,255,255]);
const fill=floodFill({data:new Uint8ClampedArray([1,2,3,255,1,2,3,255,100,100,100,255]),width:3,height:1,x:0,y:0,color:[255,0,0,255]});assert.deepEqual([...fill],[255,0,0,255,255,0,0,255,100,100,100,255]);
for(const params of [{brightness:20},{contrast:50},{exposure:1},{black:30,white:200,gamma:1.5},{curve:[[0,0],[128,220],[255,255]]},{hue:120},{saturation:-100},{red:50},{bw:true},{invert:true},{sharpen:50},{noise:40},{pixelate:3}]){const data=new Uint8ClampedArray(5*5*4);for(let i=0;i<data.length;i+=4)data.set([80+(i*i%130),40,100,255],i);const got=processPixels(data,5,5,params);assert.equal(got.length,data.length);assert.notDeepEqual(got,data,JSON.stringify(params));}
const fixture={width:16,height:16,children:[{name:'Group',opacity:.75,blendMode:'pass through',children:[{name:'Raster',left:0,top:0,right:16,bottom:16,opacity:.8,blendMode:'multiply',imageData:{width:16,height:16,data:new Uint8ClampedArray(16*16*4).fill(255)},mask:{left:0,top:0,right:16,bottom:16,defaultColor:255,imageData:{width:16,height:16,data:new Uint8ClampedArray(16*16*4).fill(255)}}},{name:'Text',left:0,top:0,right:16,bottom:16,text:{text:'Hello',style:{fontSize:12,font:{name:'Arial'}}}},{name:'Adjustment',adjustment:{type:'brightness/contrast',brightness:20,contrast:10}}]}]};
const buf=psd.writePsd(fixture,{generateThumbnail:false});const imported=new Editor();await imported.importPSD(buf,'Fixture');assert.equal(imported.doc.layers.length,4);assert.equal(imported.doc.layers[0].name,'Group');assert.equal(imported.doc.layers[1].blend,'multiply');assert(imported.doc.layers[1].mask);assert.equal(imported.doc.layers[2].text,'Hello');assert.equal(imported.doc.layers[3].type,'adjustment');await imported.render();
const sample=new Editor();sampleDocument(sample);const preview=await sample.render(null,.5);await writeFile('sample.png',preview.toBuffer('image/png'));
console.log('PASS: real pixel compositing, opacity, undo/redo, groups, masks, blend modes, adjustment interpolation, project roundtrip, flood fill, 13 filter parameters, PSD hierarchy/text/mask/adjustment import, sample render');
