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

async function run() {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Try querying information_schema.tables using a custom sql or check direct table queries
  // Since we cannot run raw sql via standard api easily without an RPC, let's try calling supabase RPC 'get_dashboard_stats' if it exists!
  // But wait! Is there a function pg_catalog or information_schema we can query?
  // Let's try some common table queries to find which tables exist!
  const commonTables = ['plans', 'subscriptions', 'agency_subscriptions', 'billing', 'users', 'profiles', 'agencies', 'trips', 'bookings', 'conversations', 'messages', 'website_templates'];
  for (const table of commonTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}': ❌ Not found or error: ${error.message}`);
    } else {
      console.log(`Table '${table}': ✅ EXISTS! (columns: ${data.length > 0 ? Object.keys(data[0]).join(', ') : 'empty'})`);
    }
  }
}

run();
