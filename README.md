# InfoTech ERP — Mini ERP + CRM Operations Portal

A full-stack **MERN** (MongoDB, Express.js, React.js, Node.js) application implementing a Mini ERP + CRM Operations Portal for a wholesale/distribution business. Featuring a modern glassmorphic interface, dynamic **Light & Dark Mode** theme system, role-based security, automated stock movements, and client-side PDF delivery note generation.

---

## ✨ Features Present in the Project

- 🌗 **Light & Dark Theme System**: Persistent theme switcher (`localStorage`) with smooth CSS custom variable transitions and glassmorphism styling.
- 🎨 **Brand Identity & Logo**: Custom vector isometric SVG brand logo component (`Logo.jsx`).
- 🔑 **1-Click Quick Demo Logins**: Instant credential populator buttons on the login card for `ADMIN`, `SALES`, `WAREHOUSE`, and `ACCOUNTS` roles.
- 👤 **Role-Based Access Control (RBAC)**: Backend JWT middleware guards (`requireRole`) and dynamic frontend navigation filtering across 4 operational roles.
- 👥 **Customer CRM**: Full client management, type classification (Wholesale/Retail/Distributor), GST handling, and timestamped follow-up timeline notes.
- 📦 **Products & Stock Catalog**: Product cataloging by SKU, unit pricing, category filters, min-stock threshold alerts, and manual stock adjustment modal (`+ / -`).
- 📋 **Sales Challan Engine**: Multi-item delivery invoice builder with atomic stock reservation rules, insufficient stock guards, status transitions (`Draft` → `Confirmed` → `Cancelled`), and client-side **PDF Delivery Note** generation (`jsPDF`).
- 📊 **Inventory Audit Ledger**: Immutable audit log of all `IN` / `OUT` stock fluctuations triggered by sales challans or manual warehouse adjustments.
- ⚡ **Zero-Config Database Fallback**: Automatically instantiates `mongodb-memory-server` if no local/remote MongoDB instance is detected, auto-seeding demo data on boot.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ and **npm**
- **MongoDB** (local or Atlas) — *optional*, the backend will automatically fallback to an in-memory MongoDB if no server is running.

### 1. Installation

```bash
# Backend installation
cd backend
npm install

# Frontend installation
cd ../frontend
npm install
```

### 2. Environment Configuration

Backend `.env` (pre-configured with defaults):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mini_erp_crm
JWT_SECRET=super_secret_jwt_key_minierp_2026
NODE_ENV=development
```

### 3. Running the Project

```bash
# Terminal 1 — Backend (Auto-seeds demo data on first startup)
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- **Backend API**: http://localhost:5000
- **Frontend App**: http://localhost:5173

---

## 👤 Demo Login Credentials

| Role | Email | Password | Quick Login |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@erp.com` | `password123` | 1-Click Button on Login Card |
| **Sales** | `sales@erp.com` | `password123` | 1-Click Button on Login Card |
| **Warehouse** | `warehouse@erp.com` | `password123` | 1-Click Button on Login Card |
| **Accounts** | `accounts@erp.com` | `password123` | 1-Click Button on Login Card |

---

## 🏗 Project Architecture

```
InfoTech/
├── backend/                 # Node.js + Express + Mongoose API
│   ├── src/
│   │   ├── config/db.js     # MongoDB connection (with memory-server fallback)
│   │   ├── middleware/      # auth.js (JWT + RBAC), errorHandler.js
│   │   ├── models/          # User, Customer, Product, StockMovement, SalesChallan
│   │   ├── routes/          # auth, customer, product, stockMovement, challan, dashboard
│   │   ├── seed.js          # Demo data seeder
│   │   └── index.js         # Express server entry point
│   ├── .env
│   └── package.json
│
├── frontend/                # React (Vite) + TailwindCSS v4 + TypeScript
│   ├── src/
│   │   ├── components/      # Header, Sidebar, Logo, Layout, Modal
│   │   ├── context/         # AuthContext, ThemeContext (Light/Dark mode)
│   │   ├── pages/           # LoginPage, DashboardPage, CustomersPage, ProductsPage, StockMovementsPage, ChallansPage
│   │   ├── services/api.js  # Axios API layer with JWT interceptor
│   │   ├── index.css        # TailwindCSS v4 + CSS custom design system
│   │   ├── App.jsx          # Routes & Provider wrappers
│   │   └── main.jsx         # Vite entry
│   └── package.json
│
├── vercel.json              # Vercel multi-service configuration
└── README.md                # Documentation
```

---

## 🔐 Role-Based Access Control (RBAC) Matrix

| Module / Action | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard Overview** | ✅ | ✅ | ✅ | ✅ |
| **Customer CRM (CRUD & Notes)** | ✅ | ✅ Read/Write | ❌ No Access | 👁️ View Only |
| **Product Master Catalog (CRUD)** | ✅ | 👁️ View Only | ✅ Read/Write | ❌ No Access |
| **Manual Stock Adjustments (+/-)** | ✅ | ❌ No Access | ✅ Read/Write | ❌ No Access |
| **Inventory Movement Audit Logs** | ✅ | 👁️ View Only | ✅ Read/Write | ❌ No Access |
| **Sales Challans (Draft/Confirm/Cancel)** | ✅ | ✅ Read/Write | ❌ No Access | 👁️ View + PDF |

---

## 📦 Backend API Endpoints

All API endpoints are prefixed with `/api`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT token |
| `GET` | `/api/auth/me` | Resolve current authenticated user profile |
| `POST` | `/api/auth/seed` | Re-seed database with initial demo data |
| `GET` | `/api/dashboard` | Aggregated dashboard stats & low stock alerts |
| `GET` | `/api/customers` | List customers (paginated with search & filters) |
| `GET` | `/api/customers/all` | Get all customers (unpaginated for dropdowns) |
| `GET` | `/api/customers/:id` | Get customer profile details |
| `POST` | `/api/customers` | Register a new customer |
| `PUT` | `/api/customers/:id` | Update customer profile |
| `POST` | `/api/customers/:id/notes` | Add follow-up note to customer timeline |
| `GET` | `/api/products` | List products (paginated with category & low-stock filters) |
| `GET` | `/api/products/all` | Get all products (unpaginated for dropdowns) |
| `GET` | `/api/products/categories` | Get distinct product categories |
| `GET` | `/api/products/:id` | Get product details |
| `POST` | `/api/products` | Create a new product |
| `PUT` | `/api/products/:id` | Edit product details |
| `POST` | `/api/products/:id/adjust-stock` | Perform manual stock `IN` or `OUT` adjustment |
| `GET` | `/api/stock-movements` | List inventory movement audit logs |
| `GET` | `/api/challans` | List sales challans (paginated with search & status filters) |
| `GET` | `/api/challans/:id` | Get challan details |
| `POST` | `/api/challans` | Create sales challan (`Draft` or `Confirmed`) |
| `PUT` | `/api/challans/:id/status` | Update status (`Draft` → `Confirmed`, `Confirmed` → `Cancelled`) |

---

## 🧪 Sales Challan Business & Inventory Rules

1. **Draft State**: Saves delivery challan without affecting current product stock.
2. **Confirmed Transition**:
   - Validates `currentStock >= requestedQuantity` for **all items** simultaneously.
   - If stock is insufficient for any product, halts execution and returns HTTP **400** with itemized deficiency breakdown.
   - If all pass, atomically decrements stock (`currentStock -= qty`) and creates `OUT` movement logs (`StockMovement`).
3. **Cancelled Transition**:
   - Restores stock for all confirmed items (`currentStock += qty`) and logs `IN` restock audit records.

---

## 📝 Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose ODM, JWT (`jsonwebtoken`), `bcryptjs`, `cors`, `dotenv`
- **Frontend**: React.js (Vite), TailwindCSS v4, TypeScript, `lucide-react`, `axios`, `jspdf`, `jspdf-autotable`, `react-hot-toast`, `react-router-dom`
- **Database & Development**: `mongodb-memory-server` (zero-config local DB fallback)
