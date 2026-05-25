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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase URL or Anon Key in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log("Logging in as travel@agency.com...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'travel@agency.com',
    password: 'travel123'
  });

  if (authError) {
    console.error("Login failed:", authError.message);
    process.exit(1);
  }

  console.log("Logged in successfully! User ID:", authData.user.id);

  console.log("\n1. Querying profiles table...");
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, agency_id')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error("Profile query failed:", profileError);
  } else {
    console.log("Profile query result:", profile);
  }

  if (profile && profile.agency_id) {
    console.log("\n2. Querying agencies table...");
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('business_type_slug')
      .eq('id', profile.agency_id)
      .single();

    if (agencyError) {
      console.error("Agency query failed:", agencyError);
    } else {
      console.log("Agency query result:", agency);
    }
  }
}

main();
