import { notFound } from 'next/navigation';
import { getPublicAgency } from '@/app/actions/public-cars';
import Navbar from '@/components/website/templates/auto-am/components/Navbar/Navbar';
import Footer from '@/components/website/templates/auto-am/components/Footer/Footer';
import ContactForm from './ContactForm';
import '@/components/website/templates/auto-am/auto-am-theme.css';

export default async function ContactPage(props: {
  params: Promise<{ subdomain: string }>
}) {
  const params = await props.params;
  const agency = await getPublicAgency(params.subdomain).catch(() => null);
  if (!agency || agency.business_type_slug !== 'car_showroom') {
    notFound();
  }

  let lang = 'fr';

  return (
    <div className="auto-am-theme" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar lang={lang} agency={agency as any} />
      
      <main className="pt-[120px] pb-[80px]" style={{ background: '#0a0e17' }}>
        <div className="container">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Contactez {agency.company_name || agency.name}
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto">
              Une question sur un véhicule ? Un projet d'importation sur commande ?
              Notre équipe d'experts est à votre entière disposition.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-surface p-8 rounded-3xl border border-border">
              <h2 className="text-2xl font-bold text-white mb-6">Envoyez-nous un Message</h2>
              <ContactForm agencyId={agency.id} />
            </div>

            {/* Info Card */}
            <div className="flex flex-col justify-between gap-8">
              <div className="bg-surface p-8 rounded-3xl border border-border">
                <h2 className="text-2xl font-bold text-white mb-6">Nos Coordonnées</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary mt-1">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1">Téléphone</h3>
                      <p className="text-gray-400">{agency.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary mt-1">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1">Email</h3>
                      <p className="text-gray-400">{agency.email || 'contact@amineauto.dz'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary mt-1">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1">Adresse</h3>
                      <p className="text-gray-400">{agency.address || 'Boumerdes, Algérie'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map/Location Section */}
              <div className="bg-surface rounded-3xl border border-border overflow-hidden h-[240px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d204634.3662103357!2d3.1269850157993884!3d36.736681328359836!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x128e5d0073e20e89%3A0xd76a9825d87b2cdd!2sAmine%20auto%2035!5e0!3m2!1sen!2sdz!4v1777734505345!5m2!1sen!2sdz"
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localisation Amine Auto"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer lang={lang} agency={agency as any} />
    </div>
  );
}
