import { notFound } from 'next/navigation';
import { getPublicAgency, getPublicCars } from '@/app/actions/public-cars';
import Navbar from '@/components/website/templates/auto-am/components/Navbar/Navbar';
import Footer from '@/components/website/templates/auto-am/components/Footer/Footer';
import InventoryGrid from '@/components/website/templates/auto-am/components/InventoryGrid/InventoryGrid';
import '@/components/website/templates/auto-am/auto-am-theme.css';

import fr from '@/components/website/templates/auto-am/dictionaries/fr.json';
import ar from '@/components/website/templates/auto-am/dictionaries/ar.json';

export default async function CommandePage(props: {
  params: Promise<{ subdomain: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const agency = await getPublicAgency(params.subdomain).catch(() => null);
  if (!agency || agency.business_type_slug !== 'car_showroom') {
    notFound();
  }

  // Parse filters from search params
  const filters: any = {
    brand: typeof searchParams.brand === 'string' ? searchParams.brand : undefined,
    condition: typeof searchParams.condition === 'string' ? searchParams.condition : undefined,
    car_type: 'sur_command' as const,
  };

  // Only fetch available cars for stock
  const orderedCars = await getPublicCars(agency.id, filters);

  let lang = 'fr';
  const dict = lang === 'ar' ? (ar as any) : (fr as any);

  const phoneDisplay = agency.phone || '0560 00 31 06';
  const whatsappNumber = phoneDisplay.replace(/\s+/g, '').replace(/^0/, '213');

  return (
    <div className="auto-am-theme" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar lang={lang} agency={agency as any} />
      
      <main className="pt-[120px] pb-[80px]" style={{ background: '#0a0e17' }}>
        <div className="container">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Importation Sur Commande
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto mb-8">
              Vous cherchez un modèle spécifique non disponible localement ? Nous prenons en charge tout le processus d'importation 
              depuis l'Europe, le Golfe ou l'Asie jusqu'à votre porte en Algérie.
            </p>
            <div className="flex justify-center gap-4">
              <a href={`https://wa.me/${whatsappNumber}?text=Bonjour, je souhaite commander un véhicule spécifique.`}
                 className="btn-primary"
                 target="_blank" rel="noopener noreferrer">
                Lancer un Projet d'Importation
              </a>
            </div>
          </div>

          {/* Import process infographic */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16 text-center">
            {[
              { step: '01', title: 'Sélection & Devis', desc: 'Choisissez votre véhicule idéal et obtenez un devis complet incluant l\'achat, le transport et les taxes.' },
              { step: '02', title: 'Inspection & Achat', desc: 'Nos partenaires locaux inspectent rigoureusement le véhicule avant de procéder à l\'achat sécurisé.' },
              { step: '03', title: 'Transport Logistique', desc: 'Nous organisons le transport routier et maritime sécurisé du véhicule vers le port d\'Alger.' },
              { step: '04', title: 'Dédouanement & Livraison', desc: 'Prise en charge complète des formalités douanières et remise des clés de votre nouveau véhicule.' },
            ].map((step, idx) => (
              <div key={idx} className="bg-surface p-6 rounded-2xl border border-border flex flex-col items-center">
                <span className="text-3xl font-display font-bold text-primary mb-2">{step.step}</span>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-white mb-6 text-center md:text-left">
              Modèles Populaires Sur Commande
            </h2>
            {orderedCars.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun modèle prédéfini sur commande pour le moment. Contactez-nous pour commander n'importe quel modèle !</p>
            ) : (
              <InventoryGrid 
                vehicles={orderedCars as never[]} 
                dict={dict.inventoryGrid} 
                lang={lang} 
              />
            )}
          </div>
        </div>
      </main>

      <Footer lang={lang} agency={agency as any} />
    </div>
  );
}
