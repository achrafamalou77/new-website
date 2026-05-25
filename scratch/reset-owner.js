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
const ownerEmail = process.env.OWNER_EMAIL || 'admin@example.com';
const ownerPassword = process.env.OWNER_PASSWORD || 'secretpassword';

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

async function main() {
  console.log(`Resetting owner account for: ${ownerEmail}...`);
  
  // List all users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError.message);
    process.exit(1);
  }

  const existingUser = users.find(u => u.email === ownerEmail);
  let userId;

  if (existingUser) {
    userId = existingUser.id;
    console.log(`Found existing user with ID: ${existingUser.id}. Resetting password...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: ownerPassword,
      email_confirm: true
    });
    if (updateError) {
      console.error("Failed to update password:", updateError.message);
      process.exit(1);
    }
    console.log(`Successfully reset password for ${ownerEmail} to '${ownerPassword}'!`);
  } else {
    console.log(`User ${ownerEmail} does not exist yet. Creating new user...`);
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Platform Owner' }
    });
    if (createError) {
      console.error("Failed to create user:", createError.message);
      process.exit(1);
    }
    userId = user.id;
    console.log(`Successfully created new user ${ownerEmail} with password '${ownerPassword}'!`);
  }

  console.log(`Ensuring profile exists in public.profiles table for user ID: ${userId}...`);
  const { data: profile, error: profileGetError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (profileGetError) {
    console.error("Error checking profile:", profileGetError.message);
  }

  if (!profile) {
    console.log("Profile not found in database. Creating profile row...");
    const { error: profileInsertError } = await supabase.from('profiles').insert({
      id: userId,
      full_name: 'Platform Owner',
      role: 'superadmin',
      is_platform_owner: true
    });
    if (profileInsertError) {
      console.error("Failed to create profile row:", profileInsertError.message);
    } else {
      console.log("Successfully created profile row!");
    }
  } else {
    console.log("Ensuring platform owner flags are correct on profile row...");
    const { error: profileUpdateError } = await supabase.from('profiles').update({
      role: 'superadmin',
      is_platform_owner: true
    }).eq('id', userId);
    if (profileUpdateError) {
      console.error("Failed to update profile row flags:", profileUpdateError.message);
    } else {
      console.log("Successfully updated profile row flags!");
    }
  }

  console.log("\nAll tasks completed successfully!");
}

main().catch(err => {
  console.error("Unhandled error:", err);
});
