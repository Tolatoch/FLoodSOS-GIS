import { FloodRiskArea, Shelter, EvacuationRoute, ProvinceId } from '../types';
import {
  INITIAL_FLOOD_RISK_AREAS,
  INITIAL_SHELTERS,
} from '../data/geoData';
import {
  calculateEvacuationRoute,
  findNearestShelters,
} from './routingService';

const API_BASE = '/api';

export const api = {
  // 1. Flood Risk
  async getFloodRiskAreas(params?: {
    province?: string;
    risk_level?: string;
    search?: string;
  }): Promise<FloodRiskArea[]> {
    try {
      const q = new URLSearchParams();
      if (params?.province) q.set('province', params.province);
      if (params?.risk_level) q.set('risk_level', params.risk_level);
      if (params?.search) q.set('search', params.search);

      const res = await fetch(`${API_BASE}/flood-risk?${q.toString()}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      return data.features || INITIAL_FLOOD_RISK_AREAS;
    } catch {
      let items = [...INITIAL_FLOOD_RISK_AREAS];
      if (params?.province && params.province !== 'all') {
        items = items.filter((a) => a.province === params.province);
      }
      if (params?.risk_level && params.risk_level !== 'all') {
        items = items.filter((a) => a.riskLevel === params.risk_level);
      }
      return items;
    }
  },

  async getFloodRiskAt(
    lat: number,
    lng: number
  ): Promise<{
    isInsideFloodZone: boolean;
    matchingAreas: FloodRiskArea[];
    highestRiskLevel: string;
    maxDepthMeters: number;
    nearestSafeShelter: Shelter | null;
  }> {
    try {
      const res = await fetch(`${API_BASE}/flood-risk/at?lat=${lat}&lng=${lng}`);
      if (!res.ok) throw new Error('Fetch failed');
      return await res.json();
    } catch {
      const nearest = findNearestShelters([lat, lng], INITIAL_SHELTERS, 1)[0] || null;
      return {
        isInsideFloodZone: false,
        matchingAreas: [],
        highestRiskLevel: 'none',
        maxDepthMeters: 0,
        nearestSafeShelter: nearest,
      };
    }
  },

  // 2. Shelters
  async getShelters(params?: {
    province?: string;
    type?: string;
    search?: string;
  }): Promise<Shelter[]> {
    try {
      const q = new URLSearchParams();
      if (params?.province) q.set('province', params.province);
      if (params?.type) q.set('type', params.type);
      if (params?.search) q.set('search', params.search);

      const res = await fetch(`${API_BASE}/shelters?${q.toString()}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      return data.shelters || INITIAL_SHELTERS;
    } catch {
      let items = [...INITIAL_SHELTERS];
      if (params?.province && params.province !== 'all') {
        items = items.filter((s) => s.province === params.province);
      }
      if (params?.type && params.type !== 'all') {
        items = items.filter((s) => s.type === params.type);
      }
      return items;
    }
  },

  async getNearestShelters(
    lat: number,
    lng: number,
    limit = 5,
    type?: string
  ): Promise<(Shelter & { distanceKm: number })[]> {
    try {
      const q = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        limit: String(limit),
      });
      if (type) q.set('type', type);
      const res = await fetch(`${API_BASE}/shelters/nearest?${q.toString()}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      return data.results;
    } catch {
      return findNearestShelters([lat, lng], INITIAL_SHELTERS, limit, type);
    }
  },

  // 3. Routing
  async getRoute(
    fromLat: number,
    fromLng: number,
    shelterId?: string,
    toLat?: number,
    toLng?: number,
    avoidFlood = true
  ): Promise<{
    recommendedRoute: EvacuationRoute;
    alternativeRoute: EvacuationRoute;
    shelter: Shelter;
  }> {
    try {
      const q = new URLSearchParams({
        fromLat: String(fromLat),
        fromLng: String(fromLng),
        avoidFlood: String(avoidFlood),
      });
      if (shelterId) q.set('shelterId', shelterId);
      if (toLat) q.set('toLat', String(toLat));
      if (toLng) q.set('toLng', String(toLng));

      const res = await fetch(`${API_BASE}/route?${q.toString()}`);
      if (!res.ok) throw new Error('Fetch failed');
      return await res.json();
    } catch {
      const shelter = shelterId
        ? INITIAL_SHELTERS.find((s) => s.id === shelterId) || INITIAL_SHELTERS[0]
        : INITIAL_SHELTERS[0];
      const routes = await calculateEvacuationRoute(
        [fromLat, fromLng],
        shelter,
        INITIAL_FLOOD_RISK_AREAS
      );
      return {
        recommendedRoute: routes.recommended,
        alternativeRoute: routes.alternative,
        shelter,
      };
    }
  },

  // 4. Stats
  async getProvinceStats() {
    try {
      const res = await fetch(`${API_BASE}/stats/provinces`);
      if (!res.ok) throw new Error('Fetch failed');
      return await res.json();
    } catch (err) {
      console.warn('Province stats fallback');
      return null;
    }
  },

  // 5. AI Disaster Agent
  async chatWithAgent(params: {
    message: string;
    language: 'th' | 'en';
    userLocation?: { lat: number; lng: number };
  }) {
    try {
      const res = await fetch(`${API_BASE}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Agent failed');
      return await res.json();
    } catch (err: any) {
      return {
        textTh: `⚠️ เกิดข้อขัดข้องชั่วคราวในการเชื่อมต่อ AI: ${err.message}`,
        textEn: `⚠️ Temporary AI connection issue: ${err.message}`,
        toolCalls: [],
      };
    }
  },

  // 6. Admin
  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`);
    return await res.json();
  },

  async createFloodArea(data: Partial<FloodRiskArea>) {
    const res = await fetch(`${API_BASE}/admin/flood-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async updateFloodArea(id: string, data: Partial<FloodRiskArea>) {
    const res = await fetch(`${API_BASE}/admin/flood-risk/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async deleteFloodArea(id: string) {
    const res = await fetch(`${API_BASE}/admin/flood-risk/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  },

  async createShelter(data: Partial<Shelter>) {
    const res = await fetch(`${API_BASE}/admin/shelters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async updateShelter(id: string, data: Partial<Shelter>) {
    const res = await fetch(`${API_BASE}/admin/shelters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async deleteShelter(id: string) {
    const res = await fetch(`${API_BASE}/admin/shelters/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  },

  async getUsers() {
    const res = await fetch(`${API_BASE}/admin/users`);
    return await res.json();
  },

  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/admin/audit-logs`);
    return await res.json();
  },

  async syncGistda() {
    const res = await fetch(`${API_BASE}/admin/import/gistda`, { method: 'POST' });
    return await res.json();
  },

  async syncDdpm() {
    const res = await fetch(`${API_BASE}/admin/import/ddpm`, { method: 'POST' });
    return await res.json();
  },
};
