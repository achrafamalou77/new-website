const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Inserting dummy client...');
  const { data: client } = await supabase
    .from('clients')
    .insert([{ full_name: 'Temp Payment Client' }])
    .select()
    .single();

  console.log('Inserting dummy invoice...');
  const { data: invoice } = await supabase
    .from('invoices')
    .insert([{
      client_id: client.id,
      invoice_number: 'FA-2026-8888',
      issue_date: '2026-05-18',
      due_date: '2026-05-25',
      status: 'draft',
      subtotal: 1000,
      total_amount: 1000
    }])
    .select()
    .single();

  console.log('Inserting dummy payment...');
  const { data: payment, error } = await supabase
    .from('invoice_payments')
    .insert([{
      invoice_id: invoice.id,
      amount: 250,
      payment_method: 'Cash',
      payment_date: '2026-05-18',
      reference_number: 'REF-001',
      notes: 'Initial deposit',
      received_by: 'Super Admin User'
    }])
    .select();

  console.log('Insert test payment:', { payment, error });

  // Query updated invoice to see if database trigger updated totals!
  const { data: updatedInvoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoice.id)
    .single();
  console.log('Updated invoice totals (Trigger test):', updatedInvoice);

  // Clean up
  await supabase.from('invoice_payments').delete().eq('id', payment?.[0]?.id);
  await supabase.from('invoices').delete().eq('id', invoice.id);
  await supabase.from('clients').delete().eq('id', client.id);
}

run().catch(console.error);
