import VehicleCard from '../VehicleCard/VehicleCard';
import styles from './SimilarVehicles.module.css';

export default function SimilarVehicles({ vehicles }) {
  if (!vehicles || vehicles.length === 0) return null;

  return (
    <section className={styles.section} id="similar-vehicles">
      <div className={styles.header}>
        <span className={styles.badge}>Découvrir</span>
        <h2 className={styles.heading}>Véhicules Similaires</h2>
        <p className={styles.subtitle}>
          Explorez d&apos;autres modèles de la même marque dans notre inventaire.
        </p>
      </div>
      <div className={styles.grid}>
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </section>
  );
}
