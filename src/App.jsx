import { useState, useCallback } from 'react';
import Map from './components/Map';
import SearchBar from './components/SearchBar';
import RoutePanel from './components/RoutePanel';
import AccessibilityMenu from './components/AccessibilityMenu';
import { calculateRoute } from './services/api';

// ============================================================================
// App — Página única: Mapa fullscreen + Search + Routes + Accessibility
// ============================================================================
export default function App() {
  // State principal
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Preferências de acessibilidade (vindas do AccessibilityMenu)
  const [a11yPrefs, setA11yPrefs] = useState({
    wheelchairAccessible: false,
    avoidStairs: false,
  });

  // Calcular rota
  const handleCalculateRoute = useCallback(async () => {
    if (!origin || !destination) return;

    setLoading(true);
    setError(null);
    setRoutes([]);

    try {
      const result = await calculateRoute(
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
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
        setError('Nenhuma rota encontrada');
      }
    } catch (err) {
      console.error('Erro ao calcular rota:', err);
      setError('Erro ao calcular rota. Verifique se o backend está online.');
    } finally {
      setLoading(false);
    }
  }, [origin, destination, a11yPrefs]);

  // Fechar painel de rotas
  const handleCloseRoutes = () => {
    setRoutes([]);
    setSelectedRoute(null);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Layer 1: Mapa fullscreen */}
      <Map
        startPoint={origin}
        endPoint={destination}
        routes={selectedRoute ? [selectedRoute] : []}
      />

      {/* Layer 2: Barra de busca floating */}
      <SearchBar
        onSelectOrigin={setOrigin}
        onSelectDestination={setDestination}
        onCalculateRoute={handleCalculateRoute}
        selectedOrigin={origin}
        selectedDestination={destination}
        loading={loading}
      />

      {/* Layer 3: Painel de rotas (bottom sheet) */}
      {routes.length > 0 && (
        <RoutePanel
          routes={routes}
          origin={origin}
          destination={destination}
          onClose={handleCloseRoutes}
          onSelectRoute={setSelectedRoute}
        />
      )}

      {/* Layer 4: Menu de acessibilidade (FAB) */}
      <AccessibilityMenu
        onPreferencesChange={setA11yPrefs}
      />

      {/* Error toast */}
      {error && (
        <div className="absolute top-24 left-4 right-4 z-[1001] animate-slide-down">
          <div className="bg-red-500 text-white text-sm px-4 py-3 rounded-xl shadow-lg flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-white/80 hover:text-white font-bold"
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