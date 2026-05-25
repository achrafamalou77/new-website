import { getVehicles } from '@/utils/supabaseClient';
import VehicleCard from '@/components/VehicleCard/VehicleCard';
import { getDictionary } from '@/utils/getDictionary';
import styles from './SurCommande.module.css';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return {
    title: dict.surCommande.metaTitle,
    description: dict.surCommande.metaDesc,
  };
}

export default async function SurCommandePage({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const allVehicles = await getVehicles();
  const surCommandeVehicles = allVehicles.filter((v) => v.availability === 'Sur Commande');

  return (
    <main className={styles.page}>
      
      {/* 1. Stunning Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            {dict.surCommande.heroTitle} <br /> <span className={styles.heroHighlight}>{dict.surCommande.heroHighlight}</span>
          </h1>
          <p className={styles.heroSubtitle}>
            {dict.surCommande.heroSubtitle}
          </p>
          <div className={styles.heroActions}>
            <a href="#inventory-grid" className={styles.primaryBtn}>
              {dict.surCommande.btnViewModels}
            </a>
            <a href="https://wa.me/213560003106" target="_blank" rel="noopener noreferrer" className={styles.secondaryBtn}>
              {dict.surCommande.btnContact}
            </a>
          </div>
        </div>
        <div className={styles.heroGlow}></div>
      </section>

      {/* 2. Process Section (How it works) */}
      <section className={styles.processSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{dict.surCommande.processTitle}</h2>
            <p className={styles.sectionSubtitle}>{dict.surCommande.processSubtitle}</p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>01</div>
              <h3 className={styles.stepTitle}>{dict.surCommande.step1Title}</h3>
              <p className={styles.stepDesc}>{dict.surCommande.step1Desc}</p>
            </div>
            
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>02</div>
              <h3 className={styles.stepTitle}>{dict.surCommande.step2Title}</h3>
              <p className={styles.stepDesc}>{dict.surCommande.step2Desc}</p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>03</div>
              <h3 className={styles.stepTitle}>{dict.surCommande.step3Title}</h3>
              <p className={styles.stepDesc}>{dict.surCommande.step3Desc}</p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>04</div>
              <h3 className={styles.stepTitle}>{dict.surCommande.step4Title}</h3>
              <p className={styles.stepDesc}>{dict.surCommande.step4Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Showcase Grid */}
      <section id="inventory-grid" className={styles.showcaseSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{dict.surCommande.showcaseTitle} <span className={styles.heroHighlight}>{dict.surCommande.showcaseHighlight}</span></h2>
            <p className={styles.sectionSubtitle}>{dict.surCommande.showcaseSubtitle}</p>
          </div>

          {surCommandeVehicles.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>{dict.surCommande.emptyTitle}</h3>
              <p>{dict.surCommande.emptyDesc}</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {surCommandeVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Bottom CTA */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>{dict.surCommande.ctaTitle}</h2>
            <p className={styles.ctaSubtitle}>{dict.surCommande.ctaSubtitle}</p>
            <a href="https://wa.me/213560003106" target="_blank" rel="noopener noreferrer" className={styles.whatsappBtn}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
              {dict.surCommande.btnWhatsapp}
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
