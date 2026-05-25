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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Role Key in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runTest(query, clientPhone) {
  console.log(`\n=================== Testing Query: "${query}" (Phone: ${clientPhone || 'None'}) ===================`);
  
  // 1. Try to find by container number directly if query looks like one
  const cleanQuery = query.trim().toUpperCase();
  if (cleanQuery.length >= 5) {
    console.log("Checking container number directly...");
    const { data: directContainer, error: err1 } = await supabase
      .from('containers')
      .select('*, import_orders(*, clients(full_name, phone))')
      .ilike('container_number', `%${cleanQuery}%`);
      
    if (err1) {
      console.error("Error matching container number:", err1.message, err1);
    } else if (directContainer && directContainer.length > 0) {
      console.log("SUCCESS (Container Direct Match):");
      console.log(JSON.stringify(directContainer, null, 2));
      return;
    } else {
      console.log("No container direct match found.");
    }
  }

  // 2. Try to find by client phone
  let phoneToSearch = clientPhone;
  if (!phoneToSearch) {
    const phoneMatch = query.match(/0[567]\d{8}/) || query.match(/\+213\d{9}/);
    if (phoneMatch) {
      phoneToSearch = phoneMatch[0];
    }
  }

  if (phoneToSearch) {
    console.log(`Searching by phone: ${phoneToSearch}...`);
    const { data: clientWithOrders, error: err2 } = await supabase
      .from('clients')
      .select('id, full_name, phone, import_orders(*, container:containers(*))')
      .eq('phone', phoneToSearch)
      .maybeSingle();

    if (err2) {
      console.error("Error matching client phone:", err2.message, err2);
    } else if (clientWithOrders && clientWithOrders.import_orders && clientWithOrders.import_orders.length > 0) {
      console.log("SUCCESS (Phone Match):");
      console.log(JSON.stringify(clientWithOrders, null, 2));
      return;
    } else {
      console.log("No client phone match found.");
    }
  }

  // 3. Search for vehicle model/brand or client name in query
  console.log("Searching for vehicle brand/model or client name...");
  const { data: allOrders, error: err3 } = await supabase
    .from('import_orders')
    .select('*, container:containers(*), client:clients(full_name, phone)');
  
  if (err3) {
    console.error("Error matching vehicle or client name:", err3.message, err3);
  } else if (allOrders) {
    const words = query.toLowerCase().split(/\s+/);
    const matchedOrders = allOrders.filter((order) => {
      const brand = (order.vehicle_brand || '').toLowerCase();
      const model = (order.vehicle_model || '').toLowerCase();
      const clientName = (order.client?.full_name || '').toLowerCase();
      
      return words.some(word => 
        (word.length > 2 && (brand.includes(word) || model.includes(word) || clientName.includes(word)))
      );
    });

    if (matchedOrders.length > 0) {
      console.log("SUCCESS (Vehicle/Client Name Match):");
      console.log(JSON.stringify(matchedOrders, null, 2));
      return;
    } else {
      console.log("No vehicle or client name match found.");
    }
  }
  
  console.log("No matching shipments found.");
}

async function main() {
  try {
    // Test container number query
    await runTest("MSCU8829402");
    
    // Test client phone query
    await runTest("+213770123456");
    
    // Test alternative Algerian format phone query
    await runTest("0770123456");
    
    // Test vehicle model query
    await runTest("G63 AMG");
    
  } catch (err) {
    console.error("Unhanded rejection:", err);
  }
}

main();
