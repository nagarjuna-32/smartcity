import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { SavedLocation } from '../types';
import { Bookmark, MapPin, Building2, Trash2, ExternalLink, ArrowRight } from 'lucide-react';

export const SavedLocationsPage: React.FC = () => {
  const [saved, setSaved] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSavedLocations();
  }, []);

  const loadSavedLocations = async () => {
    try {
      setLoading(true);
      const res = await api.getSavedLocations();
      setSaved(res.saved || []);
    } catch (err) {
      console.error('Failed to load saved locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await api.removeSavedLocation(id);
      setSaved(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to remove saved location');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-brand-cyan text-xs font-bold uppercase tracking-wider mb-1">
          <Bookmark className="w-4 h-4" />
          <span>CITIZEN BOOKMARKS & SAVED INFRASTRUCTURE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Saved Locations
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Quickly access your pinned neighborhoods and bookmarked municipal facilities across Tumkur City.
        </p>
      </div>

      {/* Grid of Saved Items */}
      {saved.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map((item) => {
            const data: any = item.data;
            if (!data) return null;

            return (
              <div
                key={item.id}
                className="bg-navy-900 border border-navy-800 hover:border-brand-teal rounded-3xl p-5 shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-navy-800 text-brand-cyan uppercase">
                      {item.item_type === 'area' ? 'City Area' : (data.category_name || 'Facility')}
                    </span>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-base font-extrabold text-white">{data.name}</h3>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {item.notes || data.description || data.address || 'Saved Tumkur location.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-navy-800 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Saved on {new Date(item.created_at).toLocaleDateString()}
                  </span>

                  <Link
                    to={item.item_type === 'area' ? `/areas/${data.id}` : `/facilities?id=${data.id}`}
                    className="font-bold text-brand-cyan hover:underline flex items-center gap-1"
                  >
                    <span>Open &rarr;</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : !loading ? (
        <div className="bg-navy-900 border border-navy-800 rounded-3xl p-12 text-center text-slate-400">
          <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Saved Locations Yet</h3>
          <p className="text-xs max-w-sm mx-auto">
            You can bookmark any Tumkur locality or facility by clicking the "Save Area" button on its details page.
          </p>
        </div>
      ) : null}
    </div>
  );
};
