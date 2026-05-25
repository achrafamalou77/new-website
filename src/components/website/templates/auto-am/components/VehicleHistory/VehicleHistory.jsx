'use client';

import styles from './VehicleHistory.module.css';

export default function VehicleHistory() {
  return (
    <section className={styles.section} id="vehicle-history">
      <h2 className={styles.title}>Historique du véhicule</h2>
      <div className={styles.content}>
        <button
          type="button"
          className={styles.downloadBtn}
          onClick={() => alert('Le rapport complet sera bientôt disponible.')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Télécharger le rapport
        </button>
        <p className={styles.description}>
          Avant de vous décider, consultez l&apos;historique complet de ce véhicule.
        </p>
      </div>
    </section>
  );
}
