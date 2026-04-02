const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    let filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, callback);
    } else {
      callback(filepath);
    }
  });
}

const srcDir = path.join(__dirname, 'src');

walk(srcDir, filepath => {
  if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
    let content = fs.readFileSync(filepath, 'utf8');
    let changed = false;

    if (content.includes("from '@/lib/supabase'")) {
      if (content.includes('createClient')) {
        content = content.replace(/from '@\/lib\/supabase'/g, "from '@/lib/supabase/client'");
        changed = true;
      } else if (content.includes('createServerClient')) {
        content = content.replace(/from '@\/lib\/supabase'/g, "from '@/lib/supabase/server'");
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filepath, content, 'utf8');
      console.log('Fixed', filepath);
    }
  }
});

// Create new files
fs.mkdirSync(path.join(srcDir, 'lib', 'supabase'), { recursive: true });

fs.writeFileSync(path.join(srcDir, 'lib', 'supabase', 'client.ts'), `import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '../database.types'

// Client-side Supabase client
export const createClient = () => createClientComponentClient<Database>()
`);

fs.writeFileSync(path.join(srcDir, 'lib', 'supabase', 'server.ts'), `import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '../database.types'

// Server-side Supabase client
export const createServerClient = () =>
  createServerComponentClient<Database>({ cookies })
`);

// Delete old file
try {
  fs.unlinkSync(path.join(srcDir, 'lib', 'supabase.ts'));
} catch (e) {
  console.error(e)
}

console.log('Done script');
