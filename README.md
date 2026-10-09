# FloodSOS GIS - ระบบสารสนเทศภูมิศาสตร์วิเคราะห์น้ำท่วมและเส้นทางอพยพ 5 จังหวัดภาคเหนือ

FloodSOS GIS เป็นระบบสารสนเทศภูมิศาสตร์บนเว็บ (Web GIS) สำหรับวิเคราะห์พื้นที่เสี่ยงอุทกภัย ค้นหาศูนย์พักพิงปลอดภัย และวางแผนเส้นทางอพยพฉุกเฉิน ครอบคลุมพื้นที่ศึกษา 5 จังหวัดภาคเหนือตอนบน ได้แก่ **เชียงใหม่, เชียงราย, พะเยา, น่าน, ลำปาง** โดยจำลองโครงสร้างและปฏิสัมพันธ์จาก GISTDA Flood Portal (https://disaster.gistda.or.th/flood) พร้อมระบบ AI Agent ที่เชื่อมต่อฐานข้อมูลเชิงพื้นที่ (PostGIS)

---

## 1. ผังโครงสร้างโครงการ (Project Structure)

```
floodsos-gis/
├── backend/                      # Python FastAPI REST API Backend
│   ├── main.py                   # FastAPI app, CORS, OpenAPI router, endpoints
│   ├── database.py               # SQLAlchemy + PostGIS connection engine
│   ├── models.py                 # PostGIS spatial models (GeoAlchemy2)
│   ├── auth.py                   # JWT Auth, bcrypt/argon2 hashing, RBAC
│   ├── routing.py                # pgRouting Dijkstra topology solver
│   ├── agent.py                  # LangChain + Gemini 3.8 Flash Spatial Agent
│   ├── requirements.txt          # Python dependencies
│   └── Dockerfile                # Backend container definition
├── database/                     # PostgreSQL + PostGIS + pgRouting
│   ├── schema.sql                # DDL schema, GiST spatial indexes, topology, views
│   ├── seed.sql                  # Seed data for 5 provinces, flood polygons, DDPM shelters
│   └── import_data.py            # Automated ingestion from DDPM CKAN & GISTDA APIs
├── src/                          # Web GIS Frontend (React 19 + TypeScript + Leaflet)
│   ├── components/
│   │   ├── Navbar.tsx            # Floating search bar, province picker, auth, TH/EN toggle
│   │   ├── MapView.tsx           # Leaflet map, layers (flood polygons, rivers, shelters, routes)
│   │   ├── LayerControl.tsx      # Floating layer switcher & basemap selector
│   │   ├── MapLegend.tsx         # 5-level flood risk legend & GISTDA status mapping
│   │   ├── FloodDetailModal.tsx  # Click-for-detail popup with nearest shelter & route trigger
│   │   ├── ShelterFinderPanel.tsx# GPS nearest shelter finder, type filters, capacity bars
│   │   ├── EvacuationRoutePanel.tsx # Route cards, alternative comparison, turn-by-turn directions
│   │   ├── DashboardView.tsx     # Chart.js statistics, risk bar chart, doughnut, summary cards
│   │   ├── AIAgentDrawer.tsx     # LangChain + Gemini natural language spatial chat
│   │   ├── AuthModal.tsx         # Sign in, Sign up, Guest mode
│   │   └── Admin/
│   │       ├── AdminLayout.tsx   # Admin sidebar & portal router
│   │       ├── AdminDashboard.tsx# Telemetry, user count, system metrics
│   │       ├── ManageFloodRisk.tsx# Flood risk CRUD & GISTDA API sync
│   │       ├── ManageShelters.tsx# DDPM shelters CRUD & coordinate boundary validation
│   │       ├── UserManagement.tsx# RBAC roles management
│   │       └── AuditLogsView.tsx # Security audit trail
│   ├── data/                     # GeoJSON spatial datasets & translations dictionary
│   ├── services/                 # API client & routing engine simulation
│   └── types/                    # TypeScript interfaces
├── docker-compose.yml            # Multi-container orchestration (PostGIS, FastAPI, Web GIS)
├── server.ts                     # Full-stack Node/Express dev runtime with Vite middlewares
└── README.md                     # Documentation & Screenshot Checklist
```

---

## 2. วิธีการติดตั้งและรันระบบ (Setup & Run Instructions)

### วิธีที่ 1: รันด้วย Docker Compose (แนะนำสำหรับการส่งมอบสมบูรณ์)
```bash
# 1. คัดลอกและตั้งค่า Environment Variables
cp .env.example .env

# 2. สตาร์ตทุกเซอร์วิส (PostGIS 16, pgRouting, FastAPI, Web GIS)
docker-compose up --build -d

# 3. เข้าใช้งานระบบ:
# - Web GIS Application: http://localhost:3000
# - FastAPI OpenAPI Documentation: http://localhost:8000/docs
# - PostGIS Database: localhost:5432 (Database: floodsos_db, User: floodsos)
```

### วิธีที่ 2: รันในเครื่อง (Local Development)
```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. สตาร์ต Full-Stack Dev Server (Express + Vite + Gemini 3.8 Flash)
npm run dev

# เข้าใช้งานที่: http://localhost:3000
```

---

## 3. แหล่งข้อมูลเชิงพื้นที่ (Spatial Data Sources)
1. **พื้นที่เสี่ยงอุทกภัย (Flood Risk Zones)**: ข้อมูลภาพถ่ายดาวเทียมตรวจวัดน้ำท่วม GISTDA ผสานระดับน้ำจากเกจวัดน้ำหลัก (สถานี P.1 เชียงใหม่, N.1 น่าน, แม่น้ำสาย แม่สาย ฯลฯ) จำแนก 5 ระดับ:
   - *Very Low (ต่ำมาก)*: เขียว (ปกติ)
   - *Low (ต่ำ)*: เหลือง (เฝ้าระวังเบื้องต้น)
   - *Moderate (ปานกลาง)*: ส้ม (เฝ้าระวัง)
   - *High (สูง)*: แดง (เตือนภัย)
   - *Very High (สูงมาก / วิกฤต)*: ม่วง (น้ำท่วมขังเกินวิกฤต ล้นตลิ่ง)
2. **ศูนย์พักพิงปลอดภัย (Safe Shelters)**: ข้อมูล ปภ. (DDPM Open Data จาก catalog.disaster.go.th) กรองเฉพาะ 5 จังหวัดตอนบน แบ่งเป็น 7 ประเภท: อาคารอเนกประสงค์รัฐ, โรงเรียน, มหาวิทยาลัย, วัด, อบต., เทศบาล, อบจ.
3. **โครงข่ายถนนและระบบนำทาง (OSM & pgRouting)**: ถนน OpenStreetMap สร้าง Topology บน PostGIS พร้อมคำนวณถ่วงน้ำหนัก (Penalty 5.0x) หลีกเลี่ยงเส้นทางที่ตัดผ่านพื้นที่น้ำท่วมระดับ High และ Very High

---

## 4. รายการตรวจสอบภาพหน้าจอระบบ 10 หน้าจอ (Screenshot Checklist: Figures 1-10)

| Figure | รายการหน้าจอ (Screen) | คำอธิบายและองค์ประกอบสำคัญ |
|---|---|---|
| **Fig 1** | **Main Map View** | แผนที่ Leaflet แบบเต็มจอ (Full Viewport) ปักหมุด 5 จังหวัด ล็อกขอบเขตภาคเหนือตอนบน แถบค้นหาลอยตัว (Search Bar) ปุ่มสลับชั้นข้อมูล (Layers Control) สลับแผนที่ฐาน (Street/Terrain/Satellite) คำอธิบายสัญลักษณ์ (Legend) และปุ่มค้นหาตำแหน่ง GPS ของฉัน |
| **Fig 2** | **Flood Risk Detail** | หน้าต่างป๊อปอัปและแถบด้านข้างเมื่อคลิกจุดเสี่ยงน้ำท่วม แสดงระดับความเสี่ยง (Risk Level), ระดับน้ำคาดการณ์ (เมตร), จำนวนครัวเรือนที่เสี่ยงภัย, พิกัด Lat/Lng, ศูนย์พักพิงที่ใกล้ที่สุด และปุ่ม "นำทางไปยังศูนย์พักพิงนี้" |
| **Fig 3** | **Find Safe Shelter** | แผงค้นหาศูนย์พักพิงใกล้ตัว กรองตามประเภท (โรงเรียน/วัด/อบต./มหาวิทยาลัย) แสดงแถบความจุผู้พักพิง (Capacity Bar) สิ่งอำนวยความสะดวก (ไฟสำรอง, แพทย์ฉุกเฉิน, โรงครัว) และเบอร์ติดต่อสายด่วน ปภ. |
| **Fig 4** | **Emergency Route** | การ์ดเส้นทางอพยพเปรียบเทียบ 2 ทางเลือก: **เส้นทางแนะนำ (ปลอดภัย 100% เลี่ยงแนวน้ำท่วม)** vs **เส้นทางตรง (แจ้งเตือนจุดเสี่ยงตัดผ่านน้ำท่วม)** พร้อมระยะทาง (กม.), เวลาเดินทางคาดการณ์, และคำแนะนำทีละเลี้ยว (Turn-by-Turn) |
| **Fig 5** | **Dashboard View** | แดชบอร์ดสรุปสถานการณ์ด้วย Chart.js แสดง Bar Chart สัดส่วนพื้นที่เสี่ยงแยกตามจังหวัด, Doughnut Chart สัดส่วนความเสี่ยง 5 ระดับ, Summary Cards 5 ใบ และตารางเปรียบเทียบ 5 จังหวัด |
| **Fig 6** | **AI Agent Chat** | แช็ตสนทนาธรรมชาติ (TH/EN) ขับเคลื่อนด้วย LangChain + Gemini 3.8 Flash แสดง Badge การเรียกใช้ Spatial DB Tools แบบ Read-Only และปุ่ม Interactive สั่งการแผนที่ (ซูม/ไฮไลต์/วาดเส้นทางอพยพ) |
| **Fig 7** | **Admin Login** | ฟอร์มเข้าสู่ระบบเจ้าหน้าที่ (Admin Portal) แยกเส้นทาง พร้อมการยืนยันรหัสผ่านแบบแฮช (bcrypt/argon2) และ JWT Access Token |
| **Fig 8** | **Admin Dashboard** | แดชบอร์ดผู้ดูแลระบบ แสดงสถิติผู้ใช้งานทั้งหมด, ผู้ใช้ออนไลน์, จุดเสี่ยงในระบบ, สถานะการเชื่อมต่อ PostGIS, และสถานะ Data Sync API |
| **Fig 9** | **Manage Flood-Risk Data** | ตารางจัดการข้อมูลพื้นที่เสี่ยงอุทกภัย (CRUD) พร้อมปุ่มซิงค์ข้อมูลสดจาก GISTDA Flood API และช่องค้นหากรองข้อมูล |
| **Fig 10** | **Manage Safe Shelters** | ตารางและระบบเพิ่ม/แก้ไขศูนย์พักพิง ปภ. (CRUD) พร้อมระบบ Data Validation ตรวจสอบพิกัดให้อยู่ในขอบเขต 5 จังหวัดภาคเหนือ และปุ่มเชื่อมต่อ DDPM CKAN API |

---

## 5. การรับรองความปลอดภัย (Security & Injection Safeguards)
- **SQL Injection Guard**: ใช้ Parameterized Queries บน SQLAlchemy / PostGIS และการเรียกใช้ผ่าน ORM ทั้งหมด
- **Prompt Injection Guard**: AI Agent ทำงานผ่าน Whitelisted Read-Only Function Tools ไม่เปิดรับ raw SQL query จากผู้ใช้โดยตรง
- **Role-Based Access Control (RBAC)**: แยกสิทธิ์การเข้าถึงระหว่าง Guest, User, Staff และ Admin อย่างเคร่งครัด
