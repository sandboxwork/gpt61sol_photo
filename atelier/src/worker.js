import { readPsd, initializeCanvas } from 'ag-psd';
initializeCanvas((w,h)=>new OffscreenCanvas(w,h),undefined,(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}));
const clamp=v=>Math.max(0,Math.min(255,v));
export function processPixels(data,w,h,p={}) {
 const d=new Uint8ClampedArray(data), contrast=(1+(p.contrast||0)/100), exposure=2**(p.exposure||0), sat=1+(p.saturation||0)/100;
 const curve=p.curve||[[0,0],[255,255]], lookup=Array.from({length:256},(_,x)=>{let i=1;while(i<curve.length-1&&x>curve[i][0])i++;const a=curve[i-1],b=curve[i];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]||1)});
 for(let i=0;i<d.length;i+=4){let r=d[i],g=d[i+1],b=d[i+2]; const gray=.2126*r+.7152*g+.0722*b;
  r=gray+(r-gray)*sat;g=gray+(g-gray)*sat;b=gray+(b-gray)*sat;
  if(p.hue){const a=p.hue*Math.PI/180,c=Math.cos(a),s=Math.sin(a);const nr=(.213+.787*c-.213*s)*r+(.715-.715*c-.715*s)*g+(.072-.072*c+.928*s)*b,ng=(.213-.213*c+.143*s)*r+(.715+.285*c+.140*s)*g+(.072-.072*c-.283*s)*b,nb=(.213-.213*c-.787*s)*r+(.715-.715*c+.715*s)*g+(.072+.928*c+.072*s)*b;r=nr;g=ng;b=nb;}
  if(p.bw)r=g=b=gray;
  let vals=[r+(p.red||0),g+(p.green||0),b+(p.blue||0)];
  vals=vals.map(v=>{v=((v*exposure-128)*contrast+128)+(p.brightness||0)*2.55;v=255*(v-(p.black||0))/(Math.max(1,(p.white??255)-(p.black||0)));v=255*Math.pow(Math.max(0,v/255),1/(p.gamma||1));v=lookup[Math.round(clamp(v))];if(p.invert)v=255-v;if(p.noise)v+=(Math.random()-.5)*p.noise*2.55;return clamp(v)});d[i]=vals[0];d[i+1]=vals[1];d[i+2]=vals[2];
 }
 if(p.sharpen){const src=d.slice(),a=p.sharpen/50;for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++)for(let c=0;c<3;c++){let i=(y*w+x)*4+c;d[i]=clamp(src[i]*(1+4*a)-a*(src[i-4]+src[i+4]+src[i-w*4]+src[i+w*4]))}}
 if(p.pixelate){const size=Math.max(2,Math.round(p.pixelate));for(let y=0;y<h;y+=size)for(let x=0;x<w;x+=size){const i=(y*w+x)*4;for(let yy=y;yy<Math.min(h,y+size);yy++)for(let xx=x;xx<Math.min(w,x+size);xx++)d.set(d.slice(i,i+4),(yy*w+xx)*4)}}
 return d;
}
export function floodFill(m){const d=new Uint8ClampedArray(m.data),w=m.width,h=m.height;if(m.x<0||m.y<0||m.x>=w||m.y>=h)return d;const start=(m.y*w+m.x)*4,target=[...d.slice(start,start+4)],seen=new Uint8Array(w*h),stack=[m.y*w+m.x];while(stack.length){const idx=stack.pop();if(seen[idx])continue;seen[idx]=1;const i=idx*4;if(m.mask&&m.mask[i+3]<128)continue;if(Math.abs(d[i]-target[0])+Math.abs(d[i+1]-target[1])+Math.abs(d[i+2]-target[2])+Math.abs(d[i+3]-target[3])>65)continue;d.set(m.color,i);const x=idx%w,y=Math.floor(idx/w);if(x>0)stack.push(idx-1);if(x<w-1)stack.push(idx+1);if(y>0)stack.push(idx-w);if(y<h-1)stack.push(idx+w)}return d}
if(typeof self!=='undefined'&&typeof self.postMessage==='function')self.onmessage=({data:m})=>{try{if(m.type==='psd'){const psd=readPsd(m.buffer,{useImageData:true,skipThumbnail:true});self.postMessage({id:m.id,psd});}else{const d=m.type==='flood'?floodFill(m):processPixels(m.data,m.width,m.height,m.params);self.postMessage({id:m.id,data:d},[d.buffer]);}}catch(e){self.postMessage({id:m.id,error:e.message})}};
