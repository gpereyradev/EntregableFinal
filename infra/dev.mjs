import {spawn} from 'node:child_process';
const php=process.env.PHP_BIN||'php';
const server=spawn(php,['-S',`0.0.0.0:${process.env.PORT||8000}`,'-t','backend/public','backend/server.php'],{stdio:'inherit',env:process.env});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.kill(signal));
server.on('exit',code=>process.exit(code??1));
