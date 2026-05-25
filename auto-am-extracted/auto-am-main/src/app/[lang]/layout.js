import '../globals.css';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import NewsletterPopup from '@/components/NewsletterPopup/NewsletterPopup';
import StickyContactBar from '@/components/StickyContactBar/StickyContactBar';

export const metadata = {
  metadataBase: new URL('https://www.amineauto.dz'),
  title: {
    default: 'Amine Auto | Importation de Véhicules Chinois en Algérie',
    template: '%s | Amine Auto',
  },
  description: "Importez des véhicules chinois modernes en Algérie avec Amine Auto. Chery, Geely, BYD, Jetour et plus. Disponibles en stock ou sur commande.",
  keywords: ['voitures chinoises', 'automobile', 'import', 'Algérie', 'véhicules', 'Chery', 'Geely', 'BYD', 'Jetour', 'Boumerdes'],
  openGraph: {
    title: 'Amine Auto | Importation de Véhicules Chinois en Algérie',
    description: "Importez des véhicules chinois modernes en Algérie avec Amine Auto. Disponibles en stock ou sur commande.",
    url: 'https://www.amineauto.dz',
    siteName: 'Amine Auto',
    images: [
      {
        url: '/images/hero-poster.jpeg',
        width: 1200,
        height: 630,
        alt: 'Showroom Amine Auto à Boumerdes',
      },
    ],
    locale: 'fr_DZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amine Auto | Importation de Véhicules Chinois en Algérie',
    images: ['/images/hero-poster.jpeg'],
  },
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
};

export default async function RootLayout({ children, params }) {
  const { lang } = await params;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'Amine Auto',
    image: 'https://www.amineauto.dz/images/logo.png',
    '@id': 'https://www.amineauto.dz',
    url: 'https://www.amineauto.dz',
    telephone: '+213560003106',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Oulad Hedaj',
      addressLocality: 'Boumerdes',
      addressRegion: 'Boumerdes',
      postalCode: '35000',
      addressCountry: 'DZ'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 36.736681,
      longitude: 3.126985
    }
  };

  return (
    <html lang={lang || 'fr'} dir={lang === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Navbar lang={lang} />
        {children}
        <Footer lang={lang} />
        <NewsletterPopup lang={lang} />
        <StickyContactBar lang={lang} />
      </body>
    </html>
  );
}
