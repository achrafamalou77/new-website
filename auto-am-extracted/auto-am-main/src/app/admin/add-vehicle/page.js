import AdminForm from '@/components/AdminForm/AdminForm';

export const metadata = {
  title: 'Ajout Véhicule | Admin Dashboard',
};

export default function AdminAddVehicle() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', color: 'var(--color-text)', marginBottom: '24px', fontWeight: '800' }}>
        Ajouter un nouveau véhicule
      </h1>

      <AdminForm />
    </div>
  );
}
