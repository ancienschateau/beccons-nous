
import { Alumni } from '../types';
import { GOOGLE_SCRIPT_URL } from '../constants';

/**
 * Invia i dati al Backend Google Apps Script (doPost)
 */
export const addAlumniToSheet = async (alumni: Alumni): Promise<boolean> => {
  if (!GOOGLE_SCRIPT_URL) return false;

  const payload = {
    firstName: alumni.firstName,
    lastName: alumni.lastName,
    city: alumni.city,
    lat: Number(alumni.coordinates?.lat),
    lng: Number(alumni.coordinates?.lng)
  };

  try {
    // Inviamo i dati come stringa pura nel body.
    // NON settiamo 'Content-Type': 'application/json' perché triggera una richiesta OPTIONS (preflight)
    // che Google Apps Script spesso rifiuta. Apps Script leggerà comunque il body come stringa.
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify(payload)
    });
    
    // Con no-cors non possiamo leggere la risposta, ma se non c'è errore di rete, è andata.
    return true; 
  } catch (error) {
    console.error("Errore salvataggio:", error);
    return false;
  }
};

/**
 * Scarica i dati dal Backend Google Apps Script (doGet)
 * Si aspetta un JSON array formattato dallo script.
 */
export const fetchAlumniData = async (): Promise<Alumni[]> => {
  try {
    // Aggiungi un parametro timestamp per forzare il refresh ed evitare cache del browser
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?t=${Date.now()}`);
    
    if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
    }

    const rawData = await response.json();
    
    // Validazione basica della risposta
    if (!Array.isArray(rawData)) {
        console.warn("Il server non ha restituito un array:", rawData);
        return [];
    }

    // Mappa la risposta JSON dello script nel tipo Alumni dell'app
    return rawData.map((item: any) => {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lng);
      // Consideriamo valide le coordinate solo se sono numeri validi
      const hasCoords = !isNaN(lat) && !isNaN(lng);

      return {
        id: item.timestamp || Math.random().toString(36), // Usa timestamp come ID se c'è
        firstName: item.firstName,
        lastName: item.lastName,
        city: item.city,
        // Se non ci sono coordinate valide, lasciamo undefined così l'App può calcolarle dopo
        coordinates: hasCoords ? { lat, lng } : undefined,
        timestamp: item.timestamp
      };
    }).filter(a => 
      // Teniamo l'utente se ha almeno Nome e Città. 
      // NON filtriamo più in base alle coordinate mancanti.
      a.firstName && a.city 
    );

  } catch (error) {
    console.error("Errore recupero dati:", error);
    return [];
  }
};
