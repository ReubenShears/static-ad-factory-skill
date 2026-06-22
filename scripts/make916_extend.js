const sharp=require('sharp');
const [,,inp,out]=process.argv;
(async()=>{
  const base=await sharp(inp).resize(1080,1080,{fit:'cover'}).toBuffer();
  await sharp(base).extend({top:420,bottom:420,left:0,right:0,extendWith:'copy'}).png().toFile(out);
  console.log('wrote',out);
})();
