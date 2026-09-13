import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, X, ArrowRightLeft, Loader } from 'lucide-react';
import { searchPOIs } from '../services/api';

// ============================================================================
// SearchBar — Barra de busca floating com autocomplete
// ============================================================================
export default function SearchBar({
  onSelectOrigin,
  onSelectDestination,
  onCalculateRoute,
  selectedOrigin,
  selectedDestination,
  loading,
}) {
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fromRef = useRef(null);
  const toRef = useRef(null);

  // Debounced search — origem
  useEffect(() => {
    if (fromQuery.length < 2) {
      setFromSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchPOIs(fromQuery);
      setFromSuggestions(results || []);
      setShowFrom(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [fromQuery]);

  // Debounced search — destino
  useEffect(() => {
    if (toQuery.length < 2) {
      setToSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchPOIs(toQuery);
      setToSuggestions(results || []);
      setShowTo(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [toQuery]);

  // Fechar suggestions ao clicar fora
  useEffect(() => {
    const handleClick = (e) => {
      if (fromRef.current && !fromRef.current.contains(e.target)) setShowFrom(false);
      if (toRef.current && !toRef.current.contains(e.target)) setShowTo(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, []);

  const selectFrom = (poi) => {
    setFromQuery(poi.name);
    setShowFrom(false);
    onSelectOrigin(poi);
    if (!selectedDestination) {
      setExpanded(true);
      setTimeout(() => toRef.current?.querySelector('input')?.focus(), 100);
    }
  };

  const selectTo = (poi) => {
    setToQuery(poi.name);
    setShowTo(false);
    onSelectDestination(poi);
  };

  const handleSwap = () => {
    const tempQuery = fromQuery;
    const tempPoi = selectedOrigin;
    setFromQuery(toQuery);
    setToQuery(tempQuery);
    onSelectOrigin(selectedDestination);
    onSelectDestination(tempPoi);
  };

  const handleClear = () => {
    setFromQuery('');
    setToQuery('');
    setFromSuggestions([]);
    setToSuggestions([]);
    onSelectOrigin(null);
    onSelectDestination(null);
    setExpanded(false);
  };

  const canCalculate = selectedOrigin && selectedDestination && !loading;

  // Tipo → ícone emoji
  const typeEmoji = (type) => {
    const map = {
      classroom: '🏫',
      laboratory: '🔬',
      library: '📚',
      cafeteria: '☕',
      auditorium: '🎭',
      restroom: '🚻',
      parking: '🅿️',
      entrance: '🚪',
      elevator: '🛗',
      admin: '🏢',
    };
    return map[type] || '📍';
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000] animate-slide-down">
      <div className="glass rounded-2xl shadow-xl overflow-visible">
        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-unaerp-blue flex items-center justify-center flex-shrink-0">
            <Navigation size={16} className="text-unaerp-yellow" />
          </div>
          <h1 className="text-sm font-bold text-unaerp-blue tracking-tight flex-1">
            Campus UNAERP
          </h1>
          {(fromQuery || toQuery) && (
            <button
              onClick={handleClear}
              className="p-1.5 rounded-full hover:bg-gray-100 transition"
              aria-label="Limpar busca"
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Busca: Origem */}
        <div className="px-4 pb-2" ref={fromRef}>
          <div className="relative">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 focus-within:border-unaerp-blue focus-within:ring-2 focus-within:ring-unaerp-blue/20 transition">
              <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
              <input
                type="text"
                value={fromQuery}
                onChange={(e) => {
                  setFromQuery(e.target.value);
                  if (selectedOrigin) onSelectOrigin(null);
                }}
                onFocus={() => {
                  setExpanded(true);
                  if (fromQuery.length >= 2) setShowFrom(true);
                }}
                placeholder="De onde?"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                aria-label="Local de partida"
              />
              {selectedOrigin && (
                <span className="text-xs text-green-600 font-medium">✓</span>
              )}
            </div>

            {/* Suggestions: Origem */}
            {showFrom && fromSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 glass rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                {fromSuggestions.map((poi, i) => (
                  <button
                    key={poi.id || i}
                    onClick={() => selectFrom(poi)}
                    className="w-full text-left px-3 py-2.5 hover:bg-unaerp-blue/5 flex items-center gap-2.5 transition border-b border-gray-100 last:border-0"
                  >
                    <span className="text-lg">{typeEmoji(poi.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{poi.name}</p>
                      <p className="text-xs text-gray-400">{poi.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Busca: Destino (expandível) */}
        {expanded && (
          <div className="px-4 pb-2 animate-fade-in" ref={toRef}>
            {/* Swap button */}
            <div className="flex justify-center -mt-1 mb-1">
              <button
                onClick={handleSwap}
                className="p-1 rounded-full hover:bg-gray-100 transition"
                aria-label="Trocar origem e destino"
                disabled={!selectedOrigin && !selectedDestination}
              >
                <ArrowRightLeft size={14} className="text-gray-400" />
              </button>
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 focus-within:border-unaerp-yellow focus-within:ring-2 focus-within:ring-unaerp-yellow/20 transition">
                <div className="w-3 h-3 rounded-full bg-unaerp-yellow flex-shrink-0" />
                <input
                  type="text"
                  value={toQuery}
                  onChange={(e) => {
                    setToQuery(e.target.value);
                    if (selectedDestination) onSelectDestination(null);
                  }}
                  onFocus={() => {
                    if (toQuery.length >= 2) setShowTo(true);
                  }}
                  placeholder="Para onde?"
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                  aria-label="Local de destino"
                />
                {selectedDestination && (
                  <span className="text-xs text-unaerp-yellow font-medium">✓</span>
                )}
              </div>

              {/* Suggestions: Destino */}
              {showTo && toSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 glass rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                  {toSuggestions.map((poi, i) => (
                    <button
                      key={poi.id || i}
                      onClick={() => selectTo(poi)}
                      className="w-full text-left px-3 py-2.5 hover:bg-unaerp-yellow/10 flex items-center gap-2.5 transition border-b border-gray-100 last:border-0"
                    >
                      <span className="text-lg">{typeEmoji(poi.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{poi.name}</p>
                        <p className="text-xs text-gray-400">{poi.type}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botão calcular rota */}
        {expanded && (
          <div className="px-4 pb-4 pt-2 animate-fade-in">
            <button
              onClick={onCalculateRoute}
              disabled={!canCalculate}
              className={`
                w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all
                ${canCalculate
                  ? 'bg-unaerp-blue text-white hover:bg-unaerp-blue-light active:scale-[0.98] shadow-lg shadow-unaerp-blue/30'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
              aria-label="Calcular rota"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Calcular Rota
                </>
              )}
            </button>
          </div>
        )}

        {/* Tap para expandir */}
        {!expanded && !fromQuery && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full px-4 pb-3 text-xs text-gray-400 text-center"
          >
            Toque para buscar destino →
          </button>
        )}
      </div>
    </div>
  );
}
