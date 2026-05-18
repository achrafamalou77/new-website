const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Fetching trips table metadata...');
  const { data, error } = await supabase.from('trips').select('*').limit(1);
  if (error) {
    console.error('Error fetching trips:', error);
  } else {
    console.log('Trips columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No records found or empty');
    
    // Let's also query from pg_attribute if we have permissions, or inspect a dummy record
    console.log('Sample record:', data ? data[0] : 'None');
  }
}

run().catch(console.error);
