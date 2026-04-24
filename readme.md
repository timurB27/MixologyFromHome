# Mixology From Home

A schema-driven web application for managing cocktail recipes, personal inventory, shopping lists, drinking history, and favorites. Built with PHP, MySQL, and vanilla JavaScript — containerized with Docker.

---

## Features

- **User Authentication** — signup, login, logout, password change, admin/user roles
- **Drink Recipes** — full CRUD on drinks with ingredients, glassware, difficulty, and flavor profiles
- **Ingredient Management** — track spirits, mixers, syrups, and bitters
- **My Pantry** — per-user inventory of what you have on hand
- **Drinking History** — log every cocktail you make with a personal rating and notes
- **Favorites** — bookmark drinks for quick access
- **Shopping Lists** — create and track ingredient shopping lists
- **Reports** — live analytics: what you can make now, most popular drinks, highest rated drinks
- **Admin Panel** — admin users can create and manage all users

---

## Screenshots

> Add screenshots here after running the app (see docs/ folder).

---

## Setup & Running

**Requirements:** Docker Desktop

```bash
# 1. Clone the repo
git clone <repo-url>
cd MixologyFromHome

# 2. Start containers
docker-compose up -d

# 3. Verify containers are running
docker-compose ps
# You should see mfh-db-1 and mfh-web-1 both running

# 4. Open the app
# http://localhost:8080

# Stop containers
docker-compose stop

# Full reset (wipes database)
docker-compose down -v && docker-compose up -d
```

**Default admin credentials:** `admin@mfh.com` / `admin123`

---

## Repository Structure

```
MixologyFromHome/
├── readme.md               ← This file
├── docker-compose.yml      ← Container orchestration
├── docker/mysql/init.sql   ← MySQL init script (runs on first start)
│
├── app/                    ← Full application source
│   ├── index.html          ← Single-page app shell (auth + nav)
│   ├── style.css           ← All styles
│   ├── db_connect.php      ← Database connection
│   ├── js/
│   │   └── app.js          ← Schema definitions + UI engine
│   └── api/                ← Backend PHP endpoints (= "backend/")
│       ├── BaseController.php
│       ├── auth.php
│       ├── reports.php
│       ├── users.php
│       ├── ingredients.php
│       ├── drinks.php
│       ├── drink_ingredients.php
│       ├── inventory.php
│       ├── favorites.php
│       ├── history.php
│       ├── shopping_lists.php
│       └── shopping_items.php
│
├── db/
│   └── schema.sql          ← Database schema + seed data
│
├── docs/                   ← Project documents and diagrams
├── reports/
│   └── report_queries.sql  ← SQL for the three analytical reports
└── roles/
    └── gwitt1.md           ← Team member contributions
```

---

## Architecture

### Schema-Driven UI

`app/js/app.js` holds a `schemas` object defining every data model. All UI (tables, forms, modals) is generated dynamically — no hand-coded forms per entity.

Each schema entry has:
- `api` — PHP endpoint
- `idField` — primary key column name
- `fields` — SQL column names (must match exactly)
- `labels` — human-readable UI labels

Core engine functions: `renderTable()`, `showForm()`, `saveData()`, `editRow()`, `deleteRow()`.

### BaseController Pattern

`app/api/BaseController.php` handles all CRUD for any table:
- `GET` → reads all rows
- `POST` with no ID → INSERT
- `POST` with ID → UPDATE
- `DELETE` → deletes by primary key

Each API file instantiates `BaseController` with table name, primary key, and editable fields. To override behavior, subclass and override — `users.php` does this to hash passwords before upsert.

### Authentication

Session-based PHP auth via `auth.php` (actions: `login`, `signup`, `logout`, `check`, `change_password`). All `BaseController` endpoints reject unauthenticated requests. Passwords are stored as bcrypt hashes (`password_hash` / `password_verify`). All queries use prepared statements to prevent SQL injection.

### Database

Nine tables in `project_db` — see `db/schema.sql` for full schema and seed data.

---

## Adding a New Table

1. Add `CREATE TABLE` to `docker/mysql/init.sql`
2. Create `app/api/<name>.php` with a `BaseController` instance
3. Add an entry to `schemas` in `app/js/app.js`
4. Add a sidebar link in `app/index.html`

---

## Gotchas

- **Case sensitivity** — Linux Docker treats `Users.php` and `users.php` as different files
- **Field matching** — JavaScript `fields` arrays must match SQL column names exactly
- **Foreign key constraints** — you cannot delete a parent record if children depend on it
- **DB re-init** — `init.sql` only runs on first container creation; use `docker-compose down -v` to reset
