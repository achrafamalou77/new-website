const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Fetching agencies columns...');
  const { data, error } = await supabase.from('agencies').select('*').limit(1);
  if (error) {
    console.error('Error fetching agencies:', error);
  } else {
    console.log('Agencies columns:', data ? Object.keys(data[0] || {}) : 'No data');
    console.log('Agencies data sample:', data ? data[0] : 'No data');
  }
}

run().catch(console.error);
