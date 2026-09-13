import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Eye } from 'lucide-react';
import { UNAERP_CAMPUS_POIS } from '../services/api';

// Fix para ícones padrão do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Coordenadas centrais do Campus UNAERP (Ribeirânia - Ribeirão Preto)
export const UNAERP_CENTER = [-21.2010, -47.7792];

// Polígono do Campus UNAERP
const UNAERP_POLYGON = [
  [-21.1995, -47.7782],
  [-21.2003, -47.7768],
  [-21.2032, -47.7780],
  [-21.2035, -47.7808],
  [-21.2015, -47.7806],
  [-21.2000, -47.7798],
];

// Ícones customizados
const createIcon = (color, emoji = '📍', size = 36) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        background: ${color};
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 2px solid #fff;
        cursor: pointer;
      ">
        <span style="transform: rotate(45deg); font-size: 16px;">${emoji}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const startIcon = createIcon('#10b981', '🟢', 40);
const endIcon = createIcon('#fbc02d', '🎯', 40);

const getPoiEmoji = (type) => {
  const map = {
    classroom: '🏫',
    library: '📚',
    laboratory: '🔬',
    cafeteria: '☕',
    auditorium: '🎭',
    health: '🏥',
    sports: '⚽',
    entrance: '🚪',
    parking: '🅿️',
  };
  return map[type] || '📍';
};

export default function Map({
  startPoint,
  endPoint,
  routes = [],
  pois = UNAERP_CAMPUS_POIS,
  onSelectOrigin,
  onSelectDestination,
  onOpenStreetView,
}) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const layerGroup = useRef(null);

  // Inicializar mapa centrado na UNAERP
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    mapInstance.current = L.map(mapContainer.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(UNAERP_CENTER, 17);

    // Camada de mapas OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 20,
    }).addTo(mapInstance.current);

    // Polígono demarcador do Campus UNAERP
    L.polygon(UNAERP_POLYGON, {
      color: '#1a237e',
      weight: 2,
      opacity: 0.6,
      fillColor: '#1a237e',
      fillOpacity: 0.08,
      dashArray: '6, 6',
    }).addTo(mapInstance.current);

    // Zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

    // Atribuição
    L.control
      .attribution({ position: 'bottomleft', prefix: false })
      .addAttribution('© <a href="https://openstreetmap.org">OpenStreetMap</a> | UNAERP Campus')
      .addTo(mapInstance.current);

    // Grupo de camadas
    layerGroup.current = L.layerGroup().addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Atualizar marcadores, rotas e POIs
  useEffect(() => {
    if (!mapInstance.current || !layerGroup.current) return;

    layerGroup.current.clearLayers();
    const bounds = L.latLngBounds();

    // Renderizar todos os POIs do campus com popups interativos
    const activePois = pois && pois.length > 0 ? pois : UNAERP_CAMPUS_POIS;
    activePois.forEach((poi) => {
      const isStart = startPoint && startPoint.name === poi.name;
      const isEnd = endPoint && endPoint.name === poi.name;
      if (isStart || isEnd) return; // Não duplica ícone se já for partida/destino

      const icon = createIcon('#1a237e', getPoiEmoji(poi.type), 32);
      const marker = L.marker([poi.latitude, poi.longitude], { icon });

      // Cria container de popup interativo com botões
      const popupDiv = document.createElement('div');
      popupDiv.style.fontFamily = 'Inter, sans-serif';
      popupDiv.style.padding = '4px';
      popupDiv.innerHTML = `
        <div style="margin-bottom: 8px;">
          <strong style="color: #1a237e; font-size: 14px; display: block;">${poi.name}</strong>
          <span style="color: #666; font-size: 12px;">${poi.description || ''}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <button id="btn-start-${poi.id}" style="background: #10b981; color: white; border: none; padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; text-align: center;">
            🟢 Partir daqui
          </button>
          <button id="btn-end-${poi.id}" style="background: #fbc02d; color: #1a237e; border: none; padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; text-align: center;">
            🎯 Ir para cá
          </button>
          <button id="btn-sv-${poi.id}" style="background: #1a237e; color: white; border: none; padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; text-align: center; display: flex; align-items: center; justify-content: center; gap: 4px;">
            📷 Street View 360°
          </button>
        </div>
      `;

      // Listeners nos botões do popup
      marker.bindPopup(popupDiv);
      marker.on('popupopen', () => {
        const startBtn = document.getElementById(`btn-start-${poi.id}`);
        const endBtn = document.getElementById(`btn-end-${poi.id}`);
        const svBtn = document.getElementById(`btn-sv-${poi.id}`);

        if (startBtn && onSelectOrigin) {
          startBtn.onclick = () => {
            onSelectOrigin(poi);
            marker.closePopup();
          };
        }
        if (endBtn && onSelectDestination) {
          endBtn.onclick = () => {
            onSelectDestination(poi);
            marker.closePopup();
          };
        }
        if (svBtn && onOpenStreetView) {
          svBtn.onclick = () => {
            onOpenStreetView(poi);
            marker.closePopup();
          };
        }
      });

      marker.addTo(layerGroup.current);
    });

    // Marcador de início
    if (startPoint) {
      L.marker([startPoint.latitude, startPoint.longitude], { icon: startIcon })
        .bindPopup(`
          <div style="font-family: Inter, sans-serif; padding: 4px;">
            <strong style="color: #10b981; font-size: 14px;">📍 Ponto de Partida</strong><br/>
            <span style="color: #333; font-weight: 500;">${startPoint.name || 'Origem'}</span>
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
            <strong style="color: #f59e0b; font-size: 14px;">🎯 Destino</strong><br/>
            <span style="color: #333; font-weight: 500;">${endPoint.name || 'Destino'}</span>
          </div>
        `)
        .addTo(layerGroup.current);
      bounds.extend([endPoint.latitude, endPoint.longitude]);
    }

    // Desenhar linhas da rota
    if (routes.length > 0 && startPoint && endPoint) {
      const route = routes[0];
      const routePoints = [];

      routePoints.push([startPoint.latitude, startPoint.longitude]);
      if (route.waypoints && route.waypoints.length > 0) {
        route.waypoints.forEach((wp) => {
          routePoints.push([wp.latitude, wp.longitude]);
        });
      }
      routePoints.push([endPoint.latitude, endPoint.longitude]);

      // Sombra
      L.polyline(routePoints, {
        color: '#fbc02d',
        weight: 8,
        opacity: 0.4,
        smoothFactor: 1,
      }).addTo(layerGroup.current);

      // Linha principal
      L.polyline(routePoints, {
        color: '#1a237e',
        weight: 5,
        opacity: 0.9,
        smoothFactor: 1,
      }).addTo(layerGroup.current);
    }

    // Ajustar zoom para enquadrar rota se houver partida e destino
    if (startPoint && endPoint && bounds.isValid()) {
      mapInstance.current.fitBounds(bounds, {
        padding: [90, 90],
        maxZoom: 18,
      });
    }
  }, [startPoint, endPoint, routes, pois, onSelectOrigin, onSelectDestination, onOpenStreetView]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full"
        role="region"
        aria-label="Mapa interativo do Campus UNAERP"
      />

      {/* Botão flutuante para abrir Street View 360° */}
      <button
        onClick={() => onOpenStreetView && onOpenStreetView(endPoint || startPoint || { name: 'UNAERP Campus', latitude: -21.20022, longitude: -47.77805 })}
        className="absolute bottom-6 left-4 z-[999] glass px-3.5 py-2.5 rounded-xl shadow-lg border border-unaerp-blue/20 hover:bg-unaerp-blue hover:text-white text-unaerp-blue font-semibold text-xs flex items-center gap-2 transition active:scale-95"
        title="Ver Campus em 360°"
      >
        <Eye size={16} className="text-unaerp-yellow" />
        <span>Street View 360°</span>
      </button>
    </div>
  );
}
