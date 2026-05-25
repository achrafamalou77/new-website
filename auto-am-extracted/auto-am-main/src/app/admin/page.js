import { getVehicles, getOrders } from '@/utils/supabaseClient';
import Link from 'next/link';

export default async function AdminDashboard() {
  const vehicles = await getVehicles();
  const orders = await getOrders();

  const totalValue = vehicles.reduce((acc, curr) => acc + curr.price, 0);

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', color: 'var(--color-text)', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>
            Tableau de Bord
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '0.95rem' }}>Bienvenue sur votre espace de gestion premium.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/admin/add-vehicle" style={{ background: 'var(--color-primary)', color: 'var(--color-dark)', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', fontSize: '0.95rem', boxShadow: '0 4px 15px var(--color-primary-glow)', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            Nouveau Véhicule
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        {/* Stat Card 1: Vehicules */}
        <div style={{ background: 'linear-gradient(145deg, var(--color-surface), rgba(26, 31, 46, 0.4))', padding: '28px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Total Véhicules</div>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: '1' }}>{vehicles.length}</div>
            </div>
            <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '16px', borderRadius: '16px', color: 'var(--color-primary)' }}>
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H8c-.6 0-1.2.3-1.7.8L4 10.2v4.8c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', width: '100%', background: 'var(--color-primary)', opacity: 0.8 }}></div>
        </div>

        {/* Stat Card 2: Leads */}
        <div style={{ background: 'linear-gradient(145deg, var(--color-surface), rgba(26, 31, 46, 0.4))', padding: '28px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Nouveaux Leads</div>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: '1' }}>{orders.filter(o => o.status === 'nouveau').length}</div>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '16px', color: '#3b82f6' }}>
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', width: '100%', background: '#3b82f6', opacity: 0.8 }}></div>
        </div>

        {/* Stat Card 3: Valeur */}
        <div style={{ background: 'linear-gradient(145deg, var(--color-surface), rgba(26, 31, 46, 0.4))', padding: '28px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Valeur du stock (DA)</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: '1.2' }}>
                {totalValue.toLocaleString('fr-DZ')}
              </div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '16px', color: '#10b981' }}>
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', width: '100%', background: '#10b981', opacity: 0.8 }}></div>
        </div>

      </div>
    </div>
  );
}
