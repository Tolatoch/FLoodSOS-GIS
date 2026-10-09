import { EvacuationRoute, FloodRiskArea, Shelter, RouteStep } from '../types';

// Calculate Haversine distance in km
export function haversineDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const dLon = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1[0] * Math.PI) / 180) *
      Math.cos((coord2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Ray-casting point in polygon
export function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  const [lat, lng] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Check route intersection with flood areas
export function checkRouteFloodConflicts(
  coords: [number, number][],
  floodAreas: FloodRiskArea[]
) {
  const conflicts: {
    areaId: string;
    areaTitleTh: string;
    riskLevel: any;
    waterDepthMeters: number;
  }[] = [];

  const checkedIds = new Set<string>();

  // Check every few coordinates along the road
  for (let i = 0; i < coords.length; i += 3) {
    const pt = coords[i];
    for (const area of floodAreas) {
      if (
        (area.riskLevel === 'high' || area.riskLevel === 'very_high') &&
        !checkedIds.has(area.id) &&
        isPointInPolygon(pt, area.polygon)
      ) {
        checkedIds.add(area.id);
        conflicts.push({
          areaId: area.id,
          areaTitleTh: area.titleTh,
          riskLevel: area.riskLevel,
          waterDepthMeters: area.waterDepthMeters,
        });
      }
    }
  }

  return conflicts;
}

// Fetch real road-network routing from OSRM
async function fetchOsrmRoute(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number,
  viaLng?: number,
  viaLat?: number
): Promise<{
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
  steps: RouteStep[];
} | null> {
  try {
    let url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};`;
    if (viaLng !== undefined && viaLat !== undefined) {
      url += `${viaLng},${viaLat};`;
    }
    url += `${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;

    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    // OSRM returns coordinates as [lng, lat], convert to Leaflet [lat, lng]
    const coordinates: [number, number][] = route.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]]
    );

    const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
    const durationMinutes = Math.max(3, Math.round(route.duration / 60));

    const steps: RouteStep[] = [];
    if (route.legs && route.legs.length > 0) {
      for (const leg of route.legs) {
        for (const step of leg.steps || []) {
          const type = step.maneuver?.type || 'straight';
          const modifier = step.maneuver?.modifier || '';
          let icon: RouteStep['icon'] = 'straight';
          if (type.includes('arrive') || type === 'destination') icon = 'destination';
          else if (modifier.includes('left')) icon = 'turn-left';
          else if (modifier.includes('right')) icon = 'turn-right';

          const street = step.name || 'ถนนสายหลัก';
          steps.push({
            instructionTh: `${step.maneuver?.instruction || `มุ่งหน้าไปตาม ${street}`}`,
            instructionEn: `${step.maneuver?.instruction || `Proceed along ${street}`}`,
            distanceMeters: Math.round(step.distance || 100),
            durationSeconds: Math.round(step.duration || 30),
            icon,
            roadName: street,
          });
        }
      }
    }

    return {
      coordinates,
      distanceKm,
      durationMinutes,
      steps: steps.slice(0, 8), // Clean readable summary
    };
  } catch (err) {
    console.warn('OSRM router fetch failed, falling back to local road topology:', err);
    return null;
  }
}

// Real northern road corridor nodes for fallback road-snapping if OSRM is temporarily unreachable
const NORTHERN_ROAD_JUNCTIONS: [number, number][] = [
  // Chiang Mai Inner & Outer Arterial Nodes
  [18.7904, 98.9847], // Tha Phae / Old City
  [18.7950, 98.9870], // Chang Phueak Gate
  [18.8050, 98.9680], // Nimman / Superhighway Junction
  [18.8250, 98.9600], // Chotana / Route 107
  [18.8400, 98.9750], // Chiang Mai 700-Year Stadium
  [18.8150, 99.0200], // Superhighway Route 11 north
  [18.7850, 99.0350], // Superhighway Route 11 / Train Station
  [18.7650, 99.0100], // Mahidol Road Route 1141
  [18.7520, 99.0230], // Middle Ring Route 3029 East
  [18.7450, 98.9850], // Middle Ring Route 3029 South (Hang Dong)
  [18.7200, 98.9600], // Outer Ring Route 121 South
  [18.8700, 98.9600], // Outer Ring Route 121 North (Mae Rim)
  // Chiang Rai Corridors
  [19.9072, 99.8325], // Chiang Rai City Center (Route 1)
  [19.9500, 99.8600], // Route 1 North (Mae Fah Luang)
  [19.8500, 99.8100], // Route 1 South (Phan)
  // Phayao Corridors
  [19.1666, 99.9022], // Phayao City Center
  [19.1800, 99.8900], // Phayao Lake Bypass Route 1
  // Nan Corridors
  [18.7756, 100.7730], // Nan City Center (Route 101)
  [18.8200, 100.7800], // Nan North Route 101
  // Lampang Corridors
  [18.2888, 99.4928], // Lampang Clocktower
  [18.3100, 99.5200], // Lampang Superhighway Junction
];

// Road-following waypoint router if external OSRM is unreachable
function generateRoadFollowingFallback(
  start: [number, number],
  end: [number, number],
  detour: boolean
): [number, number][] {
  // Find closest road network junction to start and end
  let bestStartJunc = NORTHERN_ROAD_JUNCTIONS[0];
  let minStartDist = Infinity;
  let bestEndJunc = NORTHERN_ROAD_JUNCTIONS[0];
  let minEndDist = Infinity;

  for (const junc of NORTHERN_ROAD_JUNCTIONS) {
    const d1 = haversineDistance(start, junc);
    if (d1 < minStartDist) {
      minStartDist = d1;
      bestStartJunc = junc;
    }
    const d2 = haversineDistance(end, junc);
    if (d2 < minEndDist) {
      minEndDist = d2;
      bestEndJunc = junc;
    }
  }

  const points: [number, number][] = [start];

  // Route through actual road corridor junctions
  if (minStartDist > 0.1) {
    // Road access segment along nearest grid axis
    points.push([start[0], bestStartJunc[1]]);
    points.push(bestStartJunc);
  }

  if (detour) {
    // If detouring around flood, route via outer arterial ring node
    const detourNode: [number, number] = [
      (bestStartJunc[0] + bestEndJunc[0]) / 2 + 0.015,
      (bestStartJunc[1] + bestEndJunc[1]) / 2 + 0.020,
    ];
    points.push(detourNode);
  }

  if (minEndDist > 0.1 && (bestEndJunc[0] !== bestStartJunc[0] || bestEndJunc[1] !== bestStartJunc[1])) {
    points.push(bestEndJunc);
    // Road approach to final destination
    points.push([bestEndJunc[0], end[1]]);
  }

  points.push(end);
  return points;
}

export async function calculateEvacuationRoute(
  origin: [number, number],
  shelter: Shelter,
  allFloodAreas: FloodRiskArea[]
): Promise<{
  recommended: EvacuationRoute;
  alternative: EvacuationRoute;
}> {
  const destination: [number, number] = [shelter.lat, shelter.lng];
  const dataTimestamp = '06:30 น.';

  // 1. Direct route via OSRM
  let directOsrm = await fetchOsrmRoute(origin[1], origin[0], destination[1], destination[0]);
  let directCoords: [number, number][] = directOsrm
    ? directOsrm.coordinates
    : generateRoadFollowingFallback(origin, destination, false);

  const directDistance = directOsrm
    ? directOsrm.distanceKm
    : Math.round(haversineDistance(origin, destination) * 1.2 * 10) / 10;
  const directDuration = directOsrm
    ? directOsrm.durationMinutes
    : Math.max(5, Math.round((directDistance / 40) * 60));

  const directConflicts = checkRouteFloodConflicts(directCoords, allFloodAreas);

  // 2. Recommended Safe Route (if conflicts found, calculate detour via safe road waypoint)
  let safeCoords: [number, number][] = directCoords;
  let safeDistance = directDistance;
  let safeDuration = directDuration;
  let safeSteps: RouteStep[] = directOsrm?.steps || [];

  if (directConflicts.length > 0) {
    // Determine detour coordinate away from conflict center
    const conflictCenter = allFloodAreas.find((a) => a.id === directConflicts[0].areaId)?.center || origin;
    const viaLat = (origin[0] + destination[0]) / 2 + (conflictCenter[0] > origin[0] ? -0.025 : 0.025);
    const viaLng = (origin[1] + destination[1]) / 2 + (conflictCenter[1] > origin[1] ? -0.03 : 0.03);

    const safeOsrm = await fetchOsrmRoute(origin[1], origin[0], destination[1], destination[0], viaLng, viaLat);
    if (safeOsrm) {
      safeCoords = safeOsrm.coordinates;
      safeDistance = safeOsrm.distanceKm;
      safeDuration = safeOsrm.durationMinutes;
      safeSteps = safeOsrm.steps;
    } else {
      safeCoords = generateRoadFollowingFallback(origin, destination, true);
      safeDistance = Math.round(directDistance * 1.28 * 10) / 10;
      safeDuration = Math.round(directDuration * 1.35);
    }
  }

  const safeConflicts = checkRouteFloodConflicts(safeCoords, allFloodAreas);

  const recommendedRoute: EvacuationRoute = {
    id: `route-safe-${shelter.id}`,
    nameTh: `เส้นทางแนะนำตามโครงข่ายถนน (ไป ${shelter.nameTh})`,
    nameEn: `Recommended Route via Road Network (to ${shelter.nameEn})`,
    origin,
    destination,
    destinationShelterId: shelter.id,
    distanceKm: safeDistance,
    durationMinutes: safeDuration,
    coordinates: safeCoords,
    hasFloodHazardOnRoute: safeConflicts.length > 0,
    statusMessageTh:
      safeConflicts.length === 0
        ? `ไม่พบจุดเสี่ยงน้ำท่วมในฐานข้อมูลบนเส้นทางนี้ (ข้อมูล GISTDA ณ ${dataTimestamp})`
        : `ตรวจพบจุดเสี่ยงน้ำท่วมใกล้เคียง ${safeConflicts.length} จุด กรุณาใช้ความระมัดระวัง`,
    statusMessageEn:
      safeConflicts.length === 0
        ? `No known flood area on this route (GISTDA data as of ${dataTimestamp})`
        : `Detected ${safeConflicts.length} potential flood hazards along path. Proceed with caution.`,
    dataTimestamp,
    floodConflicts: safeConflicts,
    steps: safeSteps.length > 0 ? safeSteps : [
      {
        instructionTh: 'ออกเดินทางจากตำแหน่งปัจจุบันเข้าสู่ถนนหลัก',
        instructionEn: 'Depart from current location onto main arterial road',
        distanceMeters: 400,
        durationSeconds: 60,
        icon: 'straight',
      },
      {
        instructionTh: 'ขับตามแนวถนนสายหลัก หลีกเลี่ยงเส้นทางริมตลิ่ง',
        instructionEn: 'Follow main roadway, avoiding low riverfront avenues',
        distanceMeters: Math.round(safeDistance * 700),
        durationSeconds: Math.round(safeDuration * 45),
        icon: 'turn-right',
      },
      {
        instructionTh: `ถึงจุดหมาย: ${shelter.nameTh}`,
        instructionEn: `Arrive at destination: ${shelter.nameEn}`,
        distanceMeters: 100,
        durationSeconds: 30,
        icon: 'destination',
      },
    ],
    type: 'recommended_safe',
    elevationGainMeters: shelter.verificationStamp?.elevationMsl || 340,
  };

  const alternativeRoute: EvacuationRoute = {
    id: `route-direct-${shelter.id}`,
    nameTh: `เส้นทางตรงสั้นที่สุด`,
    nameEn: `Fastest Direct Route`,
    origin,
    destination,
    destinationShelterId: shelter.id,
    distanceKm: directDistance,
    durationMinutes: directDuration,
    coordinates: directCoords,
    hasFloodHazardOnRoute: directConflicts.length > 0,
    statusMessageTh:
      directConflicts.length > 0
        ? `ระวัง: เส้นทางนี้ตัดผ่านพื้นที่น้ำท่วม (${directConflicts[0].areaTitleTh})`
        : `ไม่พบจุดเสี่ยงน้ำท่วมในฐานข้อมูลบนเส้นทางนี้ (ข้อมูล GISTDA ณ ${dataTimestamp})`,
    statusMessageEn:
      directConflicts.length > 0
        ? `Warning: Route intersects flood hazard zone (${directConflicts[0].areaTitleTh})`
        : `No known flood area on this route (GISTDA data as of ${dataTimestamp})`,
    dataTimestamp,
    floodConflicts: directConflicts,
    steps: directOsrm?.steps || [],
    type: 'fastest_direct',
  };

  return { recommended: recommendedRoute, alternative: alternativeRoute };
}

// Find nearest shelter
export function findNearestShelters(
  origin: [number, number],
  shelters: Shelter[],
  limit = 5,
  typeFilter?: string
): (Shelter & { distanceKm: number })[] {
  let list = shelters;
  if (typeFilter && typeFilter !== 'all') {
    list = list.filter((s) => s.type === typeFilter);
  }

  const withDistances = list.map((s) => ({
    ...s,
    distanceKm: Math.round(haversineDistance(origin, [s.lat, s.lng]) * 10) / 10,
  }));

  withDistances.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  return withDistances.slice(0, limit);
}
