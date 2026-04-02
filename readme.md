# Mixology From Home

## Overview
We are making this have a dynamically mapped UI. There is a single "engine" that reads the schema and generates an interface. 

### Data Flow
* Schema Definition: app.js holds the schemas object
* UI Building: renderTable() and showForm() build HTML dynamically
* Network: apiRequest() handles all fetch logic
* Backend: BaseController.php handles SQL based on mapping

### How to Add a New Table
To add a new feature (e.g User Reviews), follow these steps:

1. Database
add the CREATE TABLE statement to init.sql

2. Backend (PHP)
Create api/reviews.php. 

Initialize the controller with these four arguments

    1. $db : connection object
    2. "Reviews": Table name
    3. "ReviewID": Primary key
    4. $fields: Array of editable columns

```php
include '../db_config.php';
include '../BaseController.php';

$fields = ['UserID', 'DrinkID', 'Rating', 'Comment'];
$controller = new BaseController($conn, "Reviews", "ReviewID", $fields);
$controller->handleRequest($_SERVER['REQUEST_METHOD']);
```
3. Frontend (JS)

Add the entry to the schemas object in app.js

```Javascript
reviews: {
    api: 'api/reviews.php',
    idField: 'ReviewID',
    fields: ['UserID', 'DrinkID', 'Rating', 'Comment'],
    labels: ['User ID', 'Drink ID', 'Score', 'Review Text']
}
```

#### Here are some things to watch out for
* Case Sensitivity:
    Linux docker environemts treat `Users.php` and `users.php` as different files
* Field Matching: 
    Javascript `fields` must match SQL column names exactly
* Integrity
    You cannot delete a "Parent" if a "child depends on it. So you cannot delete an ingredient if a drink depends on it. 