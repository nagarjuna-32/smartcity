import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin, School, HeartPulse, ShoppingBasket, Pill, Mail, Home, ArrowRight, Loader2, Building2 } from 'lucide-react';
import { api } from '../../services/api';
import { SearchResult } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query);
        setResults(res.results || []);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    onClose();
    navigate(url);
  };

  const getResultIcon = (r: SearchResult) => {
    if (r.type === 'area') return <MapPin className="w-4 h-4 text-brand-cyan" />;
    const cat = (r.category_id || r.category || '').toLowerCase();
    if (cat.includes('school') || cat.includes('education')) return <School className="w-4 h-4 text-blue-500" />;
    if (cat.includes('hospital') || cat.includes('health')) return <HeartPulse className="w-4 h-4 text-red-500" />;
    if (cat.includes('provision') || cat.includes('grocery')) return <ShoppingBasket className="w-4 h-4 text-amber-500" />;
    if (cat.includes('medical') || cat.includes('pharma')) return <Pill className="w-4 h-4 text-emerald-500" />;
    if (cat.includes('post')) return <Mail className="w-4 h-4 text-orange-500" />;
    if (cat.includes('layout') || cat.includes('site') || cat.includes('land')) return <Home className="w-4 h-4 text-purple-500" />;
    return <Building2 className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-20 px-4 bg-navy-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/70">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-none"
            placeholder="Search Tumkur localities (SS Puram, Batawadi), hospitals, schools, pharmacies, shops..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') onClose();
            }}
          />
          {loading && <Loader2 className="w-4 h-4 text-brand-teal animate-spin mr-2 shrink-0" />}
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 rounded">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded text-slate-600 font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 divide-y divide-slate-100 flex-1">
          {results.length > 0 ? (
            results.map(r => (
              <div
                key={`${r.type}-${r.id}`}
                onClick={() => handleSelect(r.url)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100/80 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                    {getResultIcon(r)}
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-900 text-sm group-hover:text-brand-teal transition-colors">
                      {r.title}
                    </h5>
                    <p className="text-xs text-slate-500">{r.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                    {r.type}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-teal group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          ) : query.length >= 2 && !loading ? (
            <div className="text-center py-12 text-slate-400">
              <MapPin className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
              <p className="text-sm font-medium">No results found for "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for SS Puram, SIT, Batawadi, Mandipet, Apollo, or District Hospital.</p>
            </div>
          ) : (
            <div className="py-8 px-4 text-xs text-slate-500">
              <span className="font-bold text-slate-700 block mb-3 uppercase tracking-wider text-[11px]">Quick Suggestions</span>
              <div className="flex flex-wrap gap-2">
                {['SS Puram', 'Batawadi', 'SIT Extension', 'District Hospital', 'Apollo Pharmacy', 'More Supermarket', 'Mandipet', 'TUDA Layout'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-brand-teal text-slate-700 border border-slate-200 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Area-wise spatial search across Tumkur City localities & facilities</span>
          <span className="font-mono">OpenStreetMap & Verified Municipal Data</span>
        </div>
      </div>
    </div>
  );
};
