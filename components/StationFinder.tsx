
import React, { useState } from 'react';
import { MapPin, ExternalLink, Navigation2, Loader2, Star, Map, List } from 'lucide-react';
import { findNearbyStations } from '../services/geminiService';
import { StationResponse } from '../types';

const StationFinder: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const handleFindStations = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await findNearbyStations(position.coords.latitude, position.coords.longitude);
          setData(result);
        } catch (err) {
          setError("Failed to fetch station data.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        setError("Unable to retrieve your location. Please allow location access.");
      }
    );
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 flex-shrink-0 gap-3 sm:gap-0">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <MapPin className="w-6 h-6 mr-2 text-emerald-400" />
          Nearby Stations
        </h2>
        
        <div className="flex gap-2 self-end sm:self-auto">
          <button
            onClick={() => setViewMode(prev => prev === 'list' ? 'map' : 'list')}
            className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors border border-slate-600 flex items-center justify-center"
            title={viewMode === 'list' ? "Switch to Map View" : "Switch to List View"}
          >
            {viewMode === 'list' ? <Map className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </button>

          <button
            onClick={handleFindStations}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              loading 
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
            }`}
          >
            {loading ? <span className="flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Scanning...</span> : "Find Nearest"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 relative">
        {!data && !loading && !error && (
          <div className="text-center text-slate-500 py-10 flex flex-col items-center h-full justify-center">
            <Navigation2 className="w-12 h-12 mb-3 opacity-20" />
            <p>Click "Find Nearest" to locate chargers around you.</p>
          </div>
        )}

        {data && (
          <div className="h-full">
             {viewMode === 'list' ? (
                 data.stations.length > 0 ? (
                    <div className="grid gap-3">
                      {data.stations.map((station, idx) => (
                        <div key={idx} className="bg-slate-700/50 p-4 rounded-xl border border-slate-600 hover:border-emerald-500/50 transition-all group">
                          <div className="flex justify-between items-start mb-2">
                             <h4 className="font-semibold text-white text-lg line-clamp-1" title={station.name}>{station.name}</h4>
                             {station.openNow !== undefined && (
                                 <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ml-2 ${station.openNow ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                     {station.openNow ? 'Open' : 'Closed'}
                                 </span>
                             )}
                          </div>
                          
                          <div className="flex items-start text-slate-400 text-sm mb-3">
                            <Map className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-slate-500" />
                            <span className="line-clamp-2">{station.address}</span>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-600/50">
                            <div className="flex items-center space-x-4">
                                {station.rating ? (
                                    <div className="flex items-center text-yellow-400" title="User Rating">
                                        <Star className="w-4 h-4 fill-current mr-1" />
                                        <span className="font-bold text-slate-200">{station.rating}</span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-500">No ratings</span>
                                )}
                            </div>
                            
                            {station.uri && (
                              <a 
                                href={station.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg hover:bg-blue-500/20"
                              >
                                Directions <ExternalLink className="w-3 h-3 ml-1.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                 ) : (
                     <div className="p-4 text-slate-400 text-center">
                         No specific stations parsed from the results.
                         <p className="text-xs mt-4 text-slate-500 border-t border-slate-700 pt-2 text-left">{data.text}</p>
                     </div>
                 )
             ) : (
                <div className="h-full min-h-[300px] bg-slate-900/50 rounded-xl border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Map Placeholder Background */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                         <div className="w-full h-full" style={{ 
                             backgroundImage: 'linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)',
                             backgroundSize: '40px 40px'
                         }}></div>
                    </div>
                    
                    <div className="z-10 flex flex-col items-center text-center p-6">
                        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center mb-4 shadow-lg">
                             <Map className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Interactive Map Unavailable</h3>
                        <p className="text-sm text-slate-400 max-w-xs">
                            Full map visualization requires a Maps API key. Use the list view to navigate to stations.
                        </p>
                    </div>

                    {/* Animated Fake Pins */}
                    <div className="absolute top-1/4 left-1/4 text-emerald-500/70 animate-bounce duration-1000 delay-0">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div className="absolute bottom-1/3 right-1/3 text-emerald-500/70 animate-bounce duration-[2000ms] delay-500">
                         <MapPin className="w-6 h-6" />
                    </div>
                     <div className="absolute top-1/2 right-1/4 text-emerald-500/70 animate-bounce duration-[1500ms] delay-300">
                         <MapPin className="w-6 h-6" />
                    </div>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StationFinder;
