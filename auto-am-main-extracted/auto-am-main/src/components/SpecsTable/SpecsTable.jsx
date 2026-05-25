import styles from './SpecsTable.module.css';

export default function SpecsTable({ vehicle }) {
  const specs = [
    { label: 'Marque', value: vehicle.make, icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
    { label: 'Modèle', value: vehicle.model, icon: 'M5 12h14M12 5l7 7-7 7' },
    { label: 'Finition', value: vehicle.trim, icon: 'M12 15l-4-4h8l-4 4z' },
    { label: 'Année', value: vehicle.year, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Kilométrage', value: `${vehicle.mileage.toLocaleString('fr-DZ')} km`, icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    { label: 'Carburant', value: vehicle.fuel, icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6a2 2 0 012 2v16m-8-4h8m-8 0a2 2 0 002 2h4a2 2 0 002-2M13 9h2v2h-2z' },
    { label: 'Boîte de vitesse', value: vehicle.transmission, icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
    { label: 'Couleur', value: vehicle.color, icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    { label: 'État', value: vehicle.condition, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Moteur', value: vehicle.engineSize, icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ];

  return (
    <div className={styles.wrapper} id="specs-table">
      <h3 className={styles.title}>Spécifications Techniques</h3>
      <div className={styles.grid}>
        {specs.map((spec, index) => (
          <div key={index} className={styles.specItem}>
            <div className={styles.iconWrap}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={spec.icon} />
              </svg>
            </div>
            <div className={styles.specContent}>
              <span className={styles.label}>{spec.label}</span>
              <span className={styles.value}>{spec.value || '-'}</span>
            </div>
          </div>
        ))}
      </div>
      
      {vehicle.features && vehicle.features.length > 0 && (
        <div className={styles.features}>
          <h4 className={styles.featuresTitle}>Équipements & Options</h4>
          <ul className={styles.featuresList}>
            {vehicle.features.map((feature, i) => (
              <li key={i} className={styles.featureItem}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
