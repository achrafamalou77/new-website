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
  console.log("Checking rental_bookings table:");
  const { data, error } = await supabase.from('rental_bookings').select('*').limit(1);
  if (error) {
    console.error("Error querying rental_bookings:", error.message);
  } else {
    console.log("rental_bookings columns:", data && data.length > 0 ? Object.keys(data[0]) : 'Empty table');
    console.log("rental_bookings sample:", data);
  }
}

run();
