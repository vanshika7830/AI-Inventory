# AI-Inventory 🚀

**A modern, AI‑enhanced inventory management system** built with a **React + Vite** frontend and an **Express + MongoDB** backend. The app lets you manage products, record sales, view rich analytics, and even leverage AI‑generated insights.

---

## 🛠️ Tech Stack
| Layer | Technology | Reason |
|-------|------------|--------|
| **Frontend** | **React** (hooks, context) <br> **Vite** (fast dev server) <br> **Tailwind CSS** (utility‑first styling) <br> **lucide‑react** (icons) | Rapid UI development, hot‑module reloading, and a sleek, responsive design.
| **Backend** | **Node.js** + **Express** <br> **MongoDB** (Mongoose) <br> **dotenv** (environment variables) <br> **cors** (CORS handling) | Simple REST API, schema‑based data modeling, and easy deployment.
| **AI Integration** | **@google/generative‑ai** (via `ai.js` route) | Provides AI‑driven suggestions & insights for inventory decisions.
| **Dev Ops** | **npm scripts** (`npm run dev`) <br> **Git** for version control | Consistent development workflow across frontend and backend.

---

## ✨ Features Implemented (Minute‑by‑Minute)
1. **Data Seeding** – `backend/seed.js` creates 15 realistic product records and initial sales.
2. **Dashboard 📊**
   - Revenue‑over‑time chart now accepts `month` and `year` query params for precise period selection.
   - Dropdown to pick month/year.
   - Recent sales table with **Delete** button (removes a sale and updates stats).
3. **Product Management**
   - Full CRUD (Add / Edit / Delete) with cascade delete of associated sales.
   - Category label handling for multi‑word categories (no line‑breaks).
   - Dark‑mode redesign: pure black/white palette – no gray.
4. **Sell Workflow**
   - **Sell button** added to table, grid cards, and product‑detail drawer.
   - Custom quantity selector with live stock validation.
   - Revenue preview updates in real‑time.
   - POST `/api/dashboard/sale` records the sale, decrements `Product.stock`, and instantly reflects on dashboard stats.
5. **UI Polish**
   - Hover effects, micro‑animations, glass‑morphism cards.
   - Accessible tooltips, disabled states when out of stock.
6. **Backend Enhancements**
   - `/api/dashboard/stats` now supports `month` & `year` filters.
   - `/api/dashboard/sale/:id` DELETE endpoint for removing a sale.
   - Centralised error handling via `try/catch` and toast notifications.
7. **Miscellaneous**
   - Fixed “Clear All” bug in `Navbar.jsx`.
   - Added `ShoppingBag` icon to imports.
   - Refactored code for readability and consistency.

---

## 📈 Project Workflow (Mermaid Flowchart)
```mermaid
flowchart TD
    A[Start App] --> B{Load Environment}
    B -->|Frontend| C[React App (Vite)]
    B -->|Backend| D[Express Server]
    C --> E[Fetch Products] --> F[Display Grid/Table]
    F --> G{User Actions}
    G -->|Add/Edit/Delete Product| H[POST/PUT/DELETE /api/products]
    H --> I[MongoDB Product Collection]
    G -->|Sell Product| J[Open Sell Modal]
    J --> K[User selects quantity]
    K --> L[POST /api/dashboard/sale]
    L --> M[Create Sale doc & decrement stock]
    M --> N[Update Dashboard Stats]
    N --> O[Revenue Chart & Stats UI]
    G -->|Delete Sale| P[DELETE /api/dashboard/sale/:id]
    P --> Q[Remove Sale doc & recalc stats]
    Q --> O
    D --> R[Routes: auth, products, ai, dashboard, notifications]
    R --> I
    I --> S[MongoDB Database]
    style A fill:#0f62fe,color:#fff
    style O fill:#24a148,color:#fff
```

---

## ▶️ How to Run Locally
```bash
# Clone the repo (already done)
git clone https://github.com/vanshika7830/AI-Inventory.git
cd AI-Inventory

# Install dependencies
cd backend && npm install && cd ../frontend && npm install

# Set up environment variables (copy .env.example → .env)
#   MONGODB_URI=your_mongodb_connection_string
#   PORT=5000

# Seed the database (run once)
cd backend && node seed.js

# Start both servers (using two terminals or a process manager)
# Backend
cd backend && npm run dev
# Frontend
cd frontend && npm run dev
```
The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5000`.

---

## 📂 Repository Structure
```
AI-Inventory/
├─ backend/                # Express API
│   ├─ models/            # Mongoose schemas (User, Product, Sale, ...)
│   ├─ routes/            # auth, products, dashboard, ai, notifications
│   ├─ seed.js            # seeds 15 products + sales
│   └─ server.js          # entry point
├─ frontend/               # Vite‑React SPA
│   ├─ src/
│   │   ├─ pages/        # Dashboard, Products, AITools, Login
│   │   ├─ components/   # Navbar, Sidebar, etc.
│   │   └─ context/      # Auth, Theme, Toast contexts
│   ├─ index.html
│   └─ vite.config.js
└─ README.md               # This document
```

---

## 📧 Contact & Credits
Developed by **Ujjwal Singhal** – leveraging Google DeepMind’s *Antigravity* AI assistant for rapid iteration.

---

*All UI design follows the premium dark‑mode aesthetic with smooth micro‑animations, ensuring a modern, polished user experience.*
