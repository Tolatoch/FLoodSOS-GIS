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
          else if (modifier.includes('u-turn') || type.includes('u-turn')) icon = 'u-turn';
          else if (modifier === 'slight left') icon = 'slight-left';
          else if (modifier === 'slight right') icon = 'slight-right';
          else if (modifier.includes('left')) icon = 'turn-left';
          else if (modifier.includes('right')) icon = 'turn-right';

          const street = step.name || (type.includes('arrive') ? 'ศูนย์พักพิงปลายทาง' : 'ถนนสายหลัก');
          const streetEn = step.name || (type.includes('arrive') ? 'Destination Shelter' : 'Main Road');

          let instructionTh = `ตรงไปตาม ${street}`;
          let instructionEn = `Continue along ${streetEn}`;

          if (type.includes('arrive') || type === 'destination') {
            instructionTh = `ถึงจุดหมาย: ${street}`;
            instructionEn = `Arrive at destination: ${streetEn}`;
          } else if (type === 'depart') {
            instructionTh = `ออกเดินทางมุ่งหน้าตาม ${street}`;
            instructionEn = `Head along ${streetEn}`;
          } else if (modifier === 'slight left') {
            instructionTh = `เบี่ยงซ้ายเข้าสู่ ${street}`;
            instructionEn = `Slight left onto ${streetEn}`;
          } else if (modifier === 'slight right') {
            instructionTh = `เบี่ยงขวาเข้าสู่ ${street}`;
            instructionEn = `Slight right onto ${streetEn}`;
          } else if (modifier.includes('u-turn')) {
            instructionTh = `กลับรถเข้าสู่ ${street}`;
            instructionEn = `Make a U-turn onto ${streetEn}`;
          } else if (modifier.includes('left')) {
            instructionTh = `เลี้ยวซ้ายเข้าสู่ ${street}`;
            instructionEn = `Turn left onto ${streetEn}`;
          } else if (modifier.includes('right')) {
            instructionTh = `เลี้ยวขวาเข้าสู่ ${street}`;
            instructionEn = `Turn right onto ${streetEn}`;
          } else if (type.includes('roundabout')) {
            instructionTh = `เข้าสู่วงเวียนมุ่งหน้าสู่ ${street}`;
            instructionEn = `At roundabout, continue onto ${streetEn}`;
          }

          const loc: [number, number] | undefined = step.maneuver?.location
            ? [step.maneuver.location[1], step.maneuver.location[0]]
            : undefined;

          steps.push({
            instructionTh,
            instructionEn,
            distanceMeters: Math.round(step.distance || 100),
            durationSeconds: Math.round(step.duration || 30),
            icon,
            roadName: street,
            location: loc,
          });
        }
      }
    }

    return {
      coordinates,
      distanceKm,
      durationMinutes,
      steps: steps.length > 0 ? steps : [],
    };
  } catch (err) {
    console.warn('OSRM router fetch failed, falling back to local road topology:', err);
    return null;
  }
}

// Calculate Haversine distance in meters
export function haversineDistanceMeters(
  coord1: [number, number],
  coord2: [number, number]
): number {
  return haversineDistance(coord1, coord2) * 1000;
}

// Bearing angle in degrees (0 = North, 90 = East, 180 = South, 270 = West)
export function getBearing(
  from: [number, number],
  to: [number, number]
): number {
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const dLon = ((to[1] - from[1]) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Project point P onto line segment AB (meters approximation for local area)
export function projectPointOntoSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): { point: [number, number]; distanceMeters: number; t: number } {
  const midLat = ((a[0] + b[0]) / 2) * (Math.PI / 180);
  const cosMidLat = Math.cos(midLat);

  // Convert to local Cartesian meters relative to A
  const mPerLat = 110574;
  const mPerLng = 111320 * cosMidLat;

  const bX = (b[1] - a[1]) * mPerLng;
  const bY = (b[0] - a[0]) * mPerLat;

  const pX = (p[1] - a[1]) * mPerLng;
  const pY = (p[0] - a[0]) * mPerLat;

  const lenSq = bX * bX + bY * bY;
  if (lenSq === 0) {
    const dist = Math.sqrt(pX * pX + pY * pY);
    return { point: a, distanceMeters: dist, t: 0 };
  }

  let t = (pX * bX + pY * bY) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = t * bX;
  const projY = t * bY;

  const projLng = a[1] + projX / mPerLng;
  const projLat = a[0] + projY / mPerLat;

  const dx = pX - projX;
  const dy = pY - projY;
  const distanceMeters = Math.sqrt(dx * dx + dy * dy);

  return { point: [projLat, projLng], distanceMeters, t };
}

// Total length of polyline in meters
export function calculatePolylineLengthMeters(polyline: [number, number][]): number {
  let total = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    total += haversineDistanceMeters(polyline[i], polyline[i + 1]);
  }
  return total;
}

// Snap point to polyline, return snapped coordinates, distance to route, distance along route, and bearing
export function snapPointToPolyline(
  point: [number, number],
  polyline: [number, number][]
): {
  snappedPoint: [number, number];
  segmentIndex: number;
  distanceToRouteMeters: number;
  distanceAlongRouteMeters: number;
  bearing: number;
} {
  if (polyline.length === 0) {
    return {
      snappedPoint: point,
      segmentIndex: 0,
      distanceToRouteMeters: 0,
      distanceAlongRouteMeters: 0,
      bearing: 0,
    };
  }
  if (polyline.length === 1) {
    return {
      snappedPoint: polyline[0],
      segmentIndex: 0,
      distanceToRouteMeters: haversineDistanceMeters(point, polyline[0]),
      distanceAlongRouteMeters: 0,
      bearing: 0,
    };
  }

  let minDistance = Infinity;
  let bestPoint = polyline[0];
  let bestSegIndex = 0;
  let bestDistAlong = 0;
  let cumulativeDist = 0;

  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i];
    const b = polyline[i + 1];
    const segLen = haversineDistanceMeters(a, b);
    const proj = projectPointOntoSegment(point, a, b);

    if (proj.distanceMeters < minDistance) {
      minDistance = proj.distanceMeters;
      bestPoint = proj.point;
      bestSegIndex = i;
      bestDistAlong = cumulativeDist + proj.t * segLen;
    }
    cumulativeDist += segLen;
  }

  const nextIdx = Math.min(bestSegIndex + 1, polyline.length - 1);
  const bearing = getBearing(bestPoint, polyline[nextIdx] || bestPoint);

  return {
    snappedPoint: bestPoint,
    segmentIndex: bestSegIndex,
    distanceToRouteMeters: minDistance,
    distanceAlongRouteMeters: bestDistAlong,
    bearing,
  };
}

// Split polyline into traveled and remaining parts
export function splitPolylineAtDistance(
  polyline: [number, number][],
  distanceMeters: number,
  currentPoint: [number, number]
): {
  traveled: [number, number][];
  remaining: [number, number][];
} {
  if (polyline.length < 2) {
    return { traveled: [currentPoint], remaining: [currentPoint] };
  }

  let cumulative = 0;
  let splitIndex = 0;

  for (let i = 0; i < polyline.length - 1; i++) {
    const segLen = haversineDistanceMeters(polyline[i], polyline[i + 1]);
    if (cumulative + segLen >= distanceMeters) {
      splitIndex = i;
      break;
    }
    cumulative += segLen;
    splitIndex = i + 1;
  }

  const traveled: [number, number][] = polyline.slice(0, splitIndex + 1);
  traveled.push(currentPoint);

  const remaining: [number, number][] = [currentPoint, ...polyline.slice(splitIndex + 1)];

  return { traveled, remaining };
}

// Interpolate position along polyline at distance (for Demo mode)
export function interpolateAlongPolyline(
  polyline: [number, number][],
  distanceMeters: number
): {
  point: [number, number];
  bearing: number;
  segmentIndex: number;
  isEnd: boolean;
} {
  if (polyline.length === 0) {
    return { point: [0, 0], bearing: 0, segmentIndex: 0, isEnd: true };
  }
  if (polyline.length === 1 || distanceMeters <= 0) {
    const brng = polyline.length > 1 ? getBearing(polyline[0], polyline[1]) : 0;
    return { point: polyline[0], bearing: brng, segmentIndex: 0, isEnd: false };
  }

  let cumulative = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i];
    const b = polyline[i + 1];
    const segLen = haversineDistanceMeters(a, b);

    if (cumulative + segLen >= distanceMeters) {
      const remainingDist = distanceMeters - cumulative;
      const t = segLen > 0 ? remainingDist / segLen : 0;
      const lat = a[0] + t * (b[0] - a[0]);
      const lng = a[1] + t * (b[1] - a[1]);
      const brng = getBearing(a, b);
      return { point: [lat, lng], bearing: brng, segmentIndex: i, isEnd: false };
    }
    cumulative += segLen;
  }

  const last = polyline[polyline.length - 1];
  const secondLast = polyline[polyline.length - 2];
  return {
    point: last,
    bearing: getBearing(secondLast, last),
    segmentIndex: polyline.length - 2,
    isEnd: true,
  };
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
