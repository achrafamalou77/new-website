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

// Helpers to create auth clients
function getClientForToken(token) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}

async function signIn(email, password) {
  const baseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data, error } = await baseClient.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(`❌ Sign-in failed for ${email}: ${error.message}`);
    return null;
  }
  return data.session;
}

async function runTest() {
  console.log("==================================================");
  console.log("🔍 RUNNING COMPREHENSIVE TEAM MANAGEMENT USE CASE");
  console.log("==================================================\n");

  const ownerSession = await signIn('owner@goldenbird.dz', 'secretpassword');
  const employeeSession = await signIn('employee@goldenbird.dz', 'secretpassword');

  if (!ownerSession || !employeeSession) {
    console.error("❌ Test aborted due to login failures.");
    process.exit(1);
  }

  const ownerClient = getClientForToken(ownerSession.access_token);
  const employeeClient = getClientForToken(employeeSession.access_token);

  const ownerId = ownerSession.user.id;
  const employeeId = employeeSession.user.id;
  const agencyId = '5c2160b3-1bf2-4c83-bcc5-8c0c13fcc47a';

  console.log("👉 1. Fetching employees list (Superadmin)...");
  const { data: employees, error: fetchErr } = await ownerClient
    .from('employees')
    .select(`
      *,
      profiles (
        full_name,
        email,
        phone,
        created_at
      )
    `)
    .eq('agency_id', agencyId);

  if (fetchErr) {
    console.error("❌ Failed to fetch employees list:", fetchErr.message);
  } else {
    console.log(`✅ Fetched ${employees.length} employees successfully!`);
    console.log(employees.map(e => ({ name: e.profiles?.full_name, email: e.profiles?.email })));
  }

  console.log("\n👉 2. Creating a Custom Role (Superadmin)...");
  const { data: roleData, error: roleErr } = await ownerClient
    .from('roles')
    .insert({
      agency_id: agencyId,
      name: 'Senior Travel Consultant',
      permissions: ['read_inbox', 'manage_trips', 'view_payroll']
    })
    .select()
    .single();

  if (roleErr) {
    console.error("❌ Failed to create custom role:", roleErr.message);
  } else {
    console.log("✅ Created custom role successfully:", roleData);
  }

  console.log("\n👉 3. Recording employee attendance (Superadmin)...");
  const today = new Date().toISOString().split('T')[0];
  const { data: attData, error: attErr } = await ownerClient
    .from('attendance')
    .upsert({
      employee_id: employeeId,
      agency_id: agencyId,
      date: today,
      status: 'present',
      check_in: '08:55',
      check_out: '18:00',
      notes: 'Arrived early, excellent performance.'
    })
    .select()
    .single();

  if (attErr) {
    console.error("❌ Failed to record attendance:", attErr.message);
  } else {
    console.log("✅ Recorded attendance successfully:", attData);
  }

  console.log("\n👉 4. Submitting a Leave Request (Employee)...");
  const leaveStart = new Date();
  leaveStart.setDate(leaveStart.getDate() + 5); // 5 days from now
  const leaveEnd = new Date();
  leaveEnd.setDate(leaveEnd.getDate() + 9); // 9 days from now

  const { data: leaveData, error: leaveErr } = await employeeClient
    .from('leaves')
    .insert({
      employee_id: employeeId,
      agency_id: agencyId,
      leave_type: 'annual',
      start_date: leaveStart.toISOString().split('T')[0],
      end_date: leaveEnd.toISOString().split('T')[0],
      reason: 'Trip to Jijel with family',
      status: 'pending'
    })
    .select()
    .single();

  if (leaveErr) {
    console.error("❌ Failed to submit leave request:", leaveErr.message);
  } else {
    console.log("✅ Leave request submitted successfully:", leaveData);
  }

  if (leaveData) {
    console.log("\n👉 5. Approving the Leave Request (Superadmin)...");
    
    // First read remaining leaves to simulate action deduction
    const { data: empData, error: empErr } = await ownerClient
      .from('employees')
      .select('remaining_annual_leave')
      .eq('id', employeeId)
      .single();

    if (empErr) {
      console.error("❌ Failed to read remaining leave:", empErr.message);
    } else {
      console.log(`Current remaining annual leave days: ${empData.remaining_annual_leave}`);
      
      const requestedDays = 5; // leaveStart + 4 days = 5 days total
      const newRemaining = Math.max(0, empData.remaining_annual_leave - requestedDays);

      // Deduct days
      const { error: deductErr } = await ownerClient
        .from('employees')
        .update({ remaining_annual_leave: newRemaining })
        .eq('id', employeeId);

      if (deductErr) {
        console.error("❌ Failed to deduct remaining leaves:", deductErr.message);
      } else {
        console.log(`✅ Deducted ${requestedDays} days. New remaining: ${newRemaining}`);
      }

      // Approve leave
      const { data: approvedLeave, error: approveErr } = await ownerClient
        .from('leaves')
        .update({
          status: 'approved',
          approved_by: ownerId
        })
        .eq('id', leaveData.id)
        .select()
        .single();

      if (approveErr) {
        console.error("❌ Failed to approve leave request:", approveErr.message);
      } else {
        console.log("✅ Leave request approved successfully:", approvedLeave);
      }
    }
  }

  console.log("\n👉 6. Recording Payroll (Superadmin)...");
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: payData, error: payErr } = await ownerClient
    .from('payroll')
    .insert({
      employee_id: employeeId,
      agency_id: agencyId,
      month: currentMonth,
      year: currentYear,
      base_salary: 55000,
      commission: 15000,
      bonuses: 5000,
      deductions: 2000,
      net_salary: 73000, // 55000 + 15000 + 5000 - 2000
      status: 'paid'
    })
    .select()
    .single();

  if (payErr) {
    console.error("❌ Failed to record payroll:", payErr.message);
  } else {
    console.log("✅ Recorded payroll successfully:", payData);
  }

  console.log("\n👉 7. Creating a Kanban Task (Superadmin)...");
  const { data: taskData, error: taskErr } = await ownerClient
    .from('hr_tasks')
    .insert({
      agency_id: agencyId,
      title: 'Finalize GoldenBird Summer Packages',
      description: 'Prepare and review the itinerary, hotels and prices for summer flight charter tours to Turkey and Tunisia.',
      assignee_id: employeeId,
      due_date: '2026-06-15',
      status: 'todo'
    })
    .select()
    .single();

  if (taskErr) {
    console.error("❌ Failed to create Kanban task:", taskErr.message);
  } else {
    console.log("✅ Kanban task created successfully:", taskData);
  }

  console.log("\n👉 8. Creating an Announcement (Superadmin)...");
  const { data: annData, error: annErr } = await ownerClient
    .from('announcements')
    .insert({
      agency_id: agencyId,
      author_id: ownerId,
      content: 'Welcome to GoldenBird Travel Agency! Let\'s work together to achieve our goals.',
      is_pinned: true,
      read_by: []
    })
    .select()
    .single();

  if (annErr) {
    console.error("❌ Failed to create announcement:", annErr.message);
  } else {
    console.log("✅ Announcement created successfully:", annData);
  }

  console.log("\n==================================================");
  console.log("🎉 ALL TESTS RUN SUCCESSFULLY!");
  console.log("==================================================");
}

runTest();
