'use client';

import { useState } from 'react';
import { updateOrder } from '@/utils/supabaseClient';

export default function CommandesClient({ initialOrders }) {
  const [orders, setOrders] = useState(initialOrders);
  const [processingId, setProcessingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleStatusChange = async (id, currentStatus) => {
    setErrorMsg(null);
    setProcessingId(id);
    const newStatus = currentStatus === 'nouveau' ? 'contacté' : 'nouveau';
    try {
      await updateOrder(id, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error(err);
      setErrorMsg("Erreur maj statut : " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleArchive = async (id) => {
    setErrorMsg(null);
    setProcessingId(id);
    try {
      await updateOrder(id, { is_archived: true });
      // Soft delete: instantly remove from UI
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      console.error(err);
      setErrorMsg("Erreur lors de l'archivage : " + err.message + ". Assurez-vous que la colonne 'is_archived' existe.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', color: 'var(--color-dark)', marginBottom: '24px' }}>
        Commandes & Leads ({orders.length})
      </h1>

      {errorMsg && (
        <div style={{ padding: '16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
          {errorMsg}
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Téléphone</th>
              <th>Véhicule d&apos;intérêt</th>
              <th>Message</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>Aucun lead actif.</td>
              </tr>
            ) : orders.map((order) => (
              <tr key={order.id}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                </td>
                <td><strong>{order.clientName}</strong></td>
                <td style={{ whiteSpace: 'nowrap' }}>{order.phone}</td>
                <td><span style={{ background: 'var(--color-bg)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{order.vehicleInterest}</span></td>
                <td style={{ maxWidth: '300px' }}>
                  <p style={{ margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    {order.message}
                  </p>
                </td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    background: order.status === 'nouveau' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)', 
                    color: order.status === 'nouveau' ? '#2563eb' : '#16a34a', 
                    border: `1px solid ${order.status === 'nouveau' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                    borderRadius: '4px', 
                    fontSize: '0.8rem', 
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <div className="action-group">
                    <button 
                      onClick={() => handleStatusChange(order.id, order.status)}
                      disabled={processingId === order.id}
                      className="action-btn action-edit" 
                      title={order.status === 'nouveau' ? "Marquer comme Contacté" : "Marquer comme Nouveau"}
                      style={{ opacity: processingId === order.id ? 0.5 : 1, cursor: processingId === order.id ? 'not-allowed' : 'pointer' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleArchive(order.id)}
                      disabled={processingId === order.id}
                      className="action-btn action-delete" 
                      title="Archiver (Soft Delete)"
                      style={{ opacity: processingId === order.id ? 0.5 : 1, cursor: processingId === order.id ? 'not-allowed' : 'pointer' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                      </svg>
                    </button>
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
