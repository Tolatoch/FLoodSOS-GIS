export type ProvinceId = 'chiang_mai' | 'chiang_rai' | 'phayao' | 'nan' | 'lampang';

export type RiskLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export type GistdaStatus = 'normal' | 'watch' | 'warning' | 'critical';

export type TemporalExtent = '1_day' | '3_day' | '7_day';

export type BasemapType = 'osm' | 'terrain' | 'satellite' | 'dark';

export type AppViewMode = 'map' | 'dashboard' | 'admin';

export interface ProvinceInfo {
  id: ProvinceId;
  nameTh: string;
  nameEn: string;
  center: [number, number];
  zoom: number;
  bounds: [[number, number], [number, number]];
  areaSqKm: number;
  population: number;
  totalShelters: number;
  activeRiskZones: number;
}

export interface FloodRiskArea {
  id: string;
  code: string;
  titleTh: string;
  titleEn: string;
  province: ProvinceId;
  districtTh: string;
  districtEn: string;
  subdistrictTh: string;
  subdistrictEn: string;
  riskLevel: RiskLevel;
  gistdaStatus: GistdaStatus;
  waterDepthMeters: number;
  affectedAreaSqKm: number;
  affectedHouseholds: number;
  center: [number, number];
  polygon: [number, number][];
  source: 'GISTDA Flood Monitoring' | 'DDPM Thailand' | 'HII River Gauge' | 'Royal Irrigation Dept';
  updatedAt: string;
  alertNoteTh?: string;
  alertNoteEn?: string;
  temporalExtent?: TemporalExtent;
  satelliteSensor?: string;
  floodFrequency?: string;
}

export type ShelterType =
  | 'government'
  | 'school'
  | 'university'
  | 'temple'
  | 'tao'
  | 'municipality'
  | 'pao';

export interface ShelterVerificationStamp {
  elevationMsl: number;
  verifiedBy?: string;
}

export interface Shelter {
  id: string;
  nameTh: string;
  nameEn: string;
  type: ShelterType;
  province: ProvinceId;
  districtTh: string;
  districtEn: string;
  subdistrictTh: string;
  subdistrictEn: string;
  addressTh: string;
  addressEn: string;
  lat: number;
  lng: number;
  capacity: number;
  currentOccupants: number;
  status: 'open' | 'standby' | 'full';
  contact: string;
  facilities: string[];
  source: 'DDPM Open Data CKAN' | 'Local Government';
  updatedAt: string;
  distanceKm?: number;
  verificationStamp: ShelterVerificationStamp;
}

export interface RouteStep {
  instructionTh: string;
  instructionEn: string;
  distanceMeters: number;
  durationSeconds: number;
  icon: 'straight' | 'turn-left' | 'turn-right' | 'destination' | 'warning';
  floodWarning?: string;
  roadName?: string;
}

export interface EvacuationRoute {
  id: string;
  nameTh: string;
  nameEn: string;
  origin: [number, number];
  destination: [number, number];
  destinationShelterId: string;
  distanceKm: number;
  durationMinutes: number;
  coordinates: [number, number][]; // LineString lat, lng pairs on real road network
  hasFloodHazardOnRoute: boolean;
  statusMessageTh: string; // e.g. "ไม่พบจุดเสี่ยงน้ำท่วมในฐานข้อมูลบนเส้นทางนี้"
  statusMessageEn: string; // e.g. "No known flood area on this route"
  dataTimestamp: string;
  floodConflicts: {
    areaId: string;
    areaTitleTh: string;
    riskLevel: RiskLevel;
    waterDepthMeters: number;
  }[];
  steps: RouteStep[];
  type: 'recommended_safe' | 'fastest_direct';
  elevationGainMeters?: number;
}

export interface GistdaVerificationStatus {
  apiEndpoint: string;
  httpStatus: number;
  latencyMs: number;
  lastSyncTimestamp: string;
  dataIntegrityHash: string;
  activeSensors: string[];
  connectionStatus: 'live_stable' | 'syncing' | 'cached_fallback';
  totalFeaturesCount: number;
  activeTemporalExtent: TemporalExtent;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'user' | 'guest';
  avatar?: string;
  token?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  textTh: string;
  textEn: string;
  timestamp: string;
  toolCalls?: {
    toolName: string;
    parameters: any;
    resultSnippet?: string;
  }[];
  mapAction?: {
    type: 'zoom_province' | 'highlight_shelter' | 'highlight_flood' | 'show_route' | 'clear_layers';
    payload: any;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  userRole: string;
  entityType: 'flood_risk_area' | 'shelter' | 'user' | 'system';
  entityId: string;
  timestamp: string;
  detailsTh: string;
  detailsEn: string;
  ipAddress: string;
}

export interface LayerVisibility {
  floodAreas: boolean;
  shelters: boolean;
  rivers: boolean;
  roads: boolean;
  adminBoundaries: boolean;
  floodFrequency?: boolean;
}
