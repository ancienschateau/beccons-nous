
import React, { useState } from 'react';
import { getCityCoordinates, generateWelcomeMessage } from '../services/geminiService';
import { addAlumniToSheet } from '../services/sheetService';
import { Alumni, Coordinates } from '../types';
import { Loader2, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { PRIVACY_JITTER } from '../constants';

interface AddProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (alumni: Alumni) => void;
}

const AddProfileModal: React.FC<AddProfileModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [statusStep, setStatusStep] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Trova le coordinate della città con Gemini
      setStatusStep("Recherche de la ville...");
      const coords = await getCityCoordinates(city);

      if (!coords) {
        setError("Impossible de trouver cette ville. Essayez 'Ville, Pays'.");
        setIsSubmitting(false);
        return;
      }

      // 2. Aggiungi il 'jitter' per la privacy (sposta il punto randomicamente attorno al centro)
      const privateCoords: Coordinates = {
        lat: coords.lat + (Math.random() - 0.5) * PRIVACY_JITTER,
        lng: coords.lng + (Math.random() - 0.5) * PRIVACY_JITTER
      };

      // 3. Crea l'oggetto Alumni
      const newAlumni: Alumni = {
        id: Date.now().toString(),
        firstName,
        lastName,
        city,
        coordinates: privateCoords,
        timestamp: new Date().toISOString()
      };

      // 4. Invia al Google Sheet tramite Script
      setStatusStep("Enregistrement en cours...");
      const saved = await addAlumniToSheet(newAlumni);

      if (!saved) {
        throw new Error("Impossible de contacter le serveur.");
      }
      
      // 5. Genera messaggio di benvenuto simpatico
      setStatusStep("Génération du message d'accueil...");
      const welcome = await generateWelcomeMessage(city, firstName);

      // 6. Aggiorna la UI locale e chiudi
      onAdd(newAlumni);
      setSuccessMsg(welcome);
      
      setTimeout(() => {
        resetForm();
        onClose();
      }, 3500);

    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'enregistrement. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setCity('');
    setSuccessMsg(null);
    setStatusStep('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-6 text-white text-center">
          <h2 className="text-2xl font-bold font-serif">Beccons-Nous !</h2>
          <p className="text-blue-100 text-sm mt-1">Entrez vos coordonnées</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {successMsg ? (
             <div className="flex flex-col items-center justify-center space-y-4 py-6">
               <div className="h-16 w-16 rounded-full flex items-center justify-center bg-green-100">
                 <CheckCircle className="h-10 w-10 text-green-600" />
               </div>
               <p className="text-center text-lg font-medium text-gray-800">
                 Inscription terminée !
               </p>
               <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 w-full">
                 <p className="text-center text-blue-800 italic font-serif">"{successMsg}"</p>
               </div>
               <p className="text-xs text-gray-400">Vos données ont été enregistrées sur le Google Sheet.</p>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input 
                    type="text" 
                    required 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Prénom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input 
                    type="text" 
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Nom"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville actuelle
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input 
                    type="text" 
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex. Rome, Paris..."
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Votre position sera légèrement floutée pour des raisons de confidentialité.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full mt-2 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg shadow-md flex items-center justify-center transition-colors disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    {statusStep}
                  </>
                ) : "Confirmer ma position"}
              </button>
            </form>
          )}
        </div>
        
        {!successMsg && (
          <div className="bg-gray-50 px-6 py-3 flex justify-end">
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddProfileModal;