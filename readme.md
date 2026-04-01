System Overview
This application is built on a Mapping Principle. Instead of hardcoding unique pages for every feature, the UI is generated dynamically by reading a JavaScript Schema that describes our database tables.

The Data Flow
Schema Definition: app.js contains the schemas object. This is the single source of truth for table names, API paths, and UI labels.

Universal UI Builder: renderTable() and showForm() read the schema to build HTML tables and modal forms on the fly.

Network Wrapper: apiRequest() centralizes all fetch calls to handle errors and JSON parsing in one place.

PHP Backend: BaseController.php uses object-oriented logic to execute SQL queries based on the table name and fields passed from child API files.

How to Add a New Table
To add a new feature (e.g., "User Reviews"), follow these steps in order:

1. Database (SQL)
Add the CREATE TABLE statement to init.sql.
Note: Ensure you define foreign keys if the table links to Users or Ingredients.

2. Backend (PHP)
Create a new file in the api/ folder (e.g., api/reviews.php). You only need a few lines to initialize the controller:

PHP
include '../db_config.php'; 
include '../BaseController.php';

$fields = ['UserID', 'DrinkID', 'Rating', 'Comment']; 
$controller = new BaseController($conn, "Reviews", "ReviewID", $fields); 
$controller->handleRequest($_SERVER['REQUEST_METHOD']);
3. Frontend (JS)
Add the table entry to the schemas object in app.js:

JavaScript
reviews: { 
    api: 'api/reviews.php', 
    idField: 'ReviewID', 
    fields: ['UserID', 'DrinkID', 'Rating', 'Comment'], 
    labels: ['User ID', 'Drink ID', 'Score', 'Review Text'] 
}
Technical Constraints
Case Sensitivity
The application runs in a Linux Docker environment, which is strictly case-sensitive.

api/Users.php is NOT the same as api/users.php.

The strings in the fields array in app.js must match your SQL column names exactly.

Referential Integrity (Delete Errors)
If a delete request fails with a Foreign Key Constraint error, the database is protecting the data. You cannot delete a Parent row (Ingredient) if a Child row (Drink Recipe) is still linked to it. You must delete the dependent items first.

Debugging "Unexpected Token <"
This usually means a PHP file crashed and sent back an HTML error message instead of JSON.

Open Browser DevTools (F12).

Go to the Network tab.

Click the failed request (red text) and select the Response tab to see the actual PHP error.

Maintenance Rules
app.js: Do not modify the logic functions unless changing the behavior for the entire app. Most updates should happen only within the schemas object.

BaseController.php: This is the core engine. Changes here affect every API endpoint.

UI Components
The app uses a Single-Page Application (SPA) approach:

#table-container: The target for all dynamic table injections.

#modal-overlay: Used for both "Add" and "Edit" actions. The id field determines if the backend performs an INSERT or an UPDATE.