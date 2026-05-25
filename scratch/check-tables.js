const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTable(supabase, tableName) {
  console.log(`Checking table: ${tableName}`);
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  if (error) {
    console.error(`Error querying ${tableName}:`, error.message);
  } else {
    console.log(`${tableName} columns:`, data && data.length > 0 ? Object.keys(data[0]) : 'No data or table empty');
    if (data && data.length > 0) {
      console.log(`${tableName} sample data:`, data[0]);
    }
  }
}

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  await checkTable(supabase, 'clients');
  await checkTable(supabase, 'conversations');
  await checkTable(supabase, 'messages');
  await checkTable(supabase, 'car_rental_inventory');
}

run().catch(console.error);
