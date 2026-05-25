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
  
  // 1. Rental Cars in car_sales_inventory
  console.log('\n--- RENTAL CARS IN CAR_SALES_INVENTORY ---');
  const { data: rentalCars, error: carError } = await supabase
    .from('car_sales_inventory')
    .select('*')
    .eq('car_type', 'rental');
  
  if (carError) {
    console.error('Error fetching cars:', carError.message);
  } else {
    console.log(`Found ${rentalCars.length} rental cars`);
    if (rentalCars.length > 0) {
      console.log('Keys:', Object.keys(rentalCars[0]));
      console.log('Sample:', JSON.stringify(rentalCars[0], null, 2));
    }
  }

  // 2. Bookings in rental_bookings
  console.log('\n--- BOOKINGS IN RENTAL_BOOKINGS ---');
  const { data: bookings, error: bookingError } = await supabase
    .from('rental_bookings')
    .select('*')
    .limit(3);
  
  if (bookingError) {
    console.error('Error fetching bookings:', bookingError.message);
  } else {
    console.log(`Found ${bookings.length} bookings`);
    if (bookings.length > 0) {
      console.log('Keys:', Object.keys(bookings[0]));
      console.log('Sample:', JSON.stringify(bookings[0], null, 2));
    }
  }

  // 3. Clients in clients
  console.log('\n--- CLIENTS ---');
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .limit(2);
  
  if (clientError) {
    console.error('Error fetching clients:', clientError.message);
  } else {
    console.log(`Found ${clients.length} clients`);
    if (clients.length > 0) {
      console.log('Sample:', JSON.stringify(clients[0], null, 2));
    }
  }
}

check();
