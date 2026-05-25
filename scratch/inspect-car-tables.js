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

async function checkTable(supabase, tableName) {
  console.log(`\nChecking table: ${tableName}`);
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  if (error) {
    console.error(`❌ Error querying ${tableName}:`, error.message);
  } else {
    console.log(`✅ ${tableName} columns:`, data && data.length > 0 ? Object.keys(data[0]) : 'No data or table empty');
    if (data && data.length > 0) {
      console.log(`${tableName} sample data:`, data[0]);
    }
  }
}

async function run() {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  await checkTable(supabase, 'car_sales_inventory');
  await checkTable(supabase, 'car_rental_fleet');
}

run();
