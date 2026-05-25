'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import VehicleCard from '@/components/VehicleCard/VehicleCard';
import { useParams } from 'next/navigation';
import fr from '@/dictionaries/fr.json';
import ar from '@/dictionaries/ar.json';
import styles from './inventaire.module.css';

const bodyTypes = ['Tous', 'Berline', 'SUV', 'Coupé', 'Citadine', 'Cabriolet'];
const fuelTypes = ['Tous', 'Essence', 'Diesel', 'Hybride', 'Électrique'];
const driveTypes = ['Tous', 'FWD', 'RWD', 'AWD', '4WD'];

export default function InventairePage() {
  const params = useParams();
  const lang = params?.lang || 'fr';
  const dict = lang === 'ar' ? ar : fr;

  const sortOptions = [
    { value: 'newest', label: dict.inventory.sortNewest },
    { value: 'price-asc', label: dict.inventory.sortPriceAsc },
    { value: 'price-desc', label: dict.inventory.sortPriceDesc },
    { value: 'year-desc', label: dict.inventory.sortYearDesc },
    { value: 'mileage-asc', label: dict.inventory.sortMileageAsc },
  ];
  const searchParams = useSearchParams();
  const typeFromUrl = searchParams.get('type');
  const conditionFromUrl = searchParams.get('condition');
  const availabilityFromUrl = searchParams.get('availability');
  const makeFromUrl = searchParams.get('make');
  const modelFromUrl = searchParams.get('model');
  const yearFromUrl = searchParams.get('year');

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [make, setMake] = useState(makeFromUrl || '');
  const [model, setModel] = useState(modelFromUrl || '');
  const [year, setYear] = useState(yearFromUrl || '');
  const [activeType, setActiveType] = useState(typeFromUrl || 'Tous');
  const [fuel, setFuel] = useState('Tous');
  const [drive, setDrive] = useState('Tous');
  const [availability, setAvailability] = useState(availabilityFromUrl || 'Disponible');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Map condition URL string (e.g. 'Neuf') to our tab states ('new', 'used', 'all')
  const initialCondition = conditionFromUrl === 'Neuf' ? 'new' : (conditionFromUrl === 'Occasion' ? 'used' : 'all');
  const [conditionTab, setConditionTab] = useState(initialCondition);
  const [sortBy, setSortBy] = useState('newest');
  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchVehicles() {
      setLoading(true);
      const { data } = await supabase.from('vehicles').select('*');
      if (data) setVehicles(data);
      setLoading(false);
    }
    fetchVehicles();
  }, []);

  useEffect(() => {
    setActiveType(typeFromUrl || 'Tous');
    setAvailability(availabilityFromUrl || 'Disponible');
    setConditionTab(conditionFromUrl === 'Neuf' ? 'new' : (conditionFromUrl === 'Occasion' ? 'used' : 'all'));
    setMake(makeFromUrl || '');
    setModel(modelFromUrl || '');
    setYear(yearFromUrl || '');

    // If URL is completely clean, reset all secondary filters to default as well
    if (!typeFromUrl && !availabilityFromUrl && !conditionFromUrl && !makeFromUrl && !modelFromUrl && !yearFromUrl) {
      setFuel('Tous');
      setDrive('Tous');
      setMinPrice('');
      setMaxPrice('');
      setKeyword('');
    }
  }, [typeFromUrl, availabilityFromUrl, conditionFromUrl, makeFromUrl, modelFromUrl, yearFromUrl]);

  // Derived unique makes
  const uniqueMakes = useMemo(() => [...new Set(vehicles.map(v => v.make))].sort(), [vehicles]);

  // Pre-condition filtered (for dynamic tab counts)
  const dynamicPreConditionVehicles = useMemo(() => {
    let filtered = [...vehicles];

    if (activeType !== 'Tous') filtered = filtered.filter(v => v.bodyType === activeType);
    if (fuel !== 'Tous') filtered = filtered.filter(v => v.fuel === fuel);
    if (drive !== 'Tous') filtered = filtered.filter(v => v.driveType === drive);
    if (availability !== 'Tous') filtered = filtered.filter(v => v.availability === availability);
    if (make) filtered = filtered.filter(v => v.make === make);
    if (model) filtered = filtered.filter(v => v.model === model);
    if (year) filtered = filtered.filter(v => v.year >= Number(year));
    if (minPrice) filtered = filtered.filter(v => v.price >= Number(minPrice));
    if (maxPrice) filtered = filtered.filter(v => v.price <= Number(maxPrice));
    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = filtered.filter(v =>
        `${v.make} ${v.model} ${v.trim || ''}`.toLowerCase().includes(kw)
      );
    }
    return filtered;
  }, [vehicles, activeType, fuel, drive, availability, make, model, year, minPrice, maxPrice, keyword]);

  // Filtered & sorted
  const results = useMemo(() => {
    let filtered = [...dynamicPreConditionVehicles];

    if (conditionTab === 'new') filtered = filtered.filter(v => v.condition === 'Neuf');
    if (conditionTab === 'used') filtered = filtered.filter(v => v.condition === 'Occasion');

    switch (sortBy) {
      case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
      case 'year-desc': filtered.sort((a, b) => b.year - a.year); break;
      case 'mileage-asc': filtered.sort((a, b) => a.mileage - b.mileage); break;
      default: filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return filtered;
  }, [dynamicPreConditionVehicles, conditionTab, sortBy]);

  const countAll = dynamicPreConditionVehicles.length;
  const countNew = dynamicPreConditionVehicles.filter(v => v.condition === 'Neuf').length;
  const countUsed = dynamicPreConditionVehicles.filter(v => v.condition === 'Occasion').length;

  const clearFilters = () => {
    setMake(''); setModel(''); setYear(''); setActiveType('Tous'); setFuel('Tous'); setDrive('Tous'); setAvailability('Tous');
    setMinPrice(''); setMaxPrice(''); setKeyword('');
  };

  return (
    <main className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <h1>{dict.inventory.heroTitle}</h1>
        <p>{dict.inventory.heroSubtitle}</p>
      </section>

      <div className={`container ${styles.body}`}>
        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.filterRow}>
            <select value={make} onChange={e => setMake(e.target.value)} className={styles.filterSelect}>
              <option value="">{dict.inventory.filterAllMakes}</option>
              {uniqueMakes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={activeType} onChange={e => setActiveType(e.target.value)} className={styles.filterSelect}>
              {bodyTypes.map(t => <option key={t} value={t}>{t === 'Tous' ? dict.inventory.filterBodyType : t}</option>)}
            </select>
            <select value={fuel} onChange={e => setFuel(e.target.value)} className={styles.filterSelect}>
              {fuelTypes.map(f => <option key={f} value={f}>{f === 'Tous' ? dict.inventory.filterFuel : f}</option>)}
            </select>
            <select value={availability} onChange={e => setAvailability(e.target.value)} className={styles.filterSelect}>
              <option value="Tous">{dict.inventory.filterAvailAll}</option>
              <option value="Disponible">{dict.inventory.filterAvailNow}</option>
            </select>
            <button className={styles.moreFiltersBtn} onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? dict.inventory.filterLess : dict.inventory.filterMore}
            </button>
          </div>

          {showFilters && (
            <div className={styles.filterRow}>
              <select value={drive} onChange={e => setDrive(e.target.value)} className={styles.filterSelect}>
                {driveTypes.map(d => <option key={d} value={d}>{d === 'Tous' ? dict.inventory.filterDrive : d}</option>)}
              </select>
              <input type="number" placeholder={dict.inventory.filterPriceMin} value={minPrice} onChange={e => setMinPrice(e.target.value)} className={styles.filterInput} />
              <input type="number" placeholder={dict.inventory.filterPriceMax} value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className={styles.filterInput} />
              <button className={styles.clearBtn} onClick={clearFilters}>{dict.inventory.filterClear}</button>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.conditionTabs}>
            <button className={`${styles.condTab} ${conditionTab === 'all' ? styles.condTabActive : ''}`} onClick={() => setConditionTab('all')}>
              {dict.inventory.tabAll} ({countAll})
            </button>
            <button className={`${styles.condTab} ${conditionTab === 'new' ? styles.condTabActive : ''}`} onClick={() => setConditionTab('new')}>
              {dict.inventory.tabNew} ({countNew})
            </button>
            <button className={`${styles.condTab} ${conditionTab === 'used' ? styles.condTabActive : ''}`} onClick={() => setConditionTab('used')}>
              {dict.inventory.tabUsed} ({countUsed})
            </button>
          </div>
          <div className={styles.toolbarRight}>
            <div className={styles.searchBox}>
              <input type="text" placeholder={dict.inventory.searchPlaceholder} value={keyword} onChange={e => setKeyword(e.target.value)} className={styles.keywordInput} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.searchIcon}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div className={styles.sortWrap}>
              <span>{dict.inventory.sortLabel}</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={styles.sortSelect}>
                {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <p className={styles.resultCount}><strong>{results.length}</strong> {results.length !== 1 ? dict.inventory.resultsCountPlural : dict.inventory.resultsCount}</p>

        {/* Unified Grid */}
        {loading ? (
          <div className={styles.grid}>
            {[...Array(6)].map((_, i) => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : results.length === 0 ? (
          <div className={styles.empty}>
            <h3>{dict.inventory.emptyTitle}</h3>
            <p>{dict.inventory.emptyDesc}</p>
            <button onClick={clearFilters} className="btn-primary" style={{ marginTop: '16px' }}>{dict.inventory.btnEmptyClear}</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {results.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
