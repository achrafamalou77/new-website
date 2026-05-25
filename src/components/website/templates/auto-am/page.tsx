// src/components/website/templates/auto-am/page.tsx
'use client';

import React from 'react';
import './auto-am-theme.css'; // Global scope wrapper
import NavbarDefault from './components/Navbar/Navbar';
import HeroSectionDefault from './components/HeroSection/HeroSection';
import InventoryGridDefault from './components/InventoryGrid/InventoryGrid';
import PopularMakesDefault from './components/PopularMakes/PopularMakes';
import WhyChooseUsDefault from './components/WhyChooseUs/WhyChooseUs';
import FooterDefault from './components/Footer/Footer';
import NewsletterPopup from './components/NewsletterPopup/NewsletterPopup';
import StickyContactBar from './components/StickyContactBar/StickyContactBar';

// Import raw dictionaries since we cannot use async server components here seamlessly without refactoring everything.
import fr from './dictionaries/fr.json';
import ar from './dictionaries/ar.json';

interface AutoAMTemplateProps {
  agency: {
    id: string;
    company_name: string;
    phone: string;
    email: string;
    address: string;
    logo_url?: string;
  };
  salesCars: any[];
  builderConfig?: any;
}

export default function AutoAMTemplate({ agency, salesCars, builderConfig }: AutoAMTemplateProps) {
  let lang = 'fr';
  const dict = lang === 'ar' ? (ar as any) : (fr as any);
  const cars = (salesCars as any[]) || [];
  const globalSettings = builderConfig?.global || builderConfig?.global_styles || {};

  const sections = builderConfig?.sections || builderConfig?.structure?.sections;
  const hasSections = Array.isArray(sections) && sections.length > 0;

  return (
    <div 
      className="auto-am-theme min-h-screen text-slate-100 flex flex-col font-sans selection:bg-yellow-600 selection:text-white" 
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{
        '--color-primary': globalSettings.primaryColor || globalSettings.primary_color || '#D4AF37',
        '--color-primary-hover': globalSettings.primaryColorHover || '#B8962E',
        '--font-primary': globalSettings.fontFamily || globalSettings.heading_font || "'Inter', sans-serif"
      } as React.CSSProperties}
    >
      {hasSections ? (
        <>
          {sections.map((sec: any) => {
            switch (sec.type) {
              case 'Navbar':
                return <NavbarDefault key={sec.id} agency={agency} lang={lang} />;
              case 'Hero':
                return <HeroSectionDefault key={sec.id} />;
              case 'Car Grid':
                return (
                  <InventoryGridDefault 
                    key={sec.id}
                    vehicles={cars.slice(0, sec.content?.limit || 6) as never[]} 
                    dict={dict.inventoryGrid} 
                    lang={lang} 
                  />
                );
              case 'Services':
                return (
                  <PopularMakesDefault 
                    key={sec.id}
                    vehicles={cars as never[]} 
                    dict={dict.popular} 
                  />
                );
              case 'Testimonials':
                return <WhyChooseUsDefault key={sec.id} dict={dict.whyChooseUs} />;
              case 'Footer':
                return <FooterDefault key={sec.id} agency={agency} lang={lang} />;
              default:
                return (
                  <div key={sec.id} className="py-12 bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs rounded-xl max-w-6xl mx-auto my-4 px-6 font-semibold">
                    Section {sec.name || sec.type} ({sec.variant})
                  </div>
                );
            }
          })}
          <NewsletterPopup />
          <StickyContactBar agency={agency} />
        </>
      ) : (
        <>
          <NavbarDefault agency={agency} lang={lang} />
          <main>
            <HeroSectionDefault />
            <InventoryGridDefault 
              vehicles={cars.slice(0, 6) as never[]} 
              dict={dict.inventoryGrid} 
              lang={lang} 
            />
            <PopularMakesDefault 
              vehicles={cars as never[]} 
              dict={dict.popular} 
            />
            <WhyChooseUsDefault dict={dict.whyChooseUs} />
          </main>
          <FooterDefault agency={agency} lang={lang} />
          <NewsletterPopup />
          <StickyContactBar agency={agency} />
        </>
      )}
    </div>
  );
}

export { AutoAMTemplate };
