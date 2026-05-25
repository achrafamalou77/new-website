'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import AdminSidebar from '@/components/AdminSidebar/AdminSidebar';
import '../globals.css';
import './admin-globals.css';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && !isLoginPage) {
        router.push('/admin/login');
      } else if (session && isLoginPage) {
        router.push('/admin');
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [isLoginPage, router]);

  if (loading) {
    return (
      <html lang="fr" suppressHydrationWarning>
        <body suppressHydrationWarning style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>Chargement sécurisé...</div>
        </body>
      </html>
    );
  }

  if (isLoginPage) {
    return (
      <html lang="fr" suppressHydrationWarning>
        <body suppressHydrationWarning style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <div className="admin-layout">
          <AdminSidebar />
          <div className="admin-main">
            <header className="admin-header">
              <div className="header-greeting">
                <h2>Bonjour, Administrateur</h2>
                <p>Gérez votre inventaire et vos leads.</p>
              </div>
            </header>
            <main className="admin-content">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
