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
  console.error("❌ Missing Supabase URL or Anon Key in .env.local!");
  process.exit(1);
}

// Create supabase client with anon key to simulate client-side sign-in
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testLogin(email, password) {
  console.log(`🔐 Testing credentials for ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error(`❌ Login FAILED for ${email}: ${error.message}`);
    return null;
  }

  console.log(`✅ Login SUCCESS for ${email}!`);
  console.log(`   User ID: ${data.user.id}`);
  console.log(`   Access Token Length: ${data.session.access_token.length} chars`);
  
  // Now let's fetch profile using this user's token
  const clientWithToken = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${data.session.access_token}`
      }
    }
  });

  const { data: profile, error: profileError } = await clientWithToken
    .from('profiles')
    .select('id, agency_id, full_name, role')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    console.error(`❌ Failed to retrieve profile for ${email}: ${profileError.message}`);
  } else {
    console.log(`✅ Profile retrieved successfully!`);
    console.log(`   Full Name: ${profile.full_name}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Agency ID: ${profile.agency_id}`);

    // Try fetching employees
    const { data: employees, error: employeesError } = await clientWithToken
      .from('employees')
      .select('id, agency_id, role, profiles(full_name, email)');

    if (employeesError) {
      console.error(`❌ Failed to retrieve employees for ${email}: ${employeesError.message}`);
    } else {
      console.log(`✅ Employees retrieved successfully for ${email}:`, employees);
    }
  }
  console.log("--------------------------------------------------\n");
  return data.session;
}

async function main() {
  console.log("==================================================");
  console.log("🔒 TESTING GOLDENBIRD CREDENTIALS & PROFILES");
  console.log("==================================================\n");

  await testLogin('owner@goldenbird.dz', 'secretpassword');
  await testLogin('employee@goldenbird.dz', 'secretpassword');
}

main();
