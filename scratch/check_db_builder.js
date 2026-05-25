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
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await supabase.from('website_configs').select('*');
  if (error) {
    console.error('Error fetching website_configs:', error);
  } else {
    console.log('website_configs rows count:', data.length);
    data.forEach(row => {
      console.log('ID:', row.id);
      console.log('Agency ID:', row.agency_id);
      console.log('Active Template ID:', row.active_template_id);
      console.log('Has builder_data?', !!row.builder_data);
      if (row.builder_data) {
        console.log('builder_data sections:', row.builder_data.sections?.map(s => s.type));
      }
    });
  }
}

check();
