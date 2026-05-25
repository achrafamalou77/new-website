const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ipmzemhteoigoenkmsfl.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwbXplbWh0ZW9pZ29lbmttc2ZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkzODE0NSwiZXhwIjoyMDk0NTE0MTQ1fQ.ws6wew8g2_8kD0VYPqHAzp4G3wNjbVct-pSOYirJf0I";

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('leaves')
    .select(`
      id, employee_id, agency_id, leave_type, start_date, end_date, reason, status, approved_by, created_at, updated_at,
      profiles!leaves_employee_id_fkey (
        full_name
      )
    `);
  if (error) {
    console.error("ERROR DETAILED:", error);
  } else {
    console.log("SUCCESS DATA LENGTH:", data.length);
  }
}

test();
