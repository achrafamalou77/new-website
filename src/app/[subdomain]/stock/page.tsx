import { notFound } from 'next/navigation';
import { getPublicAgency, getPublicCars } from '@/app/actions/public-cars';
import Navbar from '@/components/website/templates/auto-am/components/Navbar/Navbar';
import Footer from '@/components/website/templates/auto-am/components/Footer/Footer';
import InventoryGrid from '@/components/website/templates/auto-am/components/InventoryGrid/InventoryGrid';
import SearchBar from '@/components/website/templates/auto-am/components/SearchBar/SearchBar';
import '@/components/website/templates/auto-am/auto-am-theme.css';

import fr from '@/components/website/templates/auto-am/dictionaries/fr.json';
import ar from '@/components/website/templates/auto-am/dictionaries/ar.json';

export default async function StockPage(props: {
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
    car_type: 'sell' as const,
  };

  // Only fetch available cars for Stock
  const stockCars = await getPublicCars(agency.id, filters);

  let lang = 'fr';
  const dict = lang === 'ar' ? (ar as any) : (fr as any);

  return (
    <div className="auto-am-theme" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar lang={lang} agency={agency as any} />
      
      <main className="pt-[120px] pb-[80px]" style={{ background: '#0a0e17' }}>
        <div className="container">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Véhicules en Stock
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto">
              Découvrez notre sélection de véhicules disponibles immédiatement chez {agency.company_name || agency.name}. 
              Qualité certifiée, garantis et prêts pour la route.
            </p>
          </div>

          <div className="mb-10">
            <SearchBar />
          </div>

          <InventoryGrid 
            vehicles={stockCars as never[]} 
            dict={dict.inventoryGrid} 
            lang={lang} 
          />
        </div>
      </main>

      <Footer lang={lang} agency={agency as any} />
    </div>
  );
}
