'use client';

import Link from 'next/link';
import styles from './CategoryIcons.module.css';

import { useParams } from 'next/navigation';
import fr from '@/dictionaries/fr.json';
import ar from '@/dictionaries/ar.json';

export default function CategoryIcons() {
  const paramsHook = useParams();
  const lang = paramsHook?.lang || 'fr';
  const dict = lang === 'ar' ? ar : fr;

  const categories = [
    {
      name: dict.inventory.tabNew,
      href: `/${lang}/inventaire?condition=Neuf`,
      icon: (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      name: dict.inventory.tabUsed,
      href: `/${lang}/inventaire?condition=Occasion`,
      icon: (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      name: dict.navbar.onOrder,
      href: `/${lang}/sur-commande`,
      icon: (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="9" x2="15" y2="9" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
    },
  ];
  return (
    <div className={styles.wrapper} id="category-icons">
      {categories.map((cat) => (
        <Link key={cat.name} href={cat.href} className={styles.item} aria-label={cat.name}>
          <div className={styles.iconCircle}>{cat.icon}</div>
          <span className={styles.label}>{cat.name}</span>
        </Link>
      ))}
    </div>
  );
}
