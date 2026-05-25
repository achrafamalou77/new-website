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

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase URL or Service Role Key in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const tenants = [
  {
    email: 'showroom@agency.com',
    password: 'showroom123',
    fullName: 'Showroom Admin',
    agencyId: 'a25a818c-34d1-44eb-991b-689e246995a9'
  },
  {
    email: 'travel@agency.com',
    password: 'travel123',
    fullName: 'Travel Admin',
    agencyId: 'b99a818c-34d1-44eb-991b-689e246995b0'
  }
];

async function main() {
  console.log("Listing existing auth users...");
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError.message);
    process.exit(1);
  }

  for (const tenant of tenants) {
    console.log(`\nProcessing tenant account: ${tenant.email}...`);
    const existingUser = users.find(u => u.email === tenant.email);
    let userId;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`Found existing user with ID: ${existingUser.id}. Resetting password to '${tenant.password}'...`);
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: tenant.password,
        email_confirm: true
      });
      if (updateError) {
        console.error(`Failed to update password for ${tenant.email}:`, updateError.message);
        continue;
      }
      console.log(`Successfully reset password for ${tenant.email}!`);
    } else {
      console.log(`User ${tenant.email} does not exist. Creating new auth user...`);
      const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email: tenant.email,
        password: tenant.password,
        email_confirm: true,
        user_metadata: { full_name: tenant.fullName }
      });
      if (createError) {
        console.error(`Failed to create user ${tenant.email}:`, createError.message);
        continue;
      }
      userId = user.id;
      console.log(`Successfully created user ${tenant.email}!`);
    }

    console.log(`Ensuring profile row exists for ${tenant.email} (Agency: ${tenant.agencyId})...`);
    const { data: profile, error: profileGetError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (profileGetError) {
      console.error("Error checking profile:", profileGetError.message);
    }

    if (!profile) {
      console.log("Profile row not found. Inserting new profile...");
      const { error: profileInsertError } = await supabase.from('profiles').insert({
        id: userId,
        agency_id: tenant.agencyId,
        full_name: tenant.fullName,
        role: 'superadmin',
        is_platform_owner: false
      });
      if (profileInsertError) {
        console.error(`Failed to insert profile row for ${tenant.email}:`, profileInsertError.message);
      } else {
        console.log("Successfully created profile row!");
      }
    } else {
      console.log("Profile row exists. Updating links and role...");
      const { error: profileUpdateError } = await supabase.from('profiles').update({
        agency_id: tenant.agencyId,
        role: 'superadmin',
        is_platform_owner: false
      }).eq('id', userId);
      if (profileUpdateError) {
        console.error(`Failed to update profile row for ${tenant.email}:`, profileUpdateError.message);
      } else {
        console.log("Successfully updated profile row!");
      }
    }
  }

  console.log("\nAll tenant accounts seeded successfully!");
}

main().catch(err => {
  console.error("Unhandled error:", err);
});
