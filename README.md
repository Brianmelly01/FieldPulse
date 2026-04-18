# 🌱 FieldPulse — SmartSeason Field Monitoring System

A full-stack web application for tracking crop progress across multiple fields during a growing season. Built with **Node.js/Express + SQLite** on the backend and **React + Vite** on the frontend.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ and npm

### 1. Install all dependencies

```bash
# From the root FieldPulse directory
npm install
npm run install:all
```

### 2. Seed the database with demo data

```bash
npm run seed
```

### 3. Start both server and client

```bash
npm run dev
```

- **Frontend** → http://localhost:5173
- **Backend API** → http://localhost:5000

---

## 🔑 Demo Credentials

| Role        | Name              | Email                         | Password   |
|-------------|-------------------|-------------------------------|------------|
| 🌟 Admin    | Dr. Kofi Mensah   | coordinator@fieldpulse.com    | admin123   |
| 🌟 Admin    | Sarah Owusu       | sarah@fieldpulse.com          | admin123   |
| 🌾 Agent    | James Asante      | james@fieldpulse.com          | agent123   |
| 🌾 Agent    | Amara Diallo      | amara@fieldpulse.com          | agent123   |
| 🌾 Agent    | Kwame Boateng     | kwame@fieldpulse.com          | agent123   |

> 💡 On the Login page, click **"Use →"** next to any credential to auto-fill the form.

---

## 🏗️ Architecture

```
FieldPulse/
├── server/                    # Express API
│   ├── index.js               # Entry point
│   ├── database/
│   │   ├── db.js              # SQLite schema + init
│   │   └── seed.js            # Demo data seeder
│   ├── middleware/
│   │   └── auth.js            # JWT verification + admin guard
│   ├── routes/
│   │   ├── auth.js            # Login, /me
│   │   ├── fields.js          # Fields CRUD + updates
│   │   ├── users.js           # User management
│   │   └── dashboard.js       # Role-aware stats
│   └── utils/
│       └── status.js          # Field status computation logic
│
└── client/                    # React + Vite frontend
    └── src/
        ├── api/index.js       # Fetch-based API client
        ├── context/           # Auth context
        ├── components/        # Reusable UI components
        │   ├── Sidebar.jsx
        │   ├── Header.jsx
        │   ├── FieldCard.jsx
        │   ├── StatusBadge.jsx
        │   ├── StagePill.jsx
        │   ├── UpdateModal.jsx
        │   └── AddFieldModal.jsx
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Fields.jsx
            ├── FieldDetail.jsx
            └── Users.jsx
```

---

## ⚙️ Tech Stack

| Layer       | Technology                            |
|-------------|---------------------------------------|
| Backend     | Node.js, Express 4                    |
| Database    | SQLite (via `better-sqlite3`)         |
| Auth        | JWT (`jsonwebtoken`) + bcrypt         |
| Frontend    | React 18, Vite 5                      |
| Routing     | React Router DOM 6                    |
| Charts      | Recharts                              |
| Dates       | date-fns                              |
| Icons       | react-icons                           |

---

## 🟢 Field Status Logic

Each field is assigned a computed status based on three rules (see `server/utils/status.js`):

| Status        | Rule |
|---------------|------|
| **Completed** | `current_stage === 'Harvested'` |
| **At Risk**   | Stage is NOT Harvested AND (a) no update logged in >14 days for a field >7 days old, OR (b) planted >150 days ago without reaching harvest |
| **Active**    | Everything else — field is progressing normally |

### Rationale

- **14-day update window** reflects a reasonable expectation that field agents should check in at least bi-weekly. Silence signals something may need attention.
- **150-day threshold** (≈5 months) is a conservative estimate for crops like cassava and sorghum. Standard crops (tomatoes, beans, maize) should be harvested well before this.
- Status is fully **computed on read** — no stored status field — so it always reflects the current state of the data without stale flags.

---

## 🌾 Field Stages

The lifecycle follows a linear four-step progression:

```
🌱 Planted → 🌿 Growing → 🌾 Ready → ✅ Harvested
```

Agents can move a field to any stage when logging an update (not locked to forward-only) to accommodate corrections and reporting flexibility.

---

## 👥 Role-Based Access

| Feature                       | Admin | Field Agent |
|-------------------------------|-------|-------------|
| View all fields               | ✅    | ❌ (own only) |
| Create / edit / delete fields | ✅    | ❌ |
| Log field updates             | ✅    | ✅ (assigned) |
| View full dashboard + charts  | ✅    | ✅ (own data) |
| Manage team / users           | ✅    | ❌ |
| View agent metrics            | ✅    | ❌ |

---

## 🎨 Design Decisions

- **SQLite over PostgreSQL** — Zero-config, file-based, perfect for assessment scope without sacrificing real SQL semantics.
- **`better-sqlite3`** — Synchronous SQLite driver; removes async boilerplate and makes route handlers clean and readable.
- **Status computed on read** — Avoids stale data issues; status always reflects the live database state.
- **Vite proxy** — `/api` requests are proxied to the Express server during development, so no CORS config is needed on the client.
- **Earthy design palette** — Forest greens and harvest golds deliberately chosen to match the agricultural domain and give the product a warm, humanized feel.
- **Crop emojis** — Small touch that makes field cards instantly recognisable and approachable.

---

## 📋 Assumptions

1. Agents cannot reassign themselves to other fields — that's an admin responsibility.
2. Passwords are stored as bcrypt hashes (cost factor 10).
3. Deleting a user unassigns their fields rather than cascading delete.
4. The last admin account cannot be deleted (safety guard).
5. JWT tokens expire after 7 days; invalid tokens redirect to login automatically.

---

## 🧪 API Endpoints

```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/fields
POST   /api/fields            (admin)
GET    /api/fields/:id
PUT    /api/fields/:id        (admin)
DELETE /api/fields/:id        (admin)
GET    /api/fields/:id/updates
POST   /api/fields/:id/updates

GET    /api/users             (admin)
GET    /api/users/agents
POST   /api/users             (admin)
PUT    /api/users/:id         (admin)
DELETE /api/users/:id         (admin)

GET    /api/dashboard
GET    /api/health
```
