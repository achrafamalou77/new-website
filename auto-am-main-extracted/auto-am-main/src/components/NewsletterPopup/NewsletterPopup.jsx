'use client';

import { useState, useEffect } from 'react';
import { addNewsletterEmail } from '@/utils/supabaseClient';
import styles from './NewsletterPopup.module.css';

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenPopup');
    if (!hasSeen) {
      const timer = setTimeout(() => setIsOpen(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenPopup', 'true');
    setIsOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await addNewsletterEmail(email);
      setSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (err) {
      setError('Cet email est déjà inscrit ou une erreur est survenue.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Fermer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
          </svg>
        </button>

        <div className={styles.accent} />

        {submitted ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>✓</div>
            <h3>Merci ! Vous êtes inscrit.</h3>
            <p>Vous recevrez nos offres en avant-première.</p>
          </div>
        ) : (
          <>
            <div className={styles.badge}>Exclusif</div>
            <h2 className={styles.headline}>
              Rejoignez le Club{' '}
              <span className={styles.brand}>Amine Auto</span>
            </h2>
            <p className={styles.description}>
              Recevez nos arrivages exclusifs, offres spéciales et invitations VIP directement dans votre boîte mail.
            </p>

            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email"
                required
                className={styles.input}
              />
              <button type="submit" className={styles.submitBtn}>
                S&apos;abonner
              </button>
            </form>

            <button className={styles.dismissBtn} onClick={handleClose}>
              Non merci, continuer à naviguer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
