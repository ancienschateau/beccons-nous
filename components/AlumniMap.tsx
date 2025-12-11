
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Alumni } from '../types';
import { MARKER_COLORS, DEFAULT_CENTER } from '../constants';

interface AlumniMapProps {
  alumni: Alumni[];
}

const AlumniMap: React.FC<AlumniMapProps> = ({ alumni }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (mapContainer.current && !mapInstance.current) {
      mapInstance.current = L.map(mapContainer.current, {
        zoomControl: false // Spostiamo i controlli se necessario, o li lasciamo default
      }).setView(
        [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 
        4
      );
      
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstance.current);

      markersRef.current = L.layerGroup().addTo(mapInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapInstance.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    // Create a custom icon function
    const createIcon = (initials: string, color: string) => {
      return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; box-shadow: 0 3px 6px rgba(0,0,0,0.3);">${initials}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });
    };

    const group = L.featureGroup();

    alumni.forEach((person, index) => {
      if (!person.coordinates) return;

      const initials = `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`;
      const color = MARKER_COLORS[index % MARKER_COLORS.length];
      
      const marker = L.marker([person.coordinates.lat, person.coordinates.lng], {
        icon: createIcon(initials, color)
      });

      const safeName = `${person.firstName} ${person.lastName.charAt(0)}.`;
      
      marker.bindPopup(`
        <div class="text-center p-3 font-sans">
          <p class="font-bold text-lg text-slate-800 mb-1">${safeName}</p>
          <div class="flex items-center justify-center text-slate-500 text-sm italic gap-1">
             <span>📍</span> ${person.city}
          </div>
        </div>
      `, {
        closeButton: false,
        className: 'custom-popup'
      });

      if (markersRef.current) {
        markersRef.current.addLayer(marker);
        group.addLayer(marker);
      }
    });

    // Auto-fit bounds if we have alumni, otherwise keep default view
    if (alumni.length > 0 && mapInstance.current) {
      try {
        mapInstance.current.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 10 });
      } catch (e) {
        // Fallback if bounds are invalid (e.g. 1 point)
        // mapInstance.current.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 4);
      }
    }

  }, [alumni]);

  return <div ref={mapContainer} className="w-full h-full z-0" />;
};

export default AlumniMap;
