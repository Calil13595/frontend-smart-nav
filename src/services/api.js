// ============================================================================
// API Client — Campus Smart Navigation (Simplified)
// ============================================================================
// Usa apenas os endpoints que o frontend novo precisa:
//   - GET  /poi/search?query=...   → buscar POIs
//   - POST /routes/calculate       → calcular rotas
//   - GET  /health                 → health check
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ============================================================================
// Helper genérico para requisições
// ============================================================================
const request = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Erro na requisição: ${response.status}`);
  }

  return data;
};

// ============================================================================
// POI — Pontos de Interesse
// ============================================================================

export const searchPOIs = async (query, type = null) => {
  try {
    let endpoint = `/poi/search?query=${encodeURIComponent(query)}`;
    if (type) endpoint += `&type=${type}`;

    const data = await request(endpoint);
    return data.data || [];
  } catch (error) {
    console.error('Erro ao buscar POIs:', error);
    return [];
  }
};

export const getPOITypes = async () => {
  try {
    const data = await request('/poi/types');
    return data.data || [];
  } catch (error) {
    console.error('Erro ao buscar tipos:', error);
    return [];
  }
};

// ============================================================================
// Rotas
// ============================================================================

export const calculateRoute = async (start, end, preferences = {}) => {
  try {
    const data = await request('/routes/calculate', {
      method: 'POST',
      body: JSON.stringify({
        start,
        end,
        preferences: {
          routeType: 'balanced',
          wheelchairAccessible: false,
          avoidStairs: false,
          requireElevator: false,
          mobilitySpeed: 1.0,
          language: 'pt-BR',
          ...preferences,
        },
      }),
    });

    return data.data || { routes: [] };
  } catch (error) {
    console.error('Erro ao calcular rota:', error);
    return { routes: [] };
  }
};

// ============================================================================
// Health Check
// ============================================================================

export const healthCheck = async () => {
  try {
    const data = await request('/health');
    return data;
  } catch (error) {
    console.error('Erro no health check:', error);
    return null;
  }
};

// ============================================================================
// Export default
// ============================================================================
export default {
  searchPOIs,
  getPOITypes,
  calculateRoute,
  healthCheck,
};