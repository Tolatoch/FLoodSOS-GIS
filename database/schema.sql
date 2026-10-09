-- ==============================================================================
-- FloodSOS GIS - Database Schema (PostgreSQL 16 + PostGIS 3.4 + pgRouting)
-- Study Area: 5 Upper-Northern Provinces (Chiang Mai, Chiang Rai, Phayao, Nan, Lampang)
-- ==============================================================================

-- 1. Enable Spatial Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS pgrouting;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enumerated Types
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'user', 'guest');
CREATE TYPE flood_risk_level AS ENUM ('very_low', 'low', 'moderate', 'high', 'very_high');
CREATE TYPE gistda_status AS ENUM ('normal', 'watch', 'warning', 'critical');
CREATE TYPE shelter_type AS ENUM (
    'government',
    'school',
    'university',
    'temple',
    'tao',
    'municipality',
    'pao'
);
CREATE TYPE shelter_status AS ENUM ('open', 'standby', 'full');

-- 3. Provinces Table (Upper Northern Thailand)
CREATE TABLE provinces (
    id VARCHAR(32) PRIMARY KEY, -- 'chiang_mai', 'chiang_rai', etc.
    name_th VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    center_lat DOUBLE PRECISION NOT NULL,
    center_lng DOUBLE PRECISION NOT NULL,
    zoom_level INT DEFAULT 11,
    area_sq_km DOUBLE PRECISION,
    population INT,
    boundary GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_provinces_geom ON provinces USING GIST(boundary);

-- 4. Users Table & Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);

-- 5. Flood Risk Areas Table (GISTDA satellite & hydrological data)
CREATE TABLE flood_risk_areas (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    title_th VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    province_id VARCHAR(32) REFERENCES provinces(id) ON DELETE CASCADE,
    district_th VARCHAR(100) NOT NULL,
    district_en VARCHAR(100) NOT NULL,
    subdistrict_th VARCHAR(100),
    subdistrict_en VARCHAR(100),
    risk_level flood_risk_level NOT NULL,
    gistda_status gistda_status NOT NULL,
    water_depth_meters DOUBLE PRECISION DEFAULT 0.0,
    affected_area_sq_km DOUBLE PRECISION DEFAULT 0.0,
    affected_households INT DEFAULT 0,
    source VARCHAR(100) DEFAULT 'GISTDA Flood Monitoring',
    alert_note_th TEXT,
    alert_note_en TEXT,
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- GiST spatial index for high-speed point-in-polygon & spatial intersections
CREATE INDEX idx_flood_risk_areas_geom ON flood_risk_areas USING GIST(geom);
CREATE INDEX idx_flood_risk_areas_province ON flood_risk_areas(province_id);
CREATE INDEX idx_flood_risk_areas_level ON flood_risk_areas(risk_level);

-- 6. Safe Shelters Table (DDPM CKAN catalog.disaster.go.th)
CREATE TABLE shelters (
    id VARCHAR(64) PRIMARY KEY,
    name_th VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    type shelter_type NOT NULL,
    province_id VARCHAR(32) REFERENCES provinces(id) ON DELETE CASCADE,
    district_th VARCHAR(100) NOT NULL,
    district_en VARCHAR(100) NOT NULL,
    subdistrict_th VARCHAR(100),
    subdistrict_en VARCHAR(100),
    address_th TEXT,
    address_en TEXT,
    capacity INT NOT NULL,
    current_occupants INT DEFAULT 0,
    status shelter_status DEFAULT 'open',
    contact_phone VARCHAR(50),
    facilities TEXT[], -- e.g. ARRAY['medical', 'solar_power', 'kitchen']
    source VARCHAR(100) DEFAULT 'DDPM Open Data CKAN',
    geom GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_capacity CHECK (current_occupants <= capacity)
);
CREATE INDEX idx_shelters_geom ON shelters USING GIST(geom);
CREATE INDEX idx_shelters_province ON shelters(province_id);
CREATE INDEX idx_shelters_type ON shelters(type);

-- 7. OSM Road Network Topology for pgRouting
CREATE TABLE road_network (
    id BIGSERIAL PRIMARY KEY,
    osm_id BIGINT,
    source BIGINT, -- topology node start
    target BIGINT, -- topology node end
    cost DOUBLE PRECISION, -- length in meters or travel time
    reverse_cost DOUBLE PRECISION,
    speed_kmh DOUBLE PRECISION DEFAULT 50.0,
    highway_type VARCHAR(50),
    flood_penalty DOUBLE PRECISION DEFAULT 1.0, -- multiplier when intersecting flood zones
    geom GEOMETRY(LineString, 4326) NOT NULL
);
CREATE INDEX idx_road_network_geom ON road_network USING GIST(geom);
CREATE INDEX idx_road_network_source ON road_network(source);
CREATE INDEX idx_road_network_target ON road_network(target);

-- 8. Chat & AI Agent Logs
CREATE TABLE chat_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    user_message TEXT NOT NULL,
    agent_response TEXT NOT NULL,
    spatial_tools_called JSONB,
    map_action_dispatched JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_chat_logs_session ON chat_logs(session_id);

-- 9. Audit Logs Table (Admin activity trail)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(150),
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details_th TEXT,
    details_en TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(created_at DESC);

-- 10. Spatial Stored Procedures: Evacuation Route via pgRouting
-- Calculates optimal route avoiding high flood zones
CREATE OR REPLACE FUNCTION get_safe_evacuation_route(
    start_lat DOUBLE PRECISION,
    start_lng DOUBLE PRECISION,
    dest_shelter_id VARCHAR(64),
    avoid_flood BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    seq INT,
    node BIGINT,
    edge BIGINT,
    cost DOUBLE PRECISION,
    agg_cost DOUBLE PRECISION,
    geom GEOMETRY
) AS $$
DECLARE
    start_node BIGINT;
    end_node BIGINT;
    shelter_geom GEOMETRY;
BEGIN
    -- 1. Find nearest road node to start location
    SELECT source INTO start_node
    FROM road_network
    ORDER BY geom <-> ST_SetSRID(ST_MakePoint(start_lng, start_lat), 4326)
    LIMIT 1;

    -- 2. Find shelter geometry & nearest road node to destination
    SELECT shelters.geom INTO shelter_geom FROM shelters WHERE id = dest_shelter_id;
    SELECT target INTO end_node
    FROM road_network
    ORDER BY geom <-> shelter_geom
    LIMIT 1;

    -- 3. Run pgr_dijkstra with flood penalty applied
    RETURN QUERY
    SELECT 
        d.seq, 
        d.node, 
        d.edge, 
        d.cost, 
        d.agg_cost, 
        r.geom
    FROM pgr_dijkstra(
        'SELECT id, source, target, 
         CASE WHEN ' || avoid_flood || ' AND flood_penalty > 1.0 THEN cost * flood_penalty ELSE cost END AS cost,
         CASE WHEN ' || avoid_flood || ' AND flood_penalty > 1.0 THEN reverse_cost * flood_penalty ELSE reverse_cost END AS reverse_cost
         FROM road_network',
        start_node, end_node, directed := false
    ) d
    LEFT JOIN road_network r ON d.edge = r.id;
END;
$$ LANGUAGE plpgsql;
