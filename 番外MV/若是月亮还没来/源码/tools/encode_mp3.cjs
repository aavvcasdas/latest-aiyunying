// WAV(44.1kHz/立体声/16bit) → MP3 160kbps，供单文件网页内联。用法：node tools/encode_mp3.cjs in.wav out.mp3
const fs=require("fs"); const vm=require("vm");
const ctx={console}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(require.resolve("lamejs/lame.all.js"),"utf8")+";this.L=lamejs;",ctx); const lamejs=ctx.L;
const buf=fs.readFileSync(process.argv[2]); const off=78, n=(buf.length-off)/4|0;
const L=new Int16Array(n), R=new Int16Array(n);
for(let i=0;i<n;i++){L[i]=buf.readInt16LE(off+i*4);R[i]=buf.readInt16LE(off+i*4+2);}
const enc=new lamejs.Mp3Encoder(2,44100,160); const chunks=[]; const B=1152;
for(let i=0;i<n;i+=B){const m=enc.encodeBuffer(L.subarray(i,i+B),R.subarray(i,i+B)); if(m.length) chunks.push(Buffer.from(m));}
const e=enc.flush(); if(e.length) chunks.push(Buffer.from(e));
const out=Buffer.concat(chunks); fs.writeFileSync(process.argv[3],out); console.log("mp3",out.length,"bytes");
