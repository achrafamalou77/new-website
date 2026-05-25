import { getOrders } from '@/utils/supabaseClient';
import CommandesClient from '@/components/Admin/CommandesClient';

export const metadata = {
  title: 'Commandes & Leads | Admin Dashboard',
};

export default async function AdminCommandes() {
  const orders = await getOrders();
  
  // Exclude soft-deleted leads
  const activeOrders = orders.filter(o => !o.is_archived);

  return <CommandesClient initialOrders={activeOrders} />;
}
