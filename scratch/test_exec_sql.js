const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

async function check() {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const sql = `
    CREATE TABLE IF NOT EXISTS website_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE UNIQUE,
      builder_data JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  console.log('Result of exec_sql:', { data, error });
}

check();
