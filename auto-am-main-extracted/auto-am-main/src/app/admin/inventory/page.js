import { getVehicles } from '@/utils/supabaseClient';
import InventoryClient from '@/components/Admin/InventoryClient';

export const metadata = {
  title: 'Inventaire | Admin Dashboard',
};

export default async function AdminInventory() {
  const vehicles = await getVehicles();

  return <InventoryClient vehicles={vehicles} />;
}
