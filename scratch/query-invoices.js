const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Inserting dummy client for foreign key...');
  const { data: client } = await supabase
    .from('clients')
    .insert([{ full_name: 'Temp Invoice Client' }])
    .select()
    .single();

  console.log('Created client:', client.id);

  console.log('Inserting test invoice...');
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert([{
      client_id: client.id,
      invoice_number: 'FA-2026-9999',
      issue_date: '2026-05-18',
      due_date: '2026-05-25',
      status: 'draft',
      subtotal: 1000,
      total_amount: 1000
    }])
    .select();

  console.log('Insert test invoices:', { invoice, error });

  // Clean up
  await supabase.from('invoices').delete().eq('id', invoice?.[0]?.id);
  await supabase.from('clients').delete().eq('id', client.id);
  await supabase.from('clients').delete().eq('full_name', 'Test Validation');
}

run().catch(console.error);
