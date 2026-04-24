---
member: gwitt1 (Griffin Witt)
---

## Contributions

### Architecture & Backend
- Designed and implemented the `BaseController.php` pattern that drives all CRUD operations across every table with a single reusable class
- Built the subclass `UserController` to override password handling with bcrypt hashing
- Implemented all API endpoints (`ingredients.php`, `drinks.php`, `drink_ingredients.php`, `inventory.php`, `favorites.php`, `history.php`, `shopping_lists.php`, `shopping_items.php`, `users.php`)
- Wrote `auth.php` covering login, signup, logout, session management, and password change
- Set up `db_connect.php` and the Docker/MySQL environment (`docker-compose.yml`, `init.sql`)

### Frontend
- Built the schema-driven UI engine in `app.js` — `renderTable()`, `showForm()`, `saveData()`, `editRow()`, `deleteRow()`
- Implemented the Reports view (`renderReports()`) pulling from `reports.php`
- Designed the authenticated app shell in `index.html` with sidebar navigation, role-based admin section, and all modals
- Styled the full UI in `style.css`

### Database & Reporting
- Designed the 9-table relational schema (see `db/schema.sql`) with foreign-key constraints, bridge tables, and seed data
- Wrote the three analytical reports in `reports.php`:
  - Drinks the logged-in user can make (correlated NOT EXISTS subquery)
  - Most popular drinks by favorites (GROUP BY + aggregate)
  - Highest rated drinks by average personal rating (JOIN + AVG)
