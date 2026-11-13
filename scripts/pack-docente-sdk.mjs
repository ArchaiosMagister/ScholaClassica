// Genera en CI una biblioteca local verificada para el alta de TOTP.
import {build} from 'esbuild';
import {mkdir,readFile,stat,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const dir=join(root,'build','docente');
await mkdir(dir,{recursive:true});
const file=join(dir,'supabase.js');
await build({
  entryPoints:[join(root,'scripts','docente-sdk-entry.mjs')],
  outfile:file,
  bundle:true,platform:'browser',format:'iife',target:['es2021'],
  minify:true,legalComments:'none',logLevel:'warning'
});
const bytes=await readFile(file);
const length=(await stat(file)).size;
if(length<10000||length>5000000)throw Error('SDK fuera de límites esperados');
const hash=createHash('sha256').update(bytes).digest('hex');
await writeFile(join(dir,'supabase.sha256'),hash+'\n');
console.log('SDK docente local preparado; bytes='+length+' SHA-256='+hash);
