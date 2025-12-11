import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carica le variabili d'ambiente basate sul modo corrente (es. development o production)
  // Il terzo parametro '' permette di caricare tutte le variabili, non solo quelle con prefisso VITE_
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Questo dice a Vite: "Ogni volta che trovi 'process.env.API_KEY' nel codice,
      // sostituiscilo con il valore della variabile d'ambiente VITE_API_KEY (o API_KEY)"
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY)
    }
  }
})