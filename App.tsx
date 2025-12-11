
import React, { useState, useEffect } from 'react';
import AlumniMap from './components/AlumniMap';
import AddProfileModal from './components/AddProfileModal';
import { fetchAlumniData } from './services/sheetService';
import { getCityCoordinates } from './services/geminiService';
import { Alumni, AppState, Coordinates } from './types';
import { Plus, Users, RefreshCw, Loader2 } from 'lucide-react';
import { PRIVACY_JITTER } from './constants';

const App: React.FC = () => {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Stato per tracciare il progresso del backfilling (es. "3 di 10 completati")
  const [backfillStatus, setBackfillStatus] = useState<{ current: number; total: number } | null>(null);

  // Funzione per riparare i dati mancanti (Backfilling)
  const backfillMissingCoordinates = async (data: Alumni[]) => {
    const missingCoords = data.filter(a => !a.coordinates && a.city);
    
    if (missingCoords.length === 0) return;

    console.log(`Trouvé ${missingCoords.length} alumni sans coordonnées. Localisation en cours...`);
    
    // Inizializza lo stato del loader
    let processedCount = 0;
    setBackfillStatus({ current: 0, total: missingCoords.length });

    // Processiamo uno alla volta per aggiornare la UI progressivamente
    for (const person of missingCoords) {
      try {
        // IMPORTANT: OpenStreetMap (Nominatim) richiede max 1 richiesta al secondo.
        // Aggiungiamo un delay artificiale per evitare il ban IP o errori 429.
        await new Promise(resolve => setTimeout(resolve, 1100));

        const coords = await getCityCoordinates(person.city);
        if (coords) {
          // Aggiungiamo il Jitter per la privacy anche qui
          const jitteredCoords: Coordinates = {
            lat: coords.lat + (Math.random() - 0.5) * PRIVACY_JITTER,
            lng: coords.lng + (Math.random() - 0.5) * PRIVACY_JITTER
          };

          setAlumni(prev => prev.map(p => {
             if (p.id === person.id) {
               return { ...p, coordinates: jitteredCoords };
             }
             return p;
          }));
        }
      } catch (err) {
        console.warn(`Impossible de localiser ${person.city} pour ${person.firstName}`);
      } finally {
        processedCount++;
        setBackfillStatus({ current: processedCount, total: missingCoords.length });
      }
    }

    // Nascondi il loader dopo un breve delay quando ha finito
    setTimeout(() => {
      setBackfillStatus(null);
    }, 1000);
  };

  const loadData = async () => {
    setAppState(AppState.LOADING);
    try {
      const data = await fetchAlumniData();
      setAlumni(data);
      setAppState(AppState.READY);
      
      // Avvia il processo di riempimento coordinate in background
      backfillMissingCoordinates(data);

    } catch (e) {
      console.error("Initialization failed", e);
      setAppState(AppState.ERROR);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddAlumni = (newAlumni: Alumni) => {
    // Aggiornamento ottimistico: aggiungiamo subito alla lista locale
    setAlumni(prev => [...prev, newAlumni]);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col bg-slate-50">
      
      {/* Navbar / Header */}
      <header className="absolute top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
           <img 
             src="https://i.ibb.co/YTXNGrGc/Logo-ADALC-HDDEF-1000x1000.png" 
             alt="Logo ADALC" 
             className="h-10 w-10 object-contain"
           />
           <div>
             <h1 className="text-xl font-bold text-slate-900 font-serif leading-none">Beccons-Nous !</h1>
             <p className="text-xs text-slate-500 font-medium">Anciens élèves du Lycée Chateaubriand</p>
           </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
            <Users className="h-4 w-4 mr-2" />
            <span className="font-semibold">{alumni.filter(a => a.coordinates).length}</span>
            <span className="ml-1">Visibles / {alumni.length} Total</span>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md transition-transform hover:scale-105 flex items-center"
          >
            <Plus className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">J'y suis aussi !</span>
            <span className="md:hidden">M'ajouter</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow relative z-0 mt-[64px]">
        
        {/* Loader Iniziale (Schermo intero) */}
        {appState === AppState.LOADING && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-30">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mb-4"></div>
            <p className="text-slate-600 font-medium animate-pulse">Recherche des anciens camarades...</p>
          </div>
        )}

        {/* Loader Backfilling (Floating Pill) - Appare mentre calcola le coordinate mancanti */}
        {appState === AppState.READY && backfillStatus && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
            <div className="bg-white/90 backdrop-blur border border-blue-100 shadow-lg rounded-full px-4 py-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-700">
                  Localisation en cours...
                </span>
                <span className="text-[10px] text-slate-500">
                  {backfillStatus.current} sur {backfillStatus.total} analysés
                </span>
              </div>
            </div>
          </div>
        )}

        {appState === AppState.ERROR && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-slate-50">
             <div className="text-center p-6 max-w-sm bg-white rounded-xl shadow-lg border border-red-100">
                <p className="text-red-600 font-bold text-lg mb-2">Quelque chose ne va pas</p>
                <p className="text-gray-600 mb-4">Impossible de contacter le registre des anciens.</p>
                <button 
                  onClick={loadData}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center mx-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Réessayer
                </button>
             </div>
          </div>
        )}
        
        <AlumniMap alumni={alumni} />
      </main>

      {/* Floating Info Panel (Mobile Only) */}
      <div className="md:hidden absolute bottom-6 left-4 right-4 z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur rounded-xl p-4 shadow-xl border border-gray-100 pointer-events-auto flex justify-center items-center">
           <div>
             <span className="text-sm text-gray-500 mr-2">Total Anciens :</span>
             <span className="text-xl font-bold text-blue-900">{alumni.length}</span>
           </div>
        </div>
      </div>

      <AddProfileModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddAlumni}
      />

    </div>
  );
};

export default App;
