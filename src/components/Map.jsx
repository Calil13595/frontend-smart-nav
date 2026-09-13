import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ============================================================================
// Ícones customizados UNAERP
// ============================================================================
const createIcon = (color, emoji = '📍') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        background: ${color};
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 3px solid #fff;
      ">
        <span style="transform: rotate(45deg); font-size: 18px;">${emoji}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -42],
  });
};

const startIcon = createIcon('#1a237e', '🟢');
const endIcon = createIcon('#fbc02d', '🎯');
const poiIcon = createIcon('#283593', '📍');

// ============================================================================
// Componente Map — Tela Cheia
// ============================================================================
export default function Map({ startPoint, endPoint, routes = [], pois = [], onMapClick }) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const layerGroup = useRef(null);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    mapInstance.current = L.map(mapContainer.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([-21.1598, -47.8098], 17);

    // Tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 20,
    }).addTo(mapInstance.current);

    // Zoom control no canto inferior direito
    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

    // Atribuição discreta
    L.control.attribution({ position: 'bottomleft', prefix: false })
      .addAttribution('© <a href="https://openstreetmap.org">OSM</a>')
      .addTo(mapInstance.current);

    // Layer group para marcadores e rotas
    layerGroup.current = L.layerGroup().addTo(mapInstance.current);

    // Click no mapa para debug
    if (onMapClick) {
      mapInstance.current.on('click', (e) => {
        onMapClick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Atualizar marcadores e rotas
  useEffect(() => {
    if (!mapInstance.current || !layerGroup.current) return;

    // Limpar layers anteriores
    layerGroup.current.clearLayers();
    const bounds = L.latLngBounds();

    // Marcador de início
    if (startPoint) {
      L.marker([startPoint.latitude, startPoint.longitude], { icon: startIcon })
        .bindPopup(`
          <div style="font-family: Inter, sans-serif; padding: 4px;">
            <strong style="color: #1a237e;">📍 Partida</strong><br/>
            <span style="color: #555;">${startPoint.name || 'Ponto de partida'}</span>
          </div>
        `)
        .addTo(layerGroup.current);
      bounds.extend([startPoint.latitude, startPoint.longitude]);
    }

    // Marcador de destino
    if (endPoint) {
      L.marker([endPoint.latitude, endPoint.longitude], { icon: endIcon })
        .bindPopup(`
          <div style="font-family: Inter, sans-serif; padding: 4px;">
            <strong style="color: #fbc02d;">🎯 Destino</strong><br/>
            <span style="color: #555;">${endPoint.name || 'Destino'}</span>
          </div>
        `)
        .addTo(layerGroup.current);
      bounds.extend([endPoint.latitude, endPoint.longitude]);
    }

    // Desenhar rota selecionada (primeira da lista)
    if (routes.length > 0 && startPoint && endPoint) {
      const route = routes[0];

      // Se tiver waypoints/steps com coordenadas, usa elas
      const routePoints = [];
      routePoints.push([startPoint.latitude, startPoint.longitude]);

      if (route.waypoints && route.waypoints.length > 0) {
        route.waypoints.forEach(wp => {
          routePoints.push([wp.latitude, wp.longitude]);
        });
      }

      routePoints.push([endPoint.latitude, endPoint.longitude]);

      // Linha da rota
      L.polyline(routePoints, {
        color: '#1a237e',
        weight: 5,
        opacity: 0.8,
        smoothFactor: 1,
        dashArray: null,
      }).addTo(layerGroup.current);

      // Linha decorativa (sombra)
      L.polyline(routePoints, {
        color: '#fbc02d',
        weight: 8,
        opacity: 0.3,
        smoothFactor: 1,
      }).addTo(layerGroup.current);
    }

    // Marcadores dos POIs
    pois.forEach(poi => {
      L.marker([poi.latitude, poi.longitude], { icon: poiIcon })
        .bindPopup(`
          <div style="font-family: Inter, sans-serif; padding: 4px;">
            <strong style="color: #1a237e;">${poi.name}</strong><br/>
            <span style="color: #888; font-size: 12px;">${poi.type || ''}</span>
          </div>
        `)
        .addTo(layerGroup.current);
      bounds.extend([poi.latitude, poi.longitude]);
    });

    // Ajustar zoom
    if (bounds.isValid()) {
      mapInstance.current.fitBounds(bounds, {
        padding: [80, 80],
        maxZoom: 18,
      });
    }
  }, [startPoint, endPoint, routes, pois]);

  return (
    <div
      ref={mapContainer}
      className="absolute inset-0 w-full h-full"
      role="region"
      aria-label="Mapa de navegação do campus UNAERP"
    />
  );
}
