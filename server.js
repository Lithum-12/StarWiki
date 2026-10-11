/* server.js —— 零依赖静态服务器，支持自定义 404 */
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=__dirname,PORT=5501;
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
'.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png',
'.jpg':'image/jpeg','.ico':'image/x-icon','.md':'text/markdown; charset=utf-8'};

http.createServer((req,res)=>{
  const urlPath=decodeURIComponent(req.url.split('?')[0]);
  let file=path.normalize(path.join(ROOT,urlPath));
  if(!file.startsWith(ROOT)){res.writeHead(403);res.end();return;}
  fs.stat(file,(err,st)=>{
    if(!err&&st.isDirectory())file=path.join(file,'index.html');
    fs.readFile(file,(e,data)=>{
      if(e){
        fs.readFile(path.join(ROOT,'404.html'),(e2,p)=>{
          res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});
          res.end(e2?'404 Not Found':p);
        });
        return;
      }
      res.writeHead(200,{'Content-Type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream'});
      res.end(data);
    });
  });
}).listen(PORT,()=>console.log('✔ http://localhost:'+PORT));