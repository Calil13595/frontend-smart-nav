import { useState, useEffect } from 'react';
import { Eye, X, ExternalLink, Compass, MapPin } from 'lucide-react';

// ============================================================================
// StreetViewModal — Visualização 360° do Campus UNAERP com Google Street View
// ============================================================================
const DEFAULT_LOCATIONS = [
  {
    name: 'Portaria Principal (Av. Costábile Romano)',
    latitude: -21.20022,
    longitude: -47.77805,
    description: 'Vista frontal do campus e entrada de pedestres/veículos',
  },
  {
    name: 'Av. Costábile Romano (Fachada UNAERP)',
    latitude: -21.20085,
    longitude: -47.77765,
    description: 'Avenida principal em frente à universidade',
  },
  {
    name: 'Entrada Hospital Electro Bonini',
    latitude: -21.20260,
    longitude: -47.77820,
    description: 'Acesso ao hospital universitário e ambulatório',
  },
  {
    name: 'Biblioteca & Pátio Central',
    latitude: -21.20125,
    longitude: -47.77935,
    description: 'Área de convivência e biblioteca',
  },
];

export default function StreetViewModal({ isOpen, onClose, location }) {
  const [currentLoc, setCurrentLoc] = useState(DEFAULT_LOCATIONS[0]);

  useEffect(() => {
    if (location && location.latitude && location.longitude) {
      setCurrentLoc({
        name: location.name || 'Ponto selecionado',
        latitude: location.latitude,
        longitude: location.longitude,
        description: location.description || 'Ponto no campus UNAERP',
      });
    }
  }, [location]);

  if (!isOpen) return null;

  const { latitude, longitude, name } = currentLoc;
  const embedUrl = `https://maps.google.com/maps?q=&layer=c&cbll=${latitude},${longitude}&cbp=11,0,0,0,0&output=svembed`;
  const externalUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 animate-fade-in bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-white/20">
        {/* Header */}
        <div className="bg-unaerp-blue px-4 py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-unaerp-yellow/20 flex items-center justify-center text-unaerp-yellow">
              <Eye size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Street View 360° — Campus UNAERP</h2>
              <p className="text-xs text-white/70 truncate max-w-xs sm:max-w-md">
                {name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1.5 transition"
              title="Abrir no Google Maps"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Abrir no Maps</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Fechar Street View"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick location chips */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 flex-shrink-0">
            <Compass size={13} /> Pontos rápidos:
          </span>
          {DEFAULT_LOCATIONS.map((loc, i) => (
            <button
              key={i}
              onClick={() => setCurrentLoc(loc)}
              className={`
                px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition
                ${currentLoc.name === loc.name
                  ? 'bg-unaerp-blue text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }
              `}
            >
              {loc.name.split('(')[0]}
            </button>
          ))}
        </div>

        {/* Street View Iframe Container */}
        <div className="relative flex-1 min-h-[380px] sm:min-h-[480px] bg-gray-900">
          <iframe
            title="Google Street View UNAERP"
            src={embedUrl}
            className="w-full h-full border-0 absolute inset-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-gray-100 text-xs text-gray-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin size={13} className="text-unaerp-blue" />
            Lat: {latitude.toFixed(5)}, Lng: {longitude.toFixed(5)}
          </span>
          <span className="text-[11px] text-gray-400">
            Imagens fornecidas via Google Maps Street View
          </span>
        </div>
      </div>
    </div>
  );
}
