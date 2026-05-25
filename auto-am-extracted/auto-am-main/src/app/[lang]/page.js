import { getVehicles } from '@/utils/supabaseClient';
import HeroSection from '@/components/HeroSection/HeroSection';
import InventoryGrid from '@/components/InventoryGrid/InventoryGrid';
import PopularMakes from '@/components/PopularMakes/PopularMakes';
import WhyChooseUs from '@/components/WhyChooseUs/WhyChooseUs';
import { getDictionary } from '@/utils/getDictionary';

export default async function Home({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const vehicles = await getVehicles();

  return (
    <main>
      <HeroSection />
      <InventoryGrid vehicles={vehicles.slice(0, 5)} dict={dict.inventoryGrid} lang={lang} />
      <PopularMakes vehicles={vehicles} dict={dict.popular} />
      <WhyChooseUs dict={dict.whyChooseUs} />
    </main>
  );
}
