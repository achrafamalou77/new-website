import { notFound } from 'next/navigation';
import { getPublicAgency, getPublicCars } from '@/app/actions/public-cars';
import Navbar from '@/components/website/templates/auto-am/components/Navbar/Navbar';
import Footer from '@/components/website/templates/auto-am/components/Footer/Footer';
import SearchBar from '@/components/website/templates/auto-am/components/SearchBar/SearchBar';
import InventoryGrid from '@/components/website/templates/auto-am/components/InventoryGrid/InventoryGrid';
import '@/components/website/templates/auto-am/auto-am-theme.css';

// Import raw dictionary
import fr from '@/components/website/templates/auto-am/dictionaries/fr.json';
import ar from '@/components/website/templates/auto-am/dictionaries/ar.json';

export default async function VehiclesPage(props: { 
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
  const filters = {
    brand: typeof searchParams.brand === 'string' ? searchParams.brand : undefined,
    condition: typeof searchParams.condition === 'string' ? searchParams.condition : undefined,
  };

  const cars = await getPublicCars(agency.id, filters);
  let lang = 'fr';
  const dict = lang === 'ar' ? (ar as any) : (fr as any);

  return (
    <div className="auto-am-theme" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar lang={lang} agency={agency as any} />
      
      <main className="pt-[100px] pb-[80px]">
        <div className="container">
          <div className="mb-8">
            <SearchBar />
          </div>
          <InventoryGrid 
            vehicles={cars} 
            dict={dict.inventoryGrid} 
            lang={lang} 
          />
        </div>
      </main>

      <Footer lang={lang} agency={agency as any} />
    </div>
  );
}
