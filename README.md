# NiramayAI - AI-Driven Health Center & Supply Chain Management

NiramayAI is a bilingual, dark/light theme, high-performance district command platform built to bridge operational gaps at Community Health Centers (CHCs) and Primary Health Centers (PHCs). By consolidating tracking for medicine stocks, diagnostic test audits, bed occupancies, and biometric staff attendance, the platform detects local resource bottlenecks, alerts district administrators to physician absences, and provides automated, AI-driven stock-out forecasts and geographic redistribution matching.

---

## Key Features

1. **AI Demand Forecasting**: Uses historical stock consumption logs to compute daily consumption velocities via linear regression models. Projects a 15-day forward depletion curve and flags predicted stock-out timelines.
2. **Smart Redistribution Routing**: Detects local supply deficits and matches them against nearby health centers with safe surpluses. Calculates routes using the **Haversine Distance Formula** and proposes precise transfer quantities.
3. **Real-time Bed Logistics**: Logs occupancy statuses for General, ICU, and Oxygen beds with automated congestion warning thresholds.
4. **Biometric Attendance Tracking**: Logs biometric card clock-ins/outs and generates alert banners visible to district admins if scheduled medical officers are absent.
5. **Bilingual Support (Hindi & English)**: Complete inline translation dictionary for Hindi and English across all UI menus, cards, forecasting charts, and forms.
6. **Double Theme (Dark & Light Mode)**: Visual toggle next to the notifications tray adjusting canvas particles, chart grids, panels, tables, and buttons dynamically.

---

## Technology Stack

- **Frontend**: React (Vite SPA) + Tailwind CSS + Framer Motion (animations) + Three.js (3D undulating wave background grid) + Recharts (demand/depletion visualization).
- **Backend**: Node.js + Express REST API.
- **ORM & DB**: Prisma ORM with PostgreSQL database integration.
- **Containerization**: Docker & Docker Compose.
- **Database Client**: Adminer (PostgreSQL web administration dashboard).

---

## Access Points

Once container orchestration is active, access the services using the following URLs:

| Service | Address | Description |
| :--- | :--- | :--- |
| **Web Frontend Client** | `http://localhost:3000` | Vite React developer app dashboard |
| **REST Backend API Server** | `http://localhost:5000` | Node.js Express server (`/api/health` check) |
| **Adminer Client** | `http://localhost:8080` | PostgreSQL db explorer client |

---

## Setup & Running Guide (Dockerized)

Ensure you have **Docker** and **Docker Compose** installed on your operating system.

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd Smart-Health-AI-Driven-Health-Center-Supply-Chain-Management
```

### Step 2: Build and Run Containers
Orchestrate the full stack (database, backend server, React client, and Adminer client) in one command:
```bash
docker-compose up -d --build
```
This builds service layers, initializes network bridges, and provisions PostgreSQL volumes.

### Step 3: Run Database Migrations
Provision the PostgreSQL database tables using Prisma's CLI inside the backend container:
```bash
docker-compose exec backend npx prisma migrate deploy
```

### Step 4: Seed the Database
Populate health center coordinates, mock doctor credentials, biometric Punch Logs, and 30 days of inventory consumption histories:
```bash
docker-compose exec backend node prisma/seed.js
```

---

## Seed Credentials & Roles

The seeder creates **5 health centers** (1 CHC, 4 PHCs) and **10 registered user accounts**. Log in to the system at `http://localhost:3000` using any of the credentials below:

### 1. District Administrator Role (Full Cross-Center Overview)
- **Email**: `admin@smarthealth.gov.in`
- **Password**: `admin123`
- **Permissions**: Can overview all district health centers, check flagged center warnings, inspect inventory levels, view proposed redistributions, approve transfers, and override center perspective views.

### 2. Primary Health Center (PHC Pipariya) Staff Roster
- **Pharmacist / Staff**:
  - **Email**: `pipariya_staff@smarthealth.gov.in`
  - **Password**: `staff123`
- **Doctor (Medical Officer)**:
  - **Email**: `pipariya_doc@smarthealth.gov.in`
  - **Password**: `doc123`

### 3. Community Health Center (CHC Rampur) Staff Roster
- **Pharmacist / Staff**:
  - **Email**: `rampur_staff@smarthealth.gov.in`
  - **Password**: `staff123`
- **Doctor (Medical Officer)**:
  - **Email**: `rampur_doc@smarthealth.gov.in`
  - **Password**: `doc123`

---

## Local Development (Without Docker)

If you prefer to run the components locally for development, configure environment variables:

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure a `.env` file containing your Postgres URL:
   ```env
   DATABASE_URL="postgresql://postgres:postgres_secure_pass_123@localhost:5432/smart_health?schema=public"
   JWT_SECRET="super_secret_key_for_ai_health_center_management"
   PORT=5000
   ```
4. Perform migrations and seed:
   ```bash
   npx prisma migrate dev --name init
   node prisma/seed.js
   ```
5. Start the backend:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start Vite dev server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

---

## Database Management via Adminer
To browse rows, verify relationships, or audit transactions using a graphical web browser UI:
1. Navigate to: `http://localhost:8080`
2. Enter database credentials:
   - **System**: `PostgreSQL`
   - **Server**: `db`
   - **Username**: `postgres`
   - **Password**: `postgres_secure_pass_123`
   - **Database**: `smart_health`
3. Click **Login** to inspect the table records.
