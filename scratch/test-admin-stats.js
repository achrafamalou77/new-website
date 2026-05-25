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

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log("Testing individual queries from getAdminDashboardStats...");
  
  try {
    console.log("\n1. Querying agencies count...");
    const { count: totalAgencies, error: err1 } = await supabase
      .from('agencies')
      .select('*', { count: 'exact', head: true });
    if (err1) console.error("❌ Agencies count error:", err1.message);
    else console.log("✅ Agencies count:", totalAgencies);

    console.log("\n2. Querying active agencies count...");
    const { count: activeAgencies, error: err2 } = await supabase
      .from('agencies')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    if (err2) console.error("❌ Active agencies error:", err2.message);
    else console.log("✅ Active agencies count:", activeAgencies);

    console.log("\n3. Querying conversations count...");
    const { count: totalConversations, error: err3 } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });
    if (err3) console.error("❌ Conversations count error:", err3.message);
    else console.log("✅ Conversations count:", totalConversations);

    console.log("\n4. Querying agencies with plans...");
    const { data: agenciesWithPlans, error: err4 } = await supabase
      .from('agencies')
      .select('status, plan, plan:plans(price)');
    if (err4) {
      console.error("❌ Agencies with plans error:", err4.message);
      console.log("Trying alternative without plan join...");
      const { data: agenciesOnly, error: err4b } = await supabase.from('agencies').select('status, plan');
      if (err4b) console.error("❌ Agencies only query error:", err4b.message);
      else console.log("✅ Agencies only query succeeded. Records:", agenciesOnly.length);
    }
    else {
      console.log("✅ Agencies with plans retrieved:", agenciesWithPlans.length);
      console.log("First agency plan structure:", JSON.stringify(agenciesWithPlans[0]));
    }

    console.log("\n5. Querying bookings count...");
    const { count: totalBookings, error: err5 } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    if (err5) console.error("❌ Bookings count error:", err5.message);
    else console.log("✅ Bookings count:", totalBookings);

    console.log("\n6. Querying recent signups...");
    const { data: recentSignups, error: err6 } = await supabase
      .from('agencies')
      .select('id, company_name, subdomain, status, created_at, plan:plans(name)')
      .order('created_at', { ascending: false })
      .limit(5);
    if (err6) console.error("❌ Recent signups error:", err6.message);
    else console.log("✅ Recent signups count:", recentSignups.length);

  } catch (err) {
    console.error("Unhandled error:", err);
  }
}

main();
