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
  console.error("Missing Supabase URL or Service Role Key!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  const userId = '0150dc2d-8181-45f8-a450-7a3d639875e1'; // travel@agency.com user ID

  console.log("Simulating authenticated SQL session...");
  const sql = `
    BEGIN;
    -- Set JWT claim sub to the user ID
    PERFORM set_config('request.jwt.claim.sub', '${userId}', true);
    PERFORM set_config('role', 'authenticated', true);

    -- Print get_current_tenant_id()
    RAISE NOTICE 'Tenant ID: %', get_current_tenant_id();
    
    COMMIT;
  `;

  // Let's run a select that returns get_current_tenant_id() under set_config!
  const { data, error } = await supabase.rpc('get_current_tenant_id');
  console.log("Direct RPC get_current_tenant_id as service_role:", data, error);

  // Let's execute raw SQL to test get_current_tenant_id under simulation
  const testSql = `
    SELECT 
      get_current_tenant_id() as direct_id,
      (
        SELECT agency_id 
        FROM profiles 
        WHERE id = '${userId}'
      ) as profile_agency_id
  `;
  const { data: testData, error: testError } = await supabase.rpc('get_current_tenant_id'); // Wait, let's use standard select or sql
  // We can write a database function or simply select from profiles as service_role
  const { data: profiles, error: err } = await supabase.from('profiles').select('agency_id').eq('id', userId);
  console.log("Profiles as service_role:", profiles, err);
}

main();
