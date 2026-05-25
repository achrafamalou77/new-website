'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/utils/formatPrice';
import styles from './VehicleCard.module.css';

export default function VehicleCard({ vehicle, featured = false }) {
  const availability = vehicle.availability || 'Disponible';
  const badgeClass = availability === 'Sur Commande' ? styles.badgeSurCommande : styles.badgeDisponible;

  return (
    <Link
      href={`/inventory/${vehicle.id}`}
      className={`${styles.card} ${featured ? styles.featured : ''}`}
      id={`vehicle-card-${vehicle.id}`}
    >
      {/* Image */}
      <div className={styles.imageWrap}>
        <Image
          src={vehicle.images?.[0] || '/images/cars/placeholder.jpg'}
          alt={`${vehicle.make} ${vehicle.model} ${vehicle.trim || ''} ${vehicle.year} chez Amine Auto`.replace(/\s+/g, ' ').trim()}
          fill
          sizes={featured ? '(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 50vw' : '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw'}
          style={{ objectFit: 'cover' }}
          className={`${styles.image} ${vehicle.is_sold ? styles.soldImage : ''}`}
        />

        {vehicle.is_sold && (
          <div className={styles.soldOutStamp}>
            VENDU
          </div>
        )}

        {/* Availability Badge */}
        <div className={`${styles.availabilityBadge} ${badgeClass}`}>
          <span className={styles.badgeDot} />
          {availability}
        </div>

        {/* Favorite */}
        <button className={styles.favorite} aria-label="Ajouter aux favoris" onClick={(e) => e.preventDefault()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>

        {/* Image Count */}
        <div className={styles.imgCount}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
          {vehicle.images?.length || 0}
        </div>

        {/* Featured ribbon */}
        {vehicle.featured && (
          <div className={styles.ribbon}>
            <span>En vedette</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={styles.info}>
        <h3 className={styles.title}>
          {vehicle.make} {vehicle.model}
        </h3>
        <p className={styles.price}>{formatPrice(vehicle.price)}</p>
        <div className={styles.meta}>
          <span className={styles.yearBadge}>{vehicle.year}</span>
          <span className={styles.metaItem}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            {vehicle.transmission}
          </span>
          <span className={styles.metaItem}>
            {vehicle.fuel === 'Électrique' ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="22" x2="21" y2="22"></line>
                <line x1="4" y1="9" x2="20" y2="9"></line>
                <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"></path>
                <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"></path>
              </svg>
            )}
            {vehicle.fuel}
          </span>
        </div>
      </div>
    </Link>
  );
}
