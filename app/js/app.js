/**
 * 1. THE MASTER BLUEPRINT (The Schema Map)
 * This is the "Brain" of the app. Every table in our SQL database is mapped here.
 * If you add a new table to the database, just add a new key here.
 * * Each object contains:
 * - api: The PHP file handling the requests.
 * - idField: The Primary Key from our SQL (Used for Edit/Delete).
 * - fields: The exact column names from SQL.
 * - labels: The human-readable names that appear in the Table Headers and Forms.
 */
const schemas = {
    users: {
        api: 'api/users.php',
        idField: 'UserID',
        fields: ['first_name', 'last_name', 'email', 'password', 'phone', 'role', 'status', 'bio'],
        labels: ['First Name', 'Last Name', 'Email', 'Password', 'Phone', 'Role', 'Status', 'Bio']
    },
    ingredients: {
        api: 'api/ingredients.php',
        idField: 'IngredientID',
        fields: ['Ingredient_name', 'category', 'unit_of_measurement', 'is_base_spirit'],
        labels: ['Ingredient', 'Category', 'Unit', 'Base Spirit (0/1)']
    },
    drinks: {
        api: 'api/drinks.php',
        idField: 'DrinkID',
        fields: ['name', 'description', 'recipe', 'base_spirit_ID', 'flavor_profile', 'glassware_type', 'difficulty', 'category', 'created_by_userID'],
        labels: ['Drink Name', 'Description', 'Recipe Text', 'Base Spirit', 'Flavor', 'Glass', 'Difficulty', 'Category', 'Created By'],
        lookups: { base_spirit_ID: 'ingredients', created_by_userID: 'users' }
    },
    drink_ingredients: {
        api: 'api/drink_ingredients.php',
        idField: 'DrinkID',
        fields: ['DrinkID', 'IngredientID', 'Quantity', 'Unit', 'Preperation_note', 'Ingredient_order'],
        labels: ['Drink', 'Ingredient', 'Qty', 'Unit', 'Notes', 'Order'],
        lookups: { DrinkID: 'drinks', IngredientID: 'ingredients' }
    },
    inventory: {
        api: 'api/inventory.php',
        idField: 'UserID',
        fields: ['UserID', 'IngredientID', 'Quantity_owned', 'Unit'],
        labels: ['User', 'Ingredient', 'Qty Owned', 'Unit'],
        lookups: { UserID: 'users', IngredientID: 'ingredients' }
    },
    favorites: {
        api: 'api/favorites.php',
        idField: 'UserID',
        fields: ['UserID', 'DrinkID'],
        labels: ['User', 'Drink'],
        lookups: { UserID: 'users', DrinkID: 'drinks' }
    },
    history: {
        api: 'api/history.php',
        idField: 'HistoryID',
        fields: ['UserID', 'DrinkID', 'personal_rating', 'notes'],
        labels: ['User', 'Drink', 'Rating (1-5)', 'Notes'],
        lookups: { UserID: 'users', DrinkID: 'drinks' }
    },
    shopping_lists: {
        api: 'api/shopping_lists.php',
        idField: 'ShoppingListID',
        fields: ['UserID', 'list_name', 'status'],
        labels: ['User', 'List Name', 'Status'],
        lookups: { UserID: 'users' }
    },
    shopping_items: {
        api: 'api/shopping_items.php',
        idField: 'ShoppinglistID',
        fields: ['ShoppinglistID', 'IngredientID', 'Unit', 'Is_purchased', 'notes'],
        labels: ['Shopping List', 'Ingredient', 'Unit', 'Purchased (0/1)', 'Notes'],
        lookups: { ShoppinglistID: 'shopping_lists', IngredientID: 'ingredients' }
    }
};

/**
 * LOOKUP CACHE — maps IDs to human-readable names for foreign key fields.
 * Populated by loadLookups() on login and refreshed on each table render.
 */
const lookupCache = { users: {}, drinks: {}, ingredients: {}, shopping_lists: {} };

async function loadLookups() {
    const [users, drinks, ingredients, lists] = await Promise.all([
        apiRequest('api/users.php'),
        apiRequest('api/drinks.php'),
        apiRequest('api/ingredients.php'),
        apiRequest('api/shopping_lists.php')
    ]);
    if (Array.isArray(users))
        lookupCache.users = Object.fromEntries(users.map(u => [u.UserID, `${u.first_name} ${u.last_name}`]));
    if (Array.isArray(drinks))
        lookupCache.drinks = Object.fromEntries(drinks.map(d => [d.DrinkID, d.name]));
    if (Array.isArray(ingredients))
        lookupCache.ingredients = Object.fromEntries(ingredients.map(i => [i.IngredientID, i.Ingredient_name]));
    if (Array.isArray(lists))
        lookupCache.shopping_lists = Object.fromEntries(lists.map(l => [l.ShoppingListID, l.list_name]));
}

// doLogin is defined inline in index.html (uses auth-page/app-page IDs)

// doLogout is defined inline in index.html

// checkSession is defined inline in index.html

/**
 * 2. THE NETWORK CLIENT (The Wrapper)
 * This is our universal "Messenger." Instead of writing 'fetch' everywhere, we use this.
 * It handles errors automatically and converts server responses into JSON.
 */
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Network/API Error:", error);
        return { status: "error", message: error.message };
    }
}

/**
 * 3. THE TABLE BUILDER
 * This function builds the HTML table on the fly.
 * It doesn't care if it's showing Users or Drinks; it just loops through 
 * whatever 'schemaKey' we give it and creates the columns.
 */
async function renderTable(schemaKey) {
    const schema = schemas[schemaKey];
    const container = document.getElementById('table-container');
    container.innerHTML = '<div class="loading">Loading data...</div>';

    // Refresh lookups before rendering any table that displays foreign key names
    if (schema.lookups) await loadLookups();

    const data = await apiRequest(schema.api);

    if (!data || data.status === 'error') {
        container.innerHTML = `<p class="error">Error: Could not reach the server.</p>`;
        return;
    }

    let html = `<button onclick="showForm('${schemaKey}')" class="btn-add">+ Add New</button>`;
    html += `<table class="universal-table"><thead><tr>`;
    schema.labels.forEach(label => html += `<th>${label}</th>`);
    html += `<th>Actions</th></tr></thead><tbody>`;

    data.forEach(row => {
        html += `<tr>`;
        schema.fields.forEach(field => {
            const val = row[field] ?? '';
            const lookupType = schema.lookups && schema.lookups[field];
            const display = lookupType && lookupCache[lookupType][val]
                ? lookupCache[lookupType][val]
                : val;
            html += `<td>${display}</td>`;
        });

        const id = row[schema.idField];
        html += `<td>
            <button class="btn-edit" onclick="editRow('${schemaKey}', ${id})">Edit</button>
            <button class="btn-delete" onclick="deleteRow('${schemaKey}', ${id})">Delete</button>
        </td></tr>`;
    });

    container.innerHTML = html + `</tbody></table>`;
}

/**
 * 4. MODAL & FORM LOGIC
 * showForm(): Opens the pop-up and generates input fields based on the Schema.
 * saveData(): Collects the form data and sends a POST request to PHP to Save/Update.
 * editRow(): Fetches the specific row data first, then opens the form to edit it.
 * deleteRow(): Sends a DELETE request to the API for a specific ID.
 */
function showForm(schemaKey, id = null, existingData = null) {
    const schema = schemas[schemaKey];
    const modal = document.getElementById('modal-overlay');
    const inputContainer = document.getElementById('form-inputs');
    const idHiddenInput = document.getElementById('form-id-field');
    
    // Set the hidden ID field (if empty, PHP knows it's a NEW record. If filled, it's an UPDATE)
    idHiddenInput.value = id || '';
    document.getElementById('modal-title').innerText = id ? `Edit ${schemaKey}` : `Add New ${schemaKey}`;
    inputContainer.innerHTML = '';

    // Generate input boxes for every field defined in our Schema
    schema.fields.forEach((field, index) => {
        const label = schema.labels[index];
        const value = existingData ? existingData[field] : '';
        
        inputContainer.innerHTML += `
            <div class="form-group">
                <label>${label}</label>
                <input type="text" name="${field}" value="${value}" required>
            </div>`;
    });

    modal.style.display = 'flex';

    // Override the form's submit behavior to use our custom saveData function
    document.getElementById('universal-form').onsubmit = (e) => {
        e.preventDefault();
        saveData(schemaKey);
    };
}

async function saveData(schemaKey) {
    const schema = schemas[schemaKey];
    const formData = new FormData(document.getElementById('universal-form'));
    
    // Ensure the ID is included in the POST data so PHP knows which record to update
    const id = document.getElementById('form-id-field').value;
    if (id) formData.append('id', id);

    const response = await apiRequest(schema.api, {
        method: 'POST',
        body: formData
    });

    if (response && response.status === 'success') {
        closeModal();
        renderTable(schemaKey); // Refresh the table to show changes
    } else {
        alert("Save failed: " + (response.message || "Unknown error"));
    }
}

async function editRow(schemaKey, id) {
    const schema = schemas[schemaKey];
    const data = await apiRequest(schema.api);
    if (data && !data.status) {
        // Find the record in the list that matches the ID we clicked
        const record = data.find(item => item[schema.idField] == id);
        showForm(schemaKey, id, record);
    }
}

async function deleteRow(schemaKey, id) {
    if (!confirm("Are you sure you want to delete this?")) return;

    const response = await apiRequest(`${schemas[schemaKey].api}?id=${id}`, { 
        method: 'DELETE' 
    });

    if (response) {
        renderTable(schemaKey);
    }
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

/**
 * 5. REPORTS VIEW
 * Fetches all three aggregation reports from api/reports.php and renders
 * them as read-only summary tables (no CRUD controls).
 */
async function renderReports() {
    const container = document.getElementById('table-container');
    container.innerHTML = '<div class="loading">Loading reports...</div>';

    const data = await apiRequest('api/reports.php');

    if (!data || data.status === 'error') {
        container.innerHTML = `<p class="error">Error: Could not load reports.</p>`;
        return;
    }

    function buildReportTable(rows, columns, labels) {
        if (!rows || rows.length === 0) {
            return '<p class="report-empty">No data available yet.</p>';
        }
        let t = `<table class="universal-table"><thead><tr>`;
        labels.forEach(l => t += `<th>${l}</th>`);
        t += `</tr></thead><tbody>`;
        rows.forEach(row => {
            t += `<tr>`;
            columns.forEach(col => t += `<td>${row[col] ?? ''}</td>`);
            t += `</tr>`;
        });
        return t + `</tbody></table>`;
    }

    container.innerHTML = `
        <div class="report-section">
            <h3>🍹 Drinks You Can Make</h3>
            <p class="report-desc">Cocktails you can prepare right now based on your current pantry inventory.</p>
            ${buildReportTable(data.can_make,
                ['name', 'difficulty', 'category', 'flavor_profile'],
                ['Drink Name', 'Difficulty', 'Category', 'Flavor Profile'])}
        </div>
        <div class="report-section">
            <h3>⭐ Most Popular Drinks</h3>
            <p class="report-desc">Top 10 most favorited drinks across all users.</p>
            ${buildReportTable(data.popular,
                ['name', 'fav_count'],
                ['Drink Name', 'Times Favorited'])}
        </div>
        <div class="report-section">
            <h3>📊 Highest Rated Drinks</h3>
            <p class="report-desc">Drinks ranked by average personal rating from all drinking history entries.</p>
            ${buildReportTable(data.top_rated,
                ['name', 'avg_rating', 'times_made'],
                ['Drink Name', 'Avg Rating', 'Times Made'])}
        </div>
    `;
}

/**
 * 6. NAVIGATION & INITIALIZATION
 * This section handles clicking the Sidebar links and loading the first view.
 */
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        // Get the target (e.g., 'users' or 'drinks') from the HTML data-target attribute
        const targetSchema = this.getAttribute('data-target');
        document.getElementById('view-title').innerText = this.innerText;

        // Visual feedback: toggle the 'active' class for CSS styling
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');

        if (targetSchema === 'reports') {
            renderReports();
        } else {
            renderTable(targetSchema);
        }
    });
});

// window.onload is defined inline in index.html
