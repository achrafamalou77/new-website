import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPublicAgency } from '@/app/actions/public-cars';
import Navbar from '@/components/website/templates/auto-am/components/Navbar/Navbar';
import Footer from '@/components/website/templates/auto-am/components/Footer/Footer';
import StickyContactBar from '@/components/website/templates/auto-am/components/StickyContactBar/StickyContactBar';
import VehicleDetailClient from './VehicleDetailClient';
import '@/components/website/templates/auto-am/auto-am-theme.css';

export default async function VehicleDetailPage(props: { 
  params: Promise<{ subdomain: string, id: string }>
}) {
  const params = await props.params;
  
  const agency = await getPublicAgency(params.subdomain).catch(() => null);
  if (!agency || agency.business_type_slug !== 'car_showroom') {
    notFound();
  }

  const defaultSalesCars = [
    {
      id: 'sc-1',
      brand: 'Hyundai',
      model: 'Tucson 2.0 Htrac',
      year: 2026,
      selling_price: 6500000,
      final_price: 6500000,
      price: 6500000,
      condition: 'new',
      mileage: 0,
      fuel_type: 'diesel',
      transmission: 'automatic',
      cover_image_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600',
      images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200'],
      description: "Le tout nouveau Hyundai Tucson redéfinit les standards des SUV modernes avec sa transmission intégrale active HTRAC, sa motorisation diesel robuste de 2.0L et sa boîte automatique fluide à 8 rapports. Un confort de premier ordre pour toutes vos aventures.",
      features: ["Projecteurs Full LED", "Toit Ouvrant Panoramique", "Jantes Alliage 19\"", "Écran Tactile 10.25\"", "Caméra 360°", "Aide au Stationnement Active"]
    },
    {
      id: 'sc-2',
      brand: 'Seat',
      model: 'Ibiza FR Leon',
      year: 2025,
      selling_price: 4200000,
      final_price: 4200000,
      price: 4200000,
      condition: 'used',
      mileage: 15000,
      fuel_type: 'petrol',
      transmission: 'manual',
      cover_image_url: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=600',
      images: ['https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=1200'],
      description: "Une compacte sportive et dynamique dotée de la finition FR exclusive. Parfaite pour la ville et les trajets routiers avec une tenue de route irréprochable et un habitacle connecté.",
      features: ["Sièges Sport FR", "Régulateur de Vitesse Adaptatif", "Aide au Maintien de Voie", "Cockpit Digital", "Climatisation Automatique Bi-Zone"]
    },
    {
      id: 'sc-3',
      brand: 'Kia',
      model: 'Sportage GT-Line',
      year: 2026,
      selling_price: 7400000,
      final_price: 7400000,
      price: 7400000,
      condition: 'new',
      mileage: 0,
      fuel_type: 'diesel',
      transmission: 'automatic',
      cover_image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600',
      images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200'],
      description: "Le Kia Sportage GT-Line allie sportivité, espace et technologies embarquées de dernière génération. Sa calandre 'Tiger Nose' affirmée et sa finition haut de gamme sauront vous séduire.",
      features: ["Finition Sportive GT-Line", "Jantes Alliage 19\"", "Son Premium Harman Kardon", "Toit Panoramique Ouvrant", "Hayon Motorisé intelligent"]
    },
    {
      id: 'sc-4',
      brand: 'Toyota',
      model: 'Land Cruiser Prado',
      year: 2026,
      selling_price: 18500000,
      final_price: 18500000,
      price: 18500000,
      condition: 'new',
      mileage: 0,
      fuel_type: 'diesel',
      transmission: 'automatic',
      cover_image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600',
      images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200'],
      description: "Le franchisseur légendaire par excellence. Prêt à affronter les pistes les plus difficiles d'Algérie en offrant une fiabilité absolue et un luxe intérieur digne des plus grands salons.",
      features: ["Suspension Pneumatique", "Intérieur Cuir Premium", "Système Audio JBL 14 HP", "Bloquage de Différentiel", "Climatisation 4 Zones"]
    }
  ];

  const supabase = await createClient();
  const { data: vehicleData, error } = await supabase
    .from('car_sales_inventory')
    .select('*')
    .eq('id', params.id)
    .eq('agency_id', agency.id)
    .single();

  let vehicle: any = null;
  let similarCars: any[] = [];

  if (error || !vehicleData) {
    // Attempt fallback to defaultSalesCars
    const mockMatch = defaultSalesCars.find(c => c.id === params.id);
    if (!mockMatch) {
      notFound();
    }
    vehicle = mockMatch;
    similarCars = defaultSalesCars.filter(c => c.id !== params.id).slice(0, 3);
  } else {
    // Unpack specs for the selected vehicle
    const specs = (vehicleData as any).specs || {}
    vehicle = {
      ...vehicleData,
      ...specs,
      color_exterior: (vehicleData as any).color || specs.color_exterior || '',
      selling_price: (vehicleData as any).price || specs.selling_price || 0,
      purchase_price: (vehicleData as any).cost_price || specs.purchase_price || 0,
      car_type: (vehicleData as any).car_type || (vehicleData as any).type || specs.car_type || 'sell',
      condition: specs.condition || 'new',
    };
    
    // Fetch similar cars
    const { data: similarCarsData } = await supabase
      .from('car_sales_inventory')
      .select('*')
      .eq('agency_id', agency.id)
      .eq('status', 'available')
      .neq('id', params.id)
      .limit(3);
      
    similarCars = ((similarCarsData as any[]) || []).map((car: any) => {
      const sp = car.specs || {}
      return {
        ...car,
        ...sp,
        color_exterior: car.color || sp.color_exterior || '',
        selling_price: car.price || sp.selling_price || 0,
        purchase_price: car.cost_price || sp.purchase_price || 0,
        car_type: car.car_type || car.type || sp.car_type || 'sell',
        condition: sp.condition || 'new',
        show_on_website: sp.show_on_website !== false,
      }
    }).filter(car => car.show_on_website !== false);
  }
  let lang = 'fr';
  const basePath = `/${params.subdomain}`;

  return (
    <div className="auto-am-theme min-h-screen" dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ background: '#0a0e17' }}>
      <Navbar lang={lang} agency={agency as any} />
      
      <main className="pt-[100px] pb-[80px]">
        <VehicleDetailClient 
          vehicle={vehicle} 
          similarCars={similarCars} 
          agency={agency} 
          basePath={basePath}
        />
      </main>

      <Footer lang={lang} agency={agency as any} />
      <StickyContactBar agency={agency as any} />
    </div>
  );
}
