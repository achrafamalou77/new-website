// src/components/website/SearchBar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, Users, MapPin, Search, Clock, Flame, Sparkles } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  agency: any;
  trips?: any[];
}

export function SearchBar({ onSearch, agency, trips = [] }: SearchBarProps) {
  const [dest, setDest] = useState('');
  const [when, setWhen] = useState('');
  const [travellers, setTravellers] = useState('');
  
  // Autocomplete & History States
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract all distinct trip destinations/countries
  const allDestinations = Array.from(
    new Set(
      trips
        .map(t => t.destination || t.destination_country)
        .filter(Boolean)
    )
  ) as string[];

  // Load recent searches on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('agency_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Handle clicking outside suggestions dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Update suggestions list
  useEffect(() => {
    if (!dest.trim()) {
      setSuggestions([]);
      return;
    }
    const query = dest.toLowerCase();
    const filtered = allDestinations.filter(d => d.toLowerCase().includes(query));
    setSuggestions(filtered);
  }, [dest]);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter(t => t !== term)].slice(0, 4);
    setRecentSearches(updated);
    try {
      localStorage.setItem('agency_recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const executeSearch = (term: string) => {
    const cleanTerm = term.trim();
    saveRecentSearch(cleanTerm);
    onSearch(cleanTerm);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(dest);
  };

  const popularDestinations = ["Turquie", "Tunisie", "Dubaï", "Omra"];

  return (
    <section className="relative z-30 -mt-20 px-4">
      <div 
        ref={dropdownRef}
        className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-4 sm:p-5 border border-slate-200/60"
      >
        <form
          onSubmit={handleSubmit}
          className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center"
        >
          {/* Autocomplete Where to */}
          <div className="flex-1 relative flex items-center gap-3 border border-slate-200/80 rounded-2xl px-4 py-3 bg-slate-50/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/10 transition">
            <MapPin className="h-5 w-5 text-indigo-500 shrink-0" />
            <div className="flex-1 text-left">
              <input
                type="text"
                placeholder="Où voulez-vous aller ? (Turquie, Tunisie...)"
                value={dest}
                onChange={(e) => {
                  setDest(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full outline-none text-xs font-bold text-slate-800 bg-transparent placeholder-slate-400"
              />
            </div>

            {/* Suggestions dropdown dropdown list */}
            {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-2 text-left animate-fadeIn">
                {/* Autocomplete items */}
                {suggestions.length > 0 && (
                  <div className="px-3 py-1 text-[9px] font-black text-slate-400 uppercase tracking-wider">Destinations correspondantes</div>
                )}
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setDest(sug);
                      executeSearch(sug);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-650 flex items-center gap-2"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{sug}</span>
                  </button>
                ))}

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <>
                    <div className="h-px bg-slate-100 my-1.5" />
                    <div className="px-3 py-1 text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Recherches Récentes
                    </div>
                    {recentSearches.map((rec, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setDest(rec);
                          executeSearch(rec);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-indigo-50 flex items-center gap-2"
                      >
                        <span>{rec}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* When */}
          <div className="flex-1 flex items-center gap-3 border border-slate-200/80 rounded-2xl px-4 py-3 bg-slate-50/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/10 transition">
            <Calendar className="h-5 w-5 text-indigo-500 shrink-0" />
            <div className="flex-1 text-left">
              <input
                type="text"
                placeholder="Dates de départ"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="w-full outline-none text-xs font-bold text-slate-800 bg-transparent placeholder-slate-400"
              />
            </div>
          </div>

          {/* Travelers count */}
          <div className="flex-1 flex items-center gap-3 border border-slate-200/80 rounded-2xl px-4 py-3 bg-slate-50/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/10 transition">
            <Users className="h-5 w-5 text-indigo-500 shrink-0" />
            <div className="flex-1 text-left">
              <input
                type="text"
                placeholder="Nombre de voyageurs"
                value={travellers}
                onChange={(e) => setTravellers(e.target.value)}
                className="w-full outline-none text-xs font-bold text-slate-800 bg-transparent placeholder-slate-400"
              />
            </div>
          </div>

          {/* Submit Search button */}
          <button
            type="submit"
            className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition text-white px-8 py-3.5 rounded-2xl font-black text-xs whitespace-nowrap shadow-md shadow-indigo-600/10"
          >
            <Search className="h-4 w-4 mr-1.5" />
            Rechercher
          </button>
        </form>

        {/* Popular Tags List under search bars */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center gap-2 select-none">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 mr-1">
            <Flame className="h-4.5 w-4.5 text-amber-500 animate-pulse fill-amber-500" />
            Destinations populaires:
          </span>
          {popularDestinations.map((pop, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setDest(pop);
                executeSearch(pop);
              }}
              className="px-3 py-1 bg-slate-50 hover:bg-indigo-50 text-[10px] font-bold rounded-full text-slate-600 hover:text-indigo-650 border border-slate-200/60 transition"
            >
              {pop}
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
