'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import VehicleCard from '@/components/website/templates/auto-am/components/VehicleCard/VehicleCard';

interface VehicleDetailClientProps {
  vehicle: any;
  similarCars: any[];
  agency: any;
  basePath: string;
}

export default function VehicleDetailClient({ vehicle, similarCars, agency, basePath }: VehicleDetailClientProps) {
  const images = vehicle.images || [vehicle.cover_image_url || '/images/cars/placeholder.jpg'];
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const handlePrev = () => {
    setActiveImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2000);
  };

  const cleanPhone = (phone: string) => {
    return phone.replace(/\D/g, '').replace(/^0/, '213');
  };

  const getWhatsAppLink = (text: string) => {
    return `https://wa.me/${cleanPhone(agency.phone)}?text=${encodeURIComponent(text)}`;
  };

  const specs = [
    { label: 'Année', value: vehicle.year || 'N/A' },
    { label: 'Carburant', value: vehicle.fuel_type || vehicle.fuel || 'N/A' },
    { label: 'Transmission', value: vehicle.transmission || 'N/A' },
    { label: 'Kilométrage', value: vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A' },
    { label: 'Couleur', value: vehicle.color_exterior || 'N/A' },
    { label: 'Cylindrée', value: vehicle.engine_size || 'N/A' },
    { label: 'Puissance', value: vehicle.horsepower ? `${vehicle.horsepower} ch` : 'N/A' },
    { label: 'Portes', value: vehicle.doors || 'N/A' },
  ];

  return (
    <div className="text-white max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8 font-medium">
        <Link href={basePath || '/'} className="hover:text-primary transition-colors">Accueil</Link>
        <span>&gt;</span>
        <Link href={`${basePath}/stock`} className="hover:text-primary transition-colors">En Stock</Link>
        <span>&gt;</span>
        <span className="text-gray-200 truncate max-w-[200px]">{vehicle.brand || vehicle.make} {vehicle.model}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* A. Image Gallery */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden bg-black/40 border border-border group">
            <Image
              src={images[activeImageIdx]}
              alt={`${vehicle.brand || vehicle.make} ${vehicle.model}`}
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
            
            {/* Left/Right Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 backdrop-blur rounded-full text-white hover:bg-primary hover:text-dark transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  &lt;
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 backdrop-blur rounded-full text-white hover:bg-primary hover:text-dark transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  &gt;
                </button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 right-4 px-4 py-1.5 bg-black/70 backdrop-blur rounded-full text-sm font-semibold">
              {activeImageIdx + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnail row */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-2 scrollbar-none">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                    activeImageIdx === idx ? 'border-primary scale-95' : 'border-transparent hover:border-white/20'
                  }`}
                >
                  <Image src={img} alt="Thumbnail" fill style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info & Side Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface p-8 rounded-3xl border border-border space-y-6">
            {/* B. Car Header */}
            <div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary">
                  {vehicle.condition || 'Disponible'}
                </span>
                <span className="text-xs text-gray-500 font-mono">Stock: {vehicle.stock_number || 'N/A'}</span>
              </div>
              <h1 className="text-3xl font-display font-bold text-white tracking-tight leading-tight">
                {vehicle.brand || vehicle.make} {vehicle.model}
              </h1>
              <p className="text-gray-400 mt-1 font-semibold">{vehicle.year} · {vehicle.transmission}</p>
            </div>

            {/* Price */}
            <div>
              <p className="text-3xl font-display font-black text-primary">
                {vehicle.final_price ? vehicle.final_price.toLocaleString() : (vehicle.price || 0).toLocaleString()} DZD
              </p>
              {vehicle.final_price && vehicle.price > vehicle.final_price && (
                <p className="text-sm text-gray-500 line-through mt-0.5">
                  {(vehicle.price || 0).toLocaleString()} DZD
                </p>
              )}
            </div>

            {/* Warranty */}
            {(vehicle.warranty_months || vehicle.warranty_km) && (
              <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 font-bold">✓</div>
                <div>
                  <h4 className="text-sm font-bold text-white">Garantie Offerte</h4>
                  <p className="text-xs text-gray-400">
                    {vehicle.warranty_months ? `${vehicle.warranty_months} mois` : ''} 
                    {vehicle.warranty_months && vehicle.warranty_km ? ' / ' : ''}
                    {vehicle.warranty_km ? `${vehicle.warranty_km} km` : ''}
                  </p>
                </div>
              </div>
            )}

            {/* C. Quick Actions Bar */}
            <div className="space-y-3 pt-2">
              <a
                href={getWhatsAppLink(`Bonjour, je suis intéressé par la ${vehicle.brand || vehicle.make} ${vehicle.model} ${vehicle.year} (Prix: ${vehicle.final_price || vehicle.price} DZD)`)}
                className="w-full bg-[#25D366] hover:bg-[#20ba56] text-dark font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Discuter sur WhatsApp</span>
              </a>

              <a
                href={`tel:${agency.phone}`}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Appeler l'Agence</span>
              </a>

              <button
                onClick={handleShare}
                className="w-full bg-transparent hover:bg-white/5 border border-white/5 text-gray-300 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>{shareSuccess ? 'Copié !' : 'Partager la Fiche'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* D. Specifications Grid */}
      <div className="mt-12 bg-surface p-8 rounded-3xl border border-border">
        <h2 className="text-2xl font-display font-bold text-white mb-6">Fiche Technique</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {specs.map((spec, idx) => (
            <div key={idx} className="p-4 bg-black/20 rounded-2xl border border-border/50">
              <span className="text-xs text-gray-500 font-semibold block mb-1">{spec.label}</span>
              <span className="text-base font-bold text-white block">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* E. Features List */}
      {vehicle.features && vehicle.features.length > 0 && (
        <div className="mt-10 bg-surface p-8 rounded-3xl border border-border">
          <h2 className="text-2xl font-display font-bold text-white mb-6">Équipements & Options</h2>
          <div className="flex flex-wrap gap-3">
            {vehicle.features.map((feature: string, idx: number) => (
              <span
                key={idx}
                className="px-4 py-2 bg-black/20 border border-border/50 rounded-xl text-sm font-semibold text-gray-300 flex items-center gap-2"
              >
                <span className="text-primary font-bold">✓</span> {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* F. Description */}
      {vehicle.description && (
        <div className="mt-10 bg-surface p-8 rounded-3xl border border-border">
          <h2 className="text-2xl font-display font-bold text-white mb-4">Description</h2>
          <p className={`text-gray-400 leading-relaxed ${descExpanded ? '' : 'line-clamp-4'}`}>
            {vehicle.description}
          </p>
          {vehicle.description.length > 300 && (
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              className="text-primary font-bold mt-4 hover:underline cursor-pointer"
            >
              {descExpanded ? 'Voir moins' : 'Lire la suite'}
            </button>
          )}
        </div>
      )}

      {/* H. Similar Cars */}
      {similarCars.length > 0 && (
        <div className="mt-16">
          <h2 className="text-3xl font-display font-bold text-white mb-8 text-center md:text-left">
            Vous pourriez aussi aimer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {similarCars.map((similarCar) => (
              <VehicleCard key={similarCar.id} vehicle={similarCar} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
