

// The Backend Script URL (Google Apps Script)
// Linked to Sheet ID: 1nEveHzocijuhMt1tK_IIxkilSj7fnqHUSrbz4zFZcoQ
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyBzKZblgvbYAGtGiRAD6uGnZFI0lZ6OFGhG5xsjIaSiwW1eGAkHhgsyDayviZk9Z65/exec';

export const DEFAULT_CENTER = {
  lat: 41.9028, // Rome
  lng: 12.4964
};

// Radius for randomizing location (in degrees, approx 2-3km)
export const PRIVACY_JITTER = 0.025; 

export const MARKER_COLORS = [
  '#003399', // Blue Chateaubriand
  '#CC0000', // Red Chateaubriand
  '#059669', // Emerald
  '#D97706', // Amber
  '#7C3AED', // Violet
];