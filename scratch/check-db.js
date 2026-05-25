const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually to set environment variables
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const matched = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (matched) {
      const key = matched[1];
      let value = matched[2] || '';
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.replace(/^"|"\s*$/g, '');
      }
      process.env[key] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase URL or Service Role Key in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log("=== INSPECTING PROFILES ===");
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
  if (pError) console.error("Error reading profiles:", pError.message);
  else console.log(JSON.stringify(profiles, null, 2));

  console.log("\n=== INSPECTING AGENCIES ===");
  const { data: agencies, error: aError } = await supabase.from('agencies').select('*');
  if (aError) console.error("Error reading agencies:", aError.message);
  else console.log(JSON.stringify(agencies.map(a => ({
    id: a.id,
    name: a.name,
    subdomain: a.subdomain,
    business_type_slug: a.business_type_slug
  })), null, 2));
}

main();
