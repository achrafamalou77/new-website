import { notFound } from 'next/navigation';
import { getVehicleById, getSimilarVehicles } from '@/utils/supabaseClient';
import { formatPrice } from '@/utils/formatPrice';
import Gallery from '@/components/Gallery/Gallery';
import ContactSidebar from '@/components/ContactSidebar/ContactSidebar';
import SimilarVehicles from '@/components/SimilarVehicles/SimilarVehicles';
import VehicleHistory from '@/components/VehicleHistory/VehicleHistory';
import styles from './page.module.css';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const vehicle = await getVehicleById(id);

  if (!vehicle) return { title: 'Véhicule Introuvable | Amine Auto' };

  const title = `${vehicle.make} ${vehicle.model} ${vehicle.trim || ''} ${vehicle.year} | Amine Auto`;
  const description = vehicle.description || `Achetez cette superbe ${vehicle.make} ${vehicle.model} ${vehicle.year} chez Amine Auto. Prix: ${formatPrice(vehicle.price)}.`;
  const image = vehicle.images?.[0] || '/images/hero-poster.jpg';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image,
          width: 800,
          height: 600,
          alt: `${vehicle.make} ${vehicle.model} à Alger`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function ListingPage({ params }) {
  const { id } = await params;
  const vehicle = await getVehicleById(id);

  if (!vehicle) {
    notFound();
  }

  const similarVehicles = await getSimilarVehicles(vehicle);

  const title = `${vehicle.make} ${vehicle.model}${vehicle.trim ? ' ' + vehicle.trim : ''}`;

  /* Build the specs list for the sidebar */
  const specs = [
    { label: 'Marque', value: vehicle.make },
    { label: 'Modèle', value: vehicle.model },
    { label: 'Finition', value: vehicle.trim },
    { label: 'Couleur', value: vehicle.color },
    { label: 'Transmission', value: vehicle.driveType },
    { label: 'Boîte de vitesse', value: vehicle.transmission },
    { label: 'État', value: vehicle.condition },
    { label: 'Année', value: vehicle.year },
    { label: 'Carburant', value: vehicle.fuel },
    { label: 'Moteur', value: vehicle.engineSize },
    { label: 'Portes', value: vehicle.doors ? `${vehicle.doors} portes` : null },
    { label: 'Cylindres', value: vehicle.cylinders },
    { label: 'Kilométrage', value: vehicle.mileage != null ? `${vehicle.mileage.toLocaleString('fr-DZ')} km` : null },
    { label: 'VIN', value: vehicle.vin },
  ].filter(s => s.value);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: title,
    image: vehicle.images?.[0] || 'https://www.amineauto.dz/images/hero-poster.jpg',
    description: vehicle.description || `Achetez cette superbe ${title} chez Amine Auto`,
    brand: {
      '@type': 'Brand',
      name: vehicle.make,
    },
    model: vehicle.model,
    vehicleModelDate: vehicle.year,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'DZD',
      price: vehicle.price,
      itemCondition: vehicle.condition?.toLowerCase().includes('neuf') ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
      availability: vehicle.is_sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      seller: {
        '@type': 'AutoDealer',
        name: 'Amine Auto',
      }
    }
  };

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container">

        {/* ====== Two-Column Layout ====== */}
        <div className={styles.layout}>

          {/* ---- Left Column: Gallery + Details (~65%) ---- */}
          <div className={styles.mainCol}>

            {/* Gallery at the top of left column */}
            <div style={{ position: 'relative' }}>
              <Gallery images={vehicle.images} title={title} />
              {vehicle.is_sold && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-15deg)',
                  background: 'rgba(0, 0, 0, 0.85)',
                  border: '6px solid white',
                  color: 'white',
                  fontWeight: 900,
                  padding: '16px 40px',
                  textTransform: 'uppercase',
                  letterSpacing: '4px',
                  zIndex: 20,
                  fontSize: '2.5rem',
                  boxShadow: '0 6px 30px rgba(0,0,0,0.6)',
                  pointerEvents: 'none'
                }}>
                  VENDU
                </div>
              )}
            </div>

            {/* Description */}
            <section className={styles.contentSection}>
              <h2 className={styles.sectionTitle}>Description</h2>
              <p className={styles.descriptionText}>
                {vehicle.description || `Cette ${vehicle.make} ${vehicle.model} ${vehicle.year} est disponible chez Amine Auto. Contactez-nous pour plus de détails ou pour planifier un essai routier.`}
              </p>
            </section>

            {/* Équipements & Options */}
            {vehicle.features && vehicle.features.length > 0 && (
              <section className={styles.contentSection}>
                <h2 className={styles.sectionTitle}>Équipements &amp; Options</h2>
                <div className={styles.featuresPills}>
                  {vehicle.features.map((feature, i) => (
                    <div key={i} className={styles.featurePill}>
                      <svg className={styles.featureCheck} width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" stroke="var(--color-primary)" strokeOpacity="0.2" fill="var(--color-primary-light)" />
                        <path d="M9 12l2 2 4-4" stroke="var(--color-primary)" />
                      </svg>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Inspection Badge */}
            <section className={styles.inspectionSection}>
              <div className={styles.inspectionBadge}>
                <div className={styles.inspectionIcon}>
                  <svg fill="currentColor" viewBox="0 0 24 24" width="32" height="32">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <div>
                  <strong className={styles.inspectionTitle}>Inspection Technique 150 Points</strong>
                  <p className={styles.inspectionSubtitle}>Ce véhicule a passé notre inspection complète avec succès.</p>
                </div>
              </div>
            </section>

            {/* Historique du véhicule */}
            <VehicleHistory />

            {/* Localisation / Map */}
            <section className={styles.contentSection}>
              <h2 className={styles.sectionTitle}>Localisation</h2>
              <div className={styles.mapWrap}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d204634.3662103357!2d3.1269850157993884!3d36.736681328359836!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x128e5d0073e20e89%3A0xd76a9825d87b2cdd!2sAmine%20auto%2035!5e0!3m2!1sen!2sdz!4v1777734505345!5m2!1sen!2sdz"
                  width="100%"
                  height="300"
                  style={{ border: 0, borderRadius: '12px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localisation de Amine Auto"
                />
              </div>
            </section>
          </div>

          {/* ---- Right Column: Sticky Sidebar (~35%) ---- */}
          <aside className={styles.sidebarCol}>
            <div className={styles.sidebarSticky}>

              {/* 1. Title + Year + Price (Top) */}
              <div className={styles.headerCard}>
                <h1 className={styles.vehicleTitle}>{title}</h1>
                <div className={styles.vehicleMeta}>
                  <span className={styles.yearPill}>{vehicle.year}</span>
                  <span className={styles.metaDot}>{vehicle.bodyType || 'Véhicule'}</span>
                  {vehicle.fuel && <span className={styles.metaDot}>{vehicle.fuel}</span>}
                </div>
                <div className={styles.priceValue}>{formatPrice(vehicle.price)}</div>
              </div>

              {/* 2. Specs Table (Middle) */}
              <div className={styles.specsCard}>
                <h3 className={styles.specsTitle}>Spécifications Techniques</h3>
                <dl className={styles.specsList}>
                  {specs.map((spec, i) => (
                    <div key={i} className={styles.specsRow}>
                      <dt className={styles.specsLabel}>{spec.label}</dt>
                      <dd className={styles.specsValue}>{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* 3. Contact Form + WhatsApp (Bottom) */}
              <ContactSidebar vehicle={vehicle} hidePriceBox />
            </div>
          </aside>
        </div>

        {/* ====== Similar Vehicles ====== */}
        <SimilarVehicles vehicles={similarVehicles} />

      </div>
    </main>
  );
}
