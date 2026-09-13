import { useState, useCallback } from 'react';
import Map from './components/Map';
import SearchBar from './components/SearchBar';
import RoutePanel from './components/RoutePanel';
import AccessibilityMenu from './components/AccessibilityMenu';
import StreetViewModal from './components/StreetViewModal';
import { calculateRoute, UNAERP_CAMPUS_POIS } from './services/api';

// ============================================================================
// App — Campus Smart Navigation UNAERP
// ============================================================================
export default function App() {
  // State de navegação
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State do Street View 360°
  const [streetViewOpen, setStreetViewOpen] = useState(false);
  const [streetViewLocation, setStreetViewLocation] = useState(null);

  // Preferências de acessibilidade
  const [a11yPrefs, setA11yPrefs] = useState({
    wheelchairAccessible: false,
    avoidStairs: false,
  });

  // Abertura do Street View
  const handleOpenStreetView = useCallback((loc) => {
    setStreetViewLocation(loc || destination || origin || UNAERP_CAMPUS_POIS[0]);
    setStreetViewOpen(true);
  }, [destination, origin]);

  const handleCloseStreetView = useCallback(() => {
    setStreetViewOpen(false);
  }, []);

  // Calcular rota
  const handleCalculateRoute = useCallback(async () => {
    if (!origin || !destination) return;

    setLoading(true);
    setError(null);
    setRoutes([]);

    try {
      const result = await calculateRoute(
        {
          name: origin.name,
          latitude: origin.latitude,
          longitude: origin.longitude,
        },
        {
          name: destination.name,
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
        {
          routeType: 'balanced',
          ...a11yPrefs,
          language: 'pt-BR',
        }
      );

      const foundRoutes = result.routes || [];
      setRoutes(foundRoutes);

      if (foundRoutes.length > 0) {
        setSelectedRoute(foundRoutes[0]);
      } else {
        setError('Nenhuma rota encontrada para os pontos selecionados.');
      }
    } catch (err) {
      console.error('Erro ao calcular rota:', err);
      setError('Erro ao calcular rota. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [origin, destination, a11yPrefs]);

  const handleCloseRoutes = () => {
    setRoutes([]);
    setSelectedRoute(null);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100">
      {/* Camada 1: Mapa fullscreen com centro na UNAERP */}
      <Map
        startPoint={origin}
        endPoint={destination}
        routes={selectedRoute ? [selectedRoute] : []}
        pois={UNAERP_CAMPUS_POIS}
        onSelectOrigin={setOrigin}
        onSelectDestination={setDestination}
        onOpenStreetView={handleOpenStreetView}
      />

      {/* Camada 2: Barra de busca flutuante */}
      <SearchBar
        onSelectOrigin={setOrigin}
        onSelectDestination={setDestination}
        onCalculateRoute={handleCalculateRoute}
        selectedOrigin={origin}
        selectedDestination={destination}
        loading={loading}
        onOpenStreetView={handleOpenStreetView}
      />

      {/* Camada 3: Painel de rotas calculadas (bottom sheet) */}
      {routes.length > 0 && (
        <RoutePanel
          routes={routes}
          origin={origin}
          destination={destination}
          onClose={handleCloseRoutes}
          onSelectRoute={setSelectedRoute}
        />
      )}

      {/* Camada 4: Menu flutuante de acessibilidade (FAB) */}
      <AccessibilityMenu onPreferencesChange={setA11yPrefs} />

      {/* Camada 5: Modal de Street View 360° */}
      <StreetViewModal
        isOpen={streetViewOpen}
        onClose={handleCloseStreetView}
        location={streetViewLocation}
      />

      {/* Toast de erro / notificação */}
      {error && (
        <div className="absolute top-28 left-4 right-4 z-[1001] max-w-md mx-auto animate-slide-down">
          <div className="bg-red-600 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-white/80 hover:text-white font-bold p-1"
              aria-label="Fechar alerta"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}