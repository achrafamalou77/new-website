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
  
  // We can query the SQL execution endpoint if it's there, or call a rpc
  // Alternatively, let's select from information_schema.tables via a raw postgrest select on a view or try a direct select on a common table
  const { data, error } = await supabase.rpc('get_tables_list'); // might not exist
  if (error) {
    // Let's try to query information_schema or pg_catalog via an arbitrary select on a built-in function or table if possible.
    // In Supabase, can we query pg_class? Usually no direct RLS, but service role key can query anything if no RLS restricts, but PostgREST only exposes tables/views defined in the schema.
    console.error('RPC tables failed:', error);
    
    // Let's check if the website_templates table exists
    const { data: templates, error: tempError } = await supabase.from('website_templates').select('*').limit(1);
    console.log('website_templates query result:', { hasData: !!templates, error: tempError });

    const { data: configs, error: configError } = await supabase.from('website_configs').select('*').limit(1);
    console.log('website_configs query result:', { hasData: !!configs, error: configError });
  } else {
    console.log('Tables list:', data);
  }
}

check();
