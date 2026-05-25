'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/utils/formatPrice';
import DeleteButton from '@/components/Admin/DeleteButton';

export default function InventoryClient({ vehicles }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVehicles = vehicles.filter(v => {
    const term = searchTerm.toLowerCase();
    return (
      v.make?.toLowerCase().includes(term) ||
      v.model?.toLowerCase().includes(term) ||
      v.trim?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', color: 'var(--color-dark)', margin: 0 }}>Gestion de l&apos;Inventaire</h1>
        <Link href="/admin/add-vehicle" className="btn-primary" style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
          + Ajouter un véhicule
        </Link>
      </div>

      <div style={{ marginBottom: '24px', position: 'relative', width: '100%', maxWidth: '500px' }}>
        <input 
          type="text" 
          placeholder="Rechercher par marque, modèle ou finition..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem', background: '#fff' }}
        />
        <svg 
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" 
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
        >
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Marque & Modèle</th>
              <th className="hide-on-mobile">Année</th>
              <th className="hide-on-mobile">Prix (DA)</th>
              <th className="hide-on-mobile">Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>Aucun véhicule ne correspond à votre recherche.</td>
              </tr>
            ) : filteredVehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td>
                  <div style={{ position: 'relative', width: '60px', height: '40px', borderRadius: '4px', overflow: 'hidden' }}>
                    <Image src={vehicle.images?.[0] || '/images/cars/placeholder.jpg'} alt="Thumbnail" fill sizes="60px" style={{ objectFit: 'cover' }} />
                    {vehicle.is_sold && (
                      <span style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 'bold' }}>VENDU</span>
                    )}
                  </div>
                </td>
                <td>
                  <strong>{vehicle.make}</strong> {vehicle.model} {vehicle.trim && <span style={{ fontSize: '0.85rem', color: '#666' }}>({vehicle.trim})</span>}
                </td>
                <td className="hide-on-mobile">{vehicle.year}</td>
                <td className="hide-on-mobile"><strong>{formatPrice(vehicle.price)}</strong></td>
                <td className="hide-on-mobile">
                  {vehicle.is_sold ? (
                    <span style={{ padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                      Vendu
                    </span>
                  ) : (
                    <span style={{ padding: '4px 8px', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                      En ligne
                    </span>
                  )}
                </td>
                <td>
                  <div className="action-group">
                    <Link href={`/admin/edit-vehicle/${vehicle.id}`} className="action-btn action-edit" title="Modifier">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Link>
                    <DeleteButton id={vehicle.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
