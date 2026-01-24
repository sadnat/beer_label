# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Beer Label Editor - A full-stack React application for designing professional beer bottle and can labels. Uses Fabric.js for canvas-based editing, jsPDF for high-resolution PDF export, Express.js backend with PostgreSQL for user authentication and project storage.

## Development Commands

### Frontend
```bash
npm run dev       # Start dev server on port 5173
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint validation
npm run preview   # Preview production build
```

### Backend
```bash
cd backend
npm run dev       # Start dev server with hot reload
npm run build     # TypeScript compilation
npm run start     # Start production server
```

## Docker Deployment

```bash
docker compose up -d --build   # Build and start all services
docker compose logs -f         # View logs (all services)
docker compose logs -f api     # View API logs only
docker compose down            # Stop all containers
docker compose restart api     # Restart API after changes
```

### Database Operations
```bash
# Access PostgreSQL
docker compose exec postgres psql -U beer_label -d beer_label_db

# Run migrations manually
docker compose exec postgres psql -U beer_label -d beer_label_db -f /docker-entrypoint-initdb.d/002_email_verification.sql
```

Note: Use `docker compose` (without hyphen) - the new Docker Compose V2 syntax.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                            │
├─────────────┬─────────────────────┬─────────────────────────┤
│  PostgreSQL │    API (Express)    │   Frontend (Nginx)      │
│   :5432     │       :3000         │        :80              │
│             │                     │   /api → proxy → API    │
└─────────────┴─────────────────────┴─────────────────────────┘
```

### Frontend Component Hierarchy

```
main.tsx                       # Router setup, AuthProvider
├── HomePage                   # Landing page (public)
├── LoginPage                  # User login
├── RegisterPage               # User registration
├── VerifyEmailPage            # Email verification handler
├── DashboardPage              # Project list (protected)
├── EditorPage                 # Label editor (protected)
│   ├── Header                 # Top navigation + save/export
│   ├── Sidebar                # Tabbed panel container
│   │   ├── ElementsPanel      # Add beer fields, text, images, shapes
│   │   ├── LayersPanel        # Object z-order management
│   │   ├── FormatPanel        # Label format selection
│   │   └── StylePanel         # Text/image styling controls
│   ├── CanvasEditor           # Fabric.js canvas wrapper + toolbar
│   ├── TemplateGallery        # Template browser modal
│   └── MultiLabelExport       # A4 sheet printing modal
└── admin/                     # Admin panel (role=admin required)
    ├── AdminLayout            # Admin sidebar + header wrapper
    ├── AdminDashboard         # Statistics and overview
    ├── AdminUsers             # User management table
    ├── AdminPlans             # Subscription plans management
    └── AdminAudit             # Audit log viewer
```

### Backend Structure

```
backend/
├── src/
│   ├── index.ts              # Express app entry point
│   ├── config/
│   │   └── database.ts       # PostgreSQL connection pool
│   ├── middleware/
│   │   └── auth.ts           # JWT auth + role middleware
│   ├── routes/
│   │   ├── auth.ts           # /api/auth/* routes
│   │   ├── projects.ts       # /api/projects/* routes
│   │   └── admin.ts          # /api/admin/* routes (admin only)
│   ├── controllers/
│   │   ├── authController.ts # Auth request handlers
│   │   ├── projectController.ts
│   │   └── adminController.ts # Admin operations
│   └── services/
│       ├── authService.ts    # User/JWT operations
│       ├── emailService.ts   # Nodemailer SMTP
│       ├── projectService.ts # Project CRUD
│       └── adminService.ts   # Admin stats, user mgmt
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_email_verification.sql
│   └── 003_admin_system.sql  # Roles, plans, subscriptions
├── package.json
├── tsconfig.json
└── Dockerfile
```

### Key Frontend Files

- `src/services/api.ts` - API client with JWT token management
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/components/Auth/ProtectedRoute.tsx` - Route protection wrapper
- `src/pages/Editor.tsx` - Main editor with project load/save
- `src/hooks/useCanvas.ts` - Core Fabric.js wrapper hook
- `src/types/label.ts` - TypeScript interfaces

### Database Schema

```sql
-- Users table
users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'user',    -- 'user' or 'admin'
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    banned_at TIMESTAMP,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

-- Projects table
projects (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    format_id VARCHAR(50) NOT NULL,
    format_width DECIMAL(10,2) NOT NULL,
    format_height DECIMAL(10,2) NOT NULL,
    canvas_json TEXT NOT NULL,
    beer_data JSONB NOT NULL,
    thumbnail TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

-- Subscription plans
plans (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) DEFAULT 0,
    max_projects INT DEFAULT 5,
    max_exports_per_month INT DEFAULT 10,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP
)

-- User subscriptions
subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id),
    status VARCHAR(20) DEFAULT 'active',
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP,
    UNIQUE(user_id)
)

-- Admin audit log
audit_log (
    id UUID PRIMARY KEY,
    admin_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP
)
```

### API Endpoints

**Authentication (`/api/auth/`)**
| Method | Endpoint            | Description                    |
|--------|---------------------|--------------------------------|
| POST   | /register           | Create account                 |
| POST   | /login              | Login                          |
| GET    | /me                 | Get current user               |
| POST   | /logout             | Logout                         |
| POST   | /verify-email       | Verify email with token        |
| POST   | /resend-verification| Resend verification email      |
| POST   | /forgot-password    | Request password reset         |
| POST   | /reset-password     | Reset password with token      |
| DELETE | /account            | Delete user account            |

**Projects (`/api/projects/`)**
| Method | Endpoint | Description          |
|--------|----------|----------------------|
| GET    | /        | List user projects   |
| GET    | /:id     | Get project details  |
| POST   | /        | Create project       |
| PUT    | /:id     | Update project       |
| DELETE | /:id     | Delete project       |

**Admin (`/api/admin/`)** - Requires admin role
| Method | Endpoint         | Description                    |
|--------|------------------|--------------------------------|
| GET    | /stats           | Global statistics              |
| GET    | /users           | List users (paginated)         |
| GET    | /users/:id       | User details + projects        |
| PUT    | /users/:id/role  | Change user role               |
| POST   | /users/:id/ban   | Ban user                       |
| DELETE | /users/:id/ban   | Unban user                     |
| DELETE | /users/:id       | Delete user account            |
| PUT    | /users/:id/plan  | Change user subscription plan  |
| GET    | /plans           | List subscription plans        |
| POST   | /plans           | Create plan                    |
| PUT    | /plans/:id       | Update plan                    |
| GET    | /audit-log       | Admin action history           |

### State Flow

1. User authenticates via AuthContext (JWT stored in localStorage)
2. Protected routes check authentication before rendering
3. Editor loads/saves projects via API
4. Canvas operations go through `canvasActionsRef` exposed by useCanvas hook
5. Auto-save triggers after 30 seconds of inactivity
6. Fabric.js Canvas manages all 2D objects (text, images, shapes)
7. Undo/redo history maintained in useCanvas (max 50 states)

### Canvas Operations (useCanvas hook)

The hook exposes methods via ref:
- `addText`, `addImage`, `addRectangle`, `addCircle`, `addLine`
- `deleteSelected`, `duplicateSelected`
- `undo`, `redo`
- `bringForward`, `sendBackward`, `bringToFront`, `sendToBack`
- `loadFromJSON` (for templates with scaling)
- `loadFromJSONRaw` (for saved projects without scaling)
- `toJSON`, `toDataURL`

Keyboard shortcuts: Delete (remove), Ctrl+Z (undo), Ctrl+Y (redo), Ctrl+D (duplicate)

## Environment Configuration

Create a `.env` file at the project root:

```bash
# Database
DB_PASSWORD=secure_password_here

# JWT
JWT_SECRET=your_jwt_secret_here

# SMTP (optional - if not set, email verification is disabled)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
SMTP_FROM=Beer Label Editor <noreply@example.com>

# Application URL (for email links)
APP_URL=https://your-domain.com

# Admin Configuration
ADMIN_EMAIL=your-admin@example.com
```

**Notes:**
- If SMTP is not configured, users are automatically verified on registration.
- The user registering with `ADMIN_EMAIL` will automatically get admin role.
- For existing users, promote to admin with: `UPDATE users SET role = 'admin' WHERE email = 'your@email.com';`

## Admin Panel

### Accessing Admin

1. **For existing users**, promote to admin via SQL:
   ```bash
   docker compose exec postgres psql -U beer_label -d beer_label_db -c "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
   ```

2. **For new registrations**, set `ADMIN_EMAIL` in `.env` before registering.

3. Once logged in as admin, an "Admin" button appears in the dashboard header.

### Admin Features

| Route | Feature | Description |
|-------|---------|-------------|
| `/admin` | Dashboard | Global stats: users, projects, signups chart, users by plan |
| `/admin/users` | User Management | List, search, filter, ban/unban, change role/plan, delete |
| `/admin/plans` | Plan Management | View/edit subscription plans (Free, Pro, Business) |
| `/admin/audit` | Audit Log | History of all admin actions with details |

### Default Plans

| Plan | Price | Max Projects | Max Exports/Month |
|------|-------|--------------|-------------------|
| Gratuit | 0€ | 3 | 5 |
| Pro | 9.99€ | 20 | 50 |
| Business | 29.99€ | Unlimited | Unlimited |

### User Roles

- `user` - Standard user, can create projects and use the editor
- `admin` - Full access to admin panel, can manage users and plans

### Ban System

Banned users cannot log in. Ban reason is stored and shown to the user on login attempt. Admins cannot ban other admins or themselves.

## Tech Stack

### Frontend
- **React 18** with TypeScript (strict mode, ES2020 target)
- **React Router 6** for client-side routing
- **Fabric.js 6.5** for canvas manipulation
- **jsPDF 2.5** for PDF generation
- **Tailwind CSS 3.4** for styling
- **Vite 6** for build tooling

### Backend
- **Express 4.18** REST API
- **PostgreSQL 16** database
- **JWT** for authentication
- **bcrypt** for password hashing
- **Nodemailer** for email sending
- **express-validator** for input validation

### Infrastructure
- **Docker Compose** with 3 services (postgres, api, frontend)
- **Nginx** for static hosting + API reverse proxy
- External network `npm_default` for Nginx Proxy Manager integration

## Notes

- UI text is in French
- Path alias: `@/*` maps to `src/*`
- Export uses 4x resolution multiplier for print quality
- Canvas JSON is stored as TEXT in PostgreSQL (can be large)
- Thumbnails are stored as base64 in the database
- Projects are deleted via CASCADE when user is deleted
