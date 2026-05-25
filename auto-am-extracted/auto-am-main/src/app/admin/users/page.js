'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import '../../globals.css';
import '../admin-globals.css';

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
      
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setCreating(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      
      // Reset form
      setEmail('');
      setPassword('');
      
      // Refresh list
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible.')) return;

    try {
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');
      
      // Refresh list
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--color-text)' }}>Gestion des Administrateurs</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Gérez les utilisateurs qui ont accès à ce panneau d'administration.</p>
      </div>

      {error && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.2)', 
          color: '#ef4444', 
          padding: '16px', 
          borderRadius: '12px', 
          marginBottom: '24px' 
        }}>
          <strong>Erreur:</strong> {error}
          {error.includes('SUPABASE_SERVICE_ROLE_KEY') && (
            <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>
              Veuillez configurer la clé <code>SUPABASE_SERVICE_ROLE_KEY</code> dans votre fichier <code>.env.local</code>.
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
        
        {/* Users Table */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.25rem', margin: '0' }}>Utilisateurs ({users.length})</h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Chargement...</div>
            ) : users.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Aucun utilisateur trouvé.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>Email</th>
                    <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>Date de création</th>
                    <th style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px 20px' }}>{user.email}</td>
                      <td style={{ padding: '16px 20px', color: 'var(--color-text-muted)' }}>
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Add User Form */}
        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', margin: '0 0 20px 0' }}>Ajouter un Admin</h2>
          
          <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Mot de passe</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={creating}
              style={{ 
                background: 'var(--color-primary)', 
                color: '#000', 
                border: 'none', 
                padding: '14px', 
                borderRadius: '8px', 
                fontWeight: '600',
                cursor: creating ? 'not-allowed' : 'pointer',
                opacity: creating ? 0.7 : 1,
                marginTop: '8px'
              }}
            >
              {creating ? 'Création...' : 'Ajouter'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
