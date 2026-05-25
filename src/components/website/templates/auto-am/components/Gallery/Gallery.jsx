'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './Gallery.module.css';

export default function Gallery({ images, title }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <div className={styles.gallery} id="listing-gallery">
      {/* Main Image */}
      <div className={styles.mainView}>
        <Image
          src={images[activeIndex]}
          alt={`${title} chez SARL 2S Auto Alger - Vue ${activeIndex + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 70vw"
          className={styles.mainImage}
        />
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              className={`${styles.navBtn} ${styles.prevBtn}`}
              onClick={() => setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              aria-label="Image précédente"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              className={`${styles.navBtn} ${styles.nextBtn}`}
              onClick={() => setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              aria-label="Image suivante"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className={styles.thumbnails}>
          {images.map((img, idx) => (
            <button
              key={idx}
              className={`${styles.thumbWrap} ${idx === activeIndex ? styles.thumbActive : ''}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Voir l'image ${idx + 1}`}
            >
              <Image
                src={img}
                alt={`Miniature de ${title} chez SARL 2S Auto Alger - ${idx + 1}`}
                fill
                sizes="150px"
                className={styles.thumbImg}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
