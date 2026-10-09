import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const here=dirname(fileURLToPath(import.meta.url));
await build({entryPoints:[resolve(here,'reader.jsx')],bundle:true,minify:true,define:{'process.env.NODE_ENV':'"production"'},outfile:resolve(here,'../../assets/rent-squeeze/rent-squeeze.js')});
