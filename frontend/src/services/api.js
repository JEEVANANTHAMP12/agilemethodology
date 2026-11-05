const BASE_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('rover_auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type'] && options.method && options.method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errData = await response.json();
      errorMsg = errData.detail || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
}

export const api = {
  // Auth (Phase 3)
  auth: {
    login: (username, password) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
    register: (userData) => request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me')
  },

  // Rover (Phase 4)
  rover: {
    connect: (payload) => request('/rover/connect', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    getStatus: (roverCode = 'ROVER-01') => request(`/rover/status?rover_code=${roverCode}`),
    simulateScan: (severity = 'MODERATE', wallId = null) => {
      const query = new URLSearchParams({ crack_severity: severity });
      if (wallId) query.append('wall_id', wallId);
      return request(`/dashboard/simulate-scan?${query.toString()}`, { method: 'POST' });
    }
  },

  // Inspection
  inspection: {
    start: (wallId, roverCode = 'ROVER-01', notes = '') => request('/inspection/start', {
      method: 'POST',
      body: JSON.stringify({ wall_id: wallId, rover_code: roverCode, notes })
    }),
    stop: (inspectionId, notes = '') => request('/inspection/stop', {
      method: 'POST',
      body: JSON.stringify({ inspection_id: inspectionId, notes })
    }),
    list: () => request('/inspection/list'),
    get: (id) => request(`/inspection/${id}`)
  },

  // Images & Defect Processing (Phase 5 & ML Engine)
  images: {
    upload: (formData) => request('/images/upload', {
      method: 'POST',
      body: formData
    }),
    predictCrack: (formData) => request('/images/predict-crack', {
      method: 'POST',
      body: formData
    }),
    getMlInfo: () => request('/images/ml-info'),
    getInspectionImages: (inspectionId) => request(`/images/inspection/${inspectionId}`)
  },

  // Structural Health Index (Phase 6)
  shi: {
    evaluate: (inspectionId) => request(`/shi/evaluate/${inspectionId}`, { method: 'POST' }),
    get: (inspectionId) => request(`/shi/inspection/${inspectionId}`)
  },

  // RUL Prediction (Phase 7)
  rul: {
    predict: (inspectionId) => request(`/rul/predict/${inspectionId}`, { method: 'POST' }),
    get: (inspectionId) => request(`/rul/inspection/${inspectionId}`)
  },

  // Alerts (Phase 9)
  alerts: {
    list: (unackOnly = false) => request(`/alerts?unacknowledged_only=${unackOnly}`),
    acknowledge: (alertId) => request(`/alerts/${alertId}/ack`, { method: 'POST' })
  },

  // Reports (Phase 9)
  reports: {
    getJson: (inspectionId) => request(`/reports/inspection/${inspectionId}`),
    getHtmlUrl: (inspectionId) => `${BASE_URL}/reports/inspection/${inspectionId}/html`
  },

  // Dashboard Aggregator (Phase 8 & Live Pulse)
  dashboard: {
    getOverview: () => request('/dashboard/overview'),
    getLivePulse: () => request('/dashboard/live-pulse')
  },

  // Structures (Buildings & Walls)
  structures: {
    getBuildings: () => request('/structures/buildings'),
    createBuilding: (data) => request('/structures/buildings', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getWalls: (buildingId) => request(`/structures/walls${buildingId ? `?building_id=${buildingId}` : ''}`),
    createWall: (data) => request('/structures/walls', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Scala 3 / Pekko Telemetry Stream Engine (Port 8090 & API Proxy)
  scalaStream: {
    getStats: async () => {
      try {
        const res = await fetch('/api/v1/telemetry/stats');
        if (res.ok) return await res.json();
      } catch {
        // ignore and fallback
      }
      const res = await fetch('http://127.0.0.1:8090/api/v1/telemetry/stats');
      if (!res.ok) throw new Error(`Scala stream HTTP error ${res.status}`);
      return await res.json();
    },
    ingestTelemetry: async (sample) => {
      try {
        const res = await fetch('/api/v1/telemetry/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sample)
        });
        if (res.ok) return await res.json();
      } catch {
        // ignore and fallback
      }
      const res = await fetch('http://127.0.0.1:8090/api/v1/telemetry/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sample)
      });
      return await res.json();
    },
    connectLiveWebSocket: (onMessage, onError) => {
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || '127.0.0.1';
      const url = `${wsProto}//${host}:8090/api/v1/telemetry/live`;
      try {
        const ws = new WebSocket(url);
        ws.onmessage = (event) => {
          try {
            onMessage(JSON.parse(event.data));
          } catch {
            // ignore JSON parse error
          }
        };
        if (onError) ws.onerror = onError;
        return ws;
      } catch (err) {
        if (onError) onError(err);
        return null;
      }
    }
  }
};
