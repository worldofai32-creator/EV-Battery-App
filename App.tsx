
import React, { useState, useEffect, useCallback } from 'react';
import { Activity, History, Save, RotateCcw, PlayCircle, StopCircle, AlertTriangle, MapPin } from 'lucide-react';
import BatteryDisplay from './components/BatteryDisplay';
import StationFinder from './components/StationFinder';
import AnalyticsChart from './components/AnalyticsChart';
import { getEVEstimates } from './services/geminiService';
import { EVReading, EstimationResponse } from './types';

const App: React.FC = () => {
  // State
  const [batteryLevel, setBatteryLevel] = useState<number>(75);
  const [inputDate, setInputDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [inputTime, setInputTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  
  const [currentEstimates, setCurrentEstimates] = useState<EstimationResponse | null>(null);
  const [history, setHistory] = useState<EVReading[]>([]);
  const [loadingEstimates, setLoadingEstimates] = useState<boolean>(false);
  
  // Live Simulation State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Load History on Mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('ev_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save History when updated
  useEffect(() => {
    localStorage.setItem('ev_history', JSON.stringify(history));
  }, [history]);

  // Fetch Estimates Function
  const updateEstimates = useCallback(async (level: number, date: string, time: string) => {
    setLoadingEstimates(true);
    const combinedDateTime = `${date} ${time}`;
    const estimates = await getEVEstimates(level, combinedDateTime);
    setCurrentEstimates(estimates);
    setLoadingEstimates(false);
    return estimates;
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    updateEstimates(batteryLevel, inputDate, inputTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Manual Save with Geolocation
  const handleSaveReading = () => {
    if (!currentEstimates) return;

    const saveToHistory = (lat?: number, lng?: number) => {
      const newReading: EVReading = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        batteryPercentage: batteryLevel,
        estimatedRangeKm: currentEstimates.rangeKm,
        estimatedTimeHours: currentEstimates.timeLeftHours,
        notes: currentEstimates.efficiencyNote,
        latitude: lat,
        longitude: lng
      };
      setHistory(prev => [newReading, ...prev]);
    };
    
    // Attempt to get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          saveToHistory(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("Location access denied or unavailable:", error);
          saveToHistory(); // Save without location
        },
        { timeout: 5000 }
      );
    } else {
      saveToHistory();
    }
  };

  // Simulation Effect (Drain battery over time)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isSimulating) {
      interval = setInterval(() => {
        setBatteryLevel(prev => {
          if (prev <= 0) {
            setIsSimulating(false);
            return 0;
          }
          const newLevel = Math.max(0, prev - 1);
          // Trigger estimate update silently for the simulation effect
          getEVEstimates(newLevel, new Date().toLocaleTimeString()).then(est => setCurrentEstimates(est));
          return newLevel;
        });
      }, 3000); // Drain 1% every 3 seconds for demo speed
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  const handleClearHistory = () => {
    if(confirm("Clear all history?")) {
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
              VoltMind
            </h1>
            <p className="text-slate-400 text-sm">Intelligent EV Companion Dashboard</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <button 
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center px-4 py-2 rounded-full font-medium transition-all ${isSimulating ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'}`}
            >
              {isSimulating ? <StopCircle className="w-4 h-4 mr-2" /> : <PlayCircle className="w-4 h-4 mr-2" />}
              {isSimulating ? 'Stop Live Demo' : 'Simulate Drive'}
            </button>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Col: Input & Battery */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Manual Input Card */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-400" />
                Manual Input & Controls
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Battery %</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100"
                    value={batteryLevel}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setBatteryLevel(val);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Date</label>
                  <input 
                    type="date" 
                    value={inputDate}
                    onChange={(e) => setInputDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Time</label>
                  <input 
                    type="time" 
                    value={inputTime}
                    onChange={(e) => setInputTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end gap-3">
                <button 
                  onClick={() => updateEstimates(batteryLevel, inputDate, inputTime)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                >
                  Recalculate Estimates
                </button>
                <button 
                  onClick={handleSaveReading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm flex items-center shadow-lg shadow-blue-500/20 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Reading
                </button>
              </div>
            </div>

            {/* Battery Visualizer */}
            <BatteryDisplay 
              percentage={batteryLevel} 
              estimates={currentEstimates} 
              loading={loadingEstimates} 
            />
            
            {/* Analytics */}
            <AnalyticsChart history={history} />
          </div>

          {/* Right Col: Stations & History List */}
          <div className="space-y-6">
            
            {/* Station Finder (Gemini Maps Grounding) */}
            <StationFinder />

            {/* Recent History List */}
            <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700 max-h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <History className="w-5 h-5 mr-2 text-purple-400" />
                  Reading Log
                </h2>
                <button onClick={handleClearHistory} className="text-xs text-red-400 hover:text-red-300 flex items-center">
                  <RotateCcw className="w-3 h-3 mr-1" /> Reset
                </button>
              </div>

              <div className="overflow-y-auto custom-scrollbar flex-grow space-y-3 pr-2">
                {history.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 border border-dashed border-slate-700 rounded-lg">
                    No saved readings yet.
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 hover:border-purple-500/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-emerald-400 font-bold font-mono">{item.batteryPercentage}% Batt</span>
                        <span className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-slate-300">
                          <span className="block text-xs text-slate-500">Range</span>
                          {item.estimatedRangeKm.toFixed(1)} km
                        </div>
                        <div className="text-slate-300">
                          <span className="block text-xs text-slate-500">Time Left</span>
                          {item.estimatedTimeHours.toFixed(1)} hr
                        </div>
                        
                        {/* Location display if available */}
                        {item.latitude && item.longitude && (
                          <div className="col-span-2 mt-2 pt-2 border-t border-slate-700/50 flex items-center text-xs text-slate-400">
                            <MapPin className="w-3 h-3 mr-1.5 text-slate-500" />
                            <span>Lat: {item.latitude.toFixed(4)}, Lng: {item.longitude.toFixed(4)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Footer warning */}
        <div className="text-center pt-8 pb-4 text-slate-600 text-xs flex items-center justify-center">
          <AlertTriangle className="w-3 h-3 mr-2" />
          Estimates are generated by Gemini AI and are for simulation purposes only. Do not rely on this for critical safety.
        </div>
      </div>
    </div>
  );
};

export default App;
