import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SB_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const envs = [
  'VITE_IS_DEMO',
  'VITE_INBOUND_EMAIL',
  'VITE_ATTACHMENTS_BUCKET'
];

let content = '';
if (supabaseUrl) {
  content += `VITE_SUPABASE_URL=${supabaseUrl}\n`;
}
if (supabaseKey) {
  content += `VITE_SB_PUBLISHABLE_KEY=${supabaseKey}\n`;
  content += `VITE_SUPABASE_ANON_KEY=${supabaseKey}\n`;
}

for (const env of envs) {
  const value = process.env[env];
  if (value !== undefined) {
    content += `${env}=${value}\n`;
  }
}

fs.writeFileSync(path.join(__dirname, '../.env.production'), content);
console.log('.env.production successfully generated for build time!');
