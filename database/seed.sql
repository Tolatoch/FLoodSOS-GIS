-- ==============================================================================
-- FloodSOS GIS - Database Seeds
-- ==============================================================================

-- 1. Insert 5 Provinces
INSERT INTO provinces (id, name_th, name_en, center_lat, center_lng, zoom_level, area_sq_km, population)
VALUES 
('chiang_mai', 'เชียงใหม่', 'Chiang Mai', 18.7904, 98.9847, 11, 20107, 1792000),
('chiang_rai', 'เชียงราย', 'Chiang Rai', 19.9072, 99.8325, 11, 11678, 1299000),
('phayao', 'พะเยา', 'Phayao', 19.1666, 99.9022, 11, 6335, 467000),
('nan', 'น่าน', 'Nan', 18.7756, 100.7730, 11, 11472, 476000),
('lampang', 'ลำปาง', 'Lampang', 18.2888, 99.4928, 11, 12534, 721000)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Initial Users (Passwords: admin123, officer123, user123 hashed)
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@floodsos.go.th', '$2b$12$e8.7l50e8s3sN4B5v6c7d8e9f0a1b2c3d4e5f6g7h8i9j0k1l2m3n', 'Admin GIS Center', 'admin'),
('b0000000-0000-0000-0000-000000000002', 'officer@ddpm.go.th', '$2b$12$e8.7l50e8s3sN4B5v6c7d8e9f0a1b2c3d4e5f6g7h8i9j0k1l2m3n', 'DDPM Northern Officer', 'staff'),
('c0000000-0000-0000-0000-000000000003', 'tolatuch081@gmail.com', '$2b$12$e8.7l50e8s3sN4B5v6c7d8e9f0a1b2c3d4e5f6g7h8i9j0k1l2m3n', 'Tolatuch User', 'user')
ON CONFLICT (email) DO NOTHING;

-- 3. Insert Flood Risk Polygons (PostGIS Geometry)
INSERT INTO flood_risk_areas 
(id, code, title_th, title_en, province_id, district_th, district_en, subdistrict_th, subdistrict_en, risk_level, gistda_status, water_depth_meters, affected_area_sq_km, affected_households, source, alert_note_th, geom)
VALUES
('fl-cm-01', 'GISTDA-CM-2401', 'เขตเทศบาลนครเชียงใหม่ - ย่านช้างคลานและไนท์บาซาร์', 'Chiang Mai City - Chang Khlan & Night Bazaar', 'chiang_mai', 'เมืองเชียงใหม่', 'Mueang Chiang Mai', 'ช้างคลาน', 'Chang Khlan', 'very_high', 'critical', 1.45, 4.8, 2850, 'GISTDA Flood Monitoring', 'ระดับน้ำปิงที่สถานี P.1 สะพานนวรัฐ เกินจุดวิกฤต', ST_GeomFromText('POLYGON((98.995 18.792, 99.010 18.790, 99.012 18.775, 98.998 18.773, 98.993 18.782, 98.995 18.792))', 4326)),

('fl-cr-01', 'GISTDA-CR-2401', 'อำเภอแม่สาย - ชุมชนตลาดสายลมจอยและเกาะทราย', 'Mae Sai - Sai Lom Joy & Koh Sai Border Community', 'chiang_rai', 'แม่สาย', 'Mae Sai', 'เวียงพางคำ', 'Wiang Phang Kham', 'very_high', 'critical', 1.80, 5.2, 3420, 'GISTDA Flood Monitoring', 'แม่น้ำสายล้นพนังกันน้ำ ดินโคลนไหลเข้าบ้านเรือน ประกาศอพยพด่วน', ST_GeomFromText('POLYGON((99.870 20.448, 99.895 20.445, 99.892 20.422, 99.868 20.425, 99.870 20.448))', 4326)),

('fl-nn-01', 'GISTDA-NN-2401', 'เทศบาลเมืองน่าน - ชุมชนในเวียง ย่านวัดภูมินทร์', 'Nan Municipality - Nai Wiang Old City & Phumin-Tha Li', 'nan', 'เมืองน่าน', 'Mueang Nan', 'ในเวียง', 'Nai Wiang', 'very_high', 'critical', 1.65, 5.1, 3100, 'GISTDA Flood Monitoring', 'ระดับน้ำแม่น้ำน่านเกินระดับวิกฤต 2.10 ม.', ST_GeomFromText('POLYGON((100.760 18.788, 100.785 18.785, 100.782 18.762, 100.758 18.764, 100.760 18.788))', 4326)),

('fl-py-01', 'GISTDA-PY-2401', 'เทศบาลเมืองพะเยา - แนวชายฝั่งรอบกว๊านพะเยา', 'Phayao Municipality - Kwan Phayao Lakefront', 'phayao', 'เมืองพะเยา', 'Mueang Phayao', 'เวียง', 'Wiang', 'moderate', 'watch', 0.55, 5.6, 1120, 'GISTDA Flood Monitoring', 'ระดับน้ำในกว๊านพะเยาเกินความจุเก็บกัก 104%', ST_GeomFromText('POLYGON((99.885 19.178, 99.915 19.175, 99.910 19.150, 99.882 19.155, 99.885 19.178))', 4326)),

('fl-lp-01', 'GISTDA-LP-2401', 'เทศบาลนครลำปาง - ชุมชนตลาดเก๊าจาวและสบตุ๋ย', 'Lampang Municipality - Kao Chao Market & Sob Tui', 'lampang', 'เมืองลำปาง', 'Mueang Lampang', 'สบตุ๋ย', 'Sob Tui', 'moderate', 'watch', 0.65, 4.5, 980, 'GISTDA Flood Monitoring', 'แม่น้ำวังระดับสูงขึ้นต่อเนื่อง น้ำเอ่อท่วมลานจอดรถ', ST_GeomFromText('POLYGON((99.480 18.300, 99.512 18.298, 99.510 18.275, 99.478 18.278, 99.480 18.300))', 4326))
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Safe Shelters (DDPM Points)
INSERT INTO shelters 
(id, name_th, name_en, type, province_id, district_th, district_en, subdistrict_th, subdistrict_en, address_th, capacity, current_occupants, status, contact_phone, facilities, geom)
VALUES
('sh-cm-01', 'ศูนย์ประชุมและแสดงสินค้านานาชาติฯ เชียงใหม่ (CMECC)', 'Chiang Mai Int. Exhibition and Convention Centre', 'government', 'chiang_mai', 'เมืองเชียงใหม่', 'Mueang Chiang Mai', 'ช้างเผือก', 'Chang Phueak', 'ถนนเลียบคลองชลประทาน ต.ช้างเผือก', 3500, 480, 'open', '053-010-572', ARRAY['medical', 'solar_power', 'drinking_water', 'kitchen', 'pet_friendly', 'helipad'], ST_SetSRID(ST_MakePoint(98.9615, 18.8272), 4326)),

('sh-cr-01', 'หอประชุมใหญ่ องค์การบริหารส่วนจังหวัดเชียงราย (อบจ.เชียงราย)', 'Chiang Rai PAO Grand Convention Auditorium', 'pao', 'chiang_rai', 'เมืองเชียงราย', 'Mueang Chiang Rai', 'ริมกก', 'Rim Kok', 'ศูนย์ราชการจังหวัดเชียงราย ต.ริมกก', 2500, 920, 'open', '053-175-333', ARRAY['medical', 'solar_power', 'kitchen', 'drinking_water', 'helipad'], ST_SetSRID(ST_MakePoint(99.8550, 19.9320), 4326)),

('sh-py-01', 'อาคารสงวนเสริมศรี มหาวิทยาลัยพะเยา (UP Convention Hall)', 'University of Phayao Sa-nguan Sermsri Hall', 'university', 'phayao', 'เมืองพะเยา', 'Mueang Phayao', 'แม่กา', 'Mae Ka', '19 หมู่ 2 ถ.พหลโยธิน ต.แม่กา', 2200, 380, 'open', '054-466-666', ARRAY['medical', 'solar_power', 'kitchen', 'drinking_water', 'large_parking'], ST_SetSRID(ST_MakePoint(99.8970, 19.0300), 4326)),

('sh-nn-01', 'ศูนย์กีฬาและนันทนาการ อบจ.น่าน', 'Nan PAO Sports & Recreation Center Complex', 'pao', 'nan', 'เมืองน่าน', 'Mueang Nan', 'ผาสิงห์', 'Pha Sing', 'ศูนย์ราชการจังหวัดน่าน ต.ผาสิงห์', 2000, 870, 'open', '054-771-555', ARRAY['medical', 'solar_power', 'kitchen', 'drinking_water', 'helipad'], ST_SetSRID(ST_MakePoint(100.7850, 18.8050), 4326)),

('sh-lp-01', 'อาคารหอประชุมศาลากลางจังหวัดลำปาง', 'Lampang Provincial City Hall Main Auditorium', 'government', 'lampang', 'เมืองลำปาง', 'Mueang Lampang', 'พระบาท', 'Phra Bat', 'ถ.วชิราวุธดำเนิน ต.พระบาท', 2200, 290, 'open', '054-265-014', ARRAY['medical', 'solar_power', 'kitchen', 'drinking_water', 'large_parking'], ST_SetSRID(ST_MakePoint(99.5350, 18.2720), 4326))
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Road Network Topology Sample for pgRouting
INSERT INTO road_network (osm_id, source, target, cost, reverse_cost, speed_kmh, highway_type, flood_penalty, geom)
VALUES
(1001, 1, 2, 450.0, 450.0, 60.0, 'primary', 1.0, ST_GeomFromText('LINESTRING(98.985 18.790, 98.975 18.805)', 4326)),
(1002, 2, 3, 620.0, 620.0, 60.0, 'primary', 1.0, ST_GeomFromText('LINESTRING(98.975 18.805, 98.965 18.820)', 4326)),
(1003, 3, 4, 380.0, 380.0, 50.0, 'secondary', 1.0, ST_GeomFromText('LINESTRING(98.965 18.820, 98.9615 18.8272)', 4326)),
(1004, 1, 5, 800.0, 800.0, 40.0, 'residential', 5.0, ST_GeomFromText('LINESTRING(98.985 18.790, 99.002 18.783)', 4326)); -- Flooded penalty 5.0x
