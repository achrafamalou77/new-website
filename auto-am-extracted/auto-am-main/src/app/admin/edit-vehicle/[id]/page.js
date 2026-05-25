import { getVehicleById } from '@/utils/supabaseClient';
import AdminForm from '@/components/AdminForm/AdminForm';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Modifier le Véhicule | Admin Dashboard',
};

export default async function AdminEditVehicle({ params }) {
  const resolvedParams = await params;
  const vehicle = await getVehicleById(resolvedParams.id);

  if (!vehicle) {
    notFound();
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', color: 'var(--color-text)', marginBottom: '24px', fontWeight: '800' }}>
        Modifier: {vehicle.make} {vehicle.model}
      </h1>

      <AdminForm initialData={vehicle} />
    </div>
  );
}
