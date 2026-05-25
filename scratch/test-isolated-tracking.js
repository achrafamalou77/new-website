const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
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
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function normalizeAlgerianPhone(phone) {
  let clean = phone.trim().replace(/\s+/g, '')
  if (clean.startsWith('0')) {
    clean = '+213' + clean.substring(1)
  }
  return clean
}

function maskClientName(name) {
  if (!name) return ''
  return name.split(' ').map(word => {
    if (word.length <= 1) return word
    return word[0] + '•'.repeat(word.length - 1)
  }).join(' ')
}

// Emulating the secure backend action
async function simulateGetContainerTrackingInfo(query, agencyId, clientPhone) {
  const cleanQuery = query.trim().toUpperCase();
  const agencyUuid = agencyId;

  // 1. Phone Search
  const isPhone = /^(0[567]\d{8}|\+213[567]\d{8}|[567]\d{8})$/.test(cleanQuery);
  if (isPhone) {
    const targetPhone = normalizeAlgerianPhone(cleanQuery);
    const { data: clientsList } = await supabase
      .from('clients')
      .select('id, full_name, phone')
      .eq('phone', targetPhone)
      .eq('agency_id', agencyUuid);

    if (clientsList && clientsList.length > 0) {
      const clientObj = clientsList[0];
      const { data: clientOrders } = await supabase
        .from('import_orders')
        .select('*, container:containers(*)')
        .eq('client_id', clientObj.id)
        .eq('agency_id', agencyUuid);

      return { 
        success: true, 
        type: 'client_phone', 
        client: clientObj, 
        data: clientOrders || [] 
      };
    } else {
      return { success: false, error: 'Aucun dossier client trouvé pour ce téléphone dans cette agence.' };
    }
  }

  // 2. Container Search
  const isContainerNumber = /^[A-Z0-9]{4,15}$/.test(cleanQuery);
  if (isContainerNumber) {
    const { data: containers } = await supabase
      .from('containers')
      .select('*')
      .eq('agency_id', agencyUuid)
      .ilike('container_number', `%${cleanQuery}%`);

    if (containers && containers.length > 0) {
      const containerObj = containers[0];

      if (clientPhone) {
        const targetPhone = normalizeAlgerianPhone(clientPhone);
        const { data: containerOrders } = await supabase
          .from('import_orders')
          .select('*, client:clients(full_name, phone)')
          .eq('container_id', containerObj.id)
          .eq('agency_id', agencyUuid);

        const filteredOrders = (containerOrders || []).filter(order => {
          if (!order.client?.phone) return false;
          return normalizeAlgerianPhone(order.client.phone) === targetPhone;
        });

        if (filteredOrders.length > 0) {
          return {
            success: true,
            type: 'container',
            lockedCargo: false,
            client: {
              full_name: filteredOrders[0].client.full_name,
              phone: filteredOrders[0].client.phone
            },
            data: [{
              ...containerObj,
              import_orders: filteredOrders
            }]
          };
        } else {
          return { success: false, error: 'Aucun véhicule correspondant à ce téléphone dans ce conteneur.' };
        }
      } else {
        return {
          success: true,
          type: 'container',
          lockedCargo: true,
          data: [{
            ...containerObj,
            import_orders: [] // Keep vehicle list strictly empty
          }]
        };
      }
    }
  }

  // 3. Unique Tracking Number Search
  if (cleanQuery.length >= 6) {
    const { data: matchingOrders } = await supabase
      .from('import_orders')
      .select('*, container:containers(*), client:clients(full_name, phone)')
      .eq('agency_id', agencyUuid)
      .ilike('tracking_number', `%${cleanQuery}%`);

    if (matchingOrders && matchingOrders.length > 0) {
      const order = matchingOrders[0];
      const maskedClient = {
        full_name: maskClientName(order.client?.full_name || ''),
        phone: '••••••••••'
      };

      const securedOrder = {
        ...order,
        client: maskedClient,
        total_cost: 0,
        deposit_paid: 0,
        balance_due: 0
      };

      return {
        success: true,
        type: 'tracking_number',
        client: maskedClient,
        data: [securedOrder]
      };
    }
  }

  return { success: false, error: 'Recherche non valide ou inexistante.' };
}

async function runTests() {
  const matchingAgencyId = "a25a818c-34d1-44eb-991b-689e246995a9";
  const foreignAgencyId = "b99b9999-99d9-999b-999b-999e99999999"; // Fake foreign agency ID

  console.log("\n--- TEST 1: Public Container Search (Locked Cargo) ---");
  const res1 = await simulateGetContainerTrackingInfo("MSCU8829402", matchingAgencyId);
  console.log(`Success: ${res1.success}`);
  console.log(`Locked Cargo: ${res1.lockedCargo}`);
  console.log(`Container Number: ${res1.data[0]?.container_number}`);
  console.log(`Cars exposed: ${res1.data[0]?.import_orders?.length}`);

  console.log("\n--- TEST 2: Verified Cargo Phone Verification (Unlock Cargo) ---");
  const res2 = await simulateGetContainerTrackingInfo("MSCU8829402", matchingAgencyId, "0770123456");
  console.log(`Success: ${res2.success}`);
  console.log(`Locked Cargo: ${res2.lockedCargo}`);
  console.log(`Client Unlocked: ${res2.client?.full_name} (${res2.client?.phone})`);
  console.log(`Cars unlocked: ${res2.data[0]?.import_orders?.length}`);
  if (res2.data[0]?.import_orders?.length > 0) {
    console.log(`First unlocked car: ${res2.data[0].import_orders[0].vehicle_brand} ${res2.data[0].import_orders[0].vehicle_model}`);
    console.log(`Acompte: ${res2.data[0].import_orders[0].deposit_paid} DA, Balance: ${res2.data[0].import_orders[0].balance_due} DA`);
  }

  console.log("\n--- TEST 3: Direct Phone Search (Normalized) ---");
  const res3 = await simulateGetContainerTrackingInfo("0770123456", matchingAgencyId);
  console.log(`Success: ${res3.success}`);
  console.log(`Client Name: ${res3.client?.full_name}`);
  console.log(`Cars Found: ${res3.data?.length}`);

  console.log("\n--- TEST 4: Unique Tracking Code Search (Masked Client Info & Financials) ---");
  const res4 = await simulateGetContainerTrackingInfo("MSCTRK99201", matchingAgencyId);
  console.log(`Success: ${res4.success}`);
  console.log(`Masked Client Name: ${res4.client?.full_name}`);
  console.log(`Masked Client Phone: ${res4.client?.phone}`);
  console.log(`Car Model: ${res4.data[0]?.vehicle_brand} ${res4.data[0]?.vehicle_model}`);
  console.log(`Financials -> Acompte: ${res4.data[0]?.deposit_paid} DA, Balance: ${res4.data[0]?.balance_due} DA (Should be 0 due to masking)`);

  console.log("\n--- TEST 5: Complete Tenant Isolation Verification (Incorrect Agency ID) ---");
  const res5 = await simulateGetContainerTrackingInfo("MSCU8829402", foreignAgencyId);
  console.log(`Found under foreign agency? -> Success: ${res5.success}`);
  
  const res6 = await simulateGetContainerTrackingInfo("0770123456", foreignAgencyId);
  console.log(`Found phone under foreign agency? -> Success: ${res6.success} (Error message: "${res6.error}")`);
}

runTests();
