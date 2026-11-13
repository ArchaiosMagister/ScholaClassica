// Iconos ScholaClassica reproducibles, sin dependencias ni fuentes ajenas.
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {deflateSync} from 'node:zlib';
const bg=[20,40,63],circle=[35,85,122],ink=[246,235,213],ring=[191,150,91];
const points=[[348,171],[181,171],[276,256],[181,341],[348,341]];
function distance(x,y,a,b){
  const dx=b[0]-a[0],dy=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
  return Math.hypot(x-(a[0]+t*dx),y-(a[1]+t*dy));
}
function raster(size){
  const data=Buffer.alloc((size*4+1)*size);
  const scale=512/size;
  for(let y=0;y<size;y++){
    const offset=y*(size*4+1);data[offset]=0;
    for(let x=0;x<size;x++){
      const X=(x+.5)*scale,Y=(y+.5)*scale,rad=Math.hypot(X-256,Y-256);
      let color=rad<192?circle:bg;
      if(rad>=188&&rad<=191.5)color=ring;
      for(let i=1;i<points.length;i++){
        if(distance(X,Y,points[i-1],points[i])<16){color=ink;break}
      }
      const p=offset+1+x*4;
      data[p]=color[0];data[p+1]=color[1];data[p+2]=color[2];data[p+3]=255;
    }
  }
  return data;
}
const CRC_TABLE=Array.from({length:256},(_,n)=>{
  let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;
  return c>>>0;
});
function crc32(buffer){
  let c=0xffffffff;
  for(const byte of buffer)c=CRC_TABLE[(c^byte)&255]^(c>>>8);
  return (c^0xffffffff)>>>0;
}
function chunk(type,contents){
  const t=Buffer.from(type),len=Buffer.alloc(4),crc=Buffer.alloc(4);
  len.writeUInt32BE(contents.length);
  crc.writeUInt32BE(crc32(Buffer.concat([t,contents])));
  return Buffer.concat([len,t,contents,crc]);
}
function png(size){
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);
  ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raster(size),{level:9})),
    chunk('IEND',Buffer.alloc(0))
  ]);
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="ScholaClassica: sigma">
<rect width="512" height="512" fill="#14283f"/>
<circle cx="256" cy="256" r="190" fill="#23557a" stroke="#bf965b" stroke-width="4"/>
<path d="M348 171 H181 L276 256 L181 341 H348" fill="none" stroke="#f6ebd5" stroke-width="32" stroke-linejoin="miter"/>
</svg>\n`;
export async function generatePortalIcons(out){
  const icons=join(out,'icons');await mkdir(icons,{recursive:true});
  await writeFile(join(icons,'icon.svg'),svg);
  for(const [name,size] of [['icon-192.png',192],['icon-512.png',512],
    ['icon-maskable-512.png',512],['apple-touch-icon.png',180]]){
    await writeFile(join(icons,name),png(size));
  }
}
