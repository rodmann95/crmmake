import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envs = [
  'VITE_SUPABASE_URL',
  'VITE_SB_PUBLISHABLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_IS_DEMO',
  'VITE_INBOUND_EMAIL',
  'VITE_ATTACHMENTS_BUCKET'
];

console.log('Available process.env keys:', Object.keys(process.env).filter(k => k.startsWith('VITE_') || k.includes('SUPABASE') || k.includes('SB_') || k.includes('KEY')));


let content = '';
for (const env of envs) {
  const value = process.env[env];
  if (value !== undefined) {
    content += `${env}=${value}\n`;
  }
}

// Fallbacks if one key is set but not the other
const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SB_PUBLISHABLE_KEY;
if (supabaseAnon) {
  if (!process.env.VITE_SB_PUBLISHABLE_KEY) {
    content += `VITE_SB_PUBLISHABLE_KEY=${supabaseAnon}\n`;
  }
  if (!process.env.VITE_SUPABASE_ANON_KEY) {
    content += `VITE_SUPABASE_ANON_KEY=${supabaseAnon}\n`;
  }
}

fs.writeFileSync(path.join(__dirname, '../.env.production'), content);
console.log('.env.production successfully generated for build time!');
