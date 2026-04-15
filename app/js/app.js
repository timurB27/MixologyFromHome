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
        fields: ['first_name', 'last_name', 'email', 'password', 'phone', 'status', 'bio'],
        labels: ['First Name', 'Last Name', 'Email', 'Password', 'Phone', 'Status', 'Bio']
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
        labels: ['Drink Name', 'Description', 'Recipe Text', 'Base Spirit ID', 'Flavor', 'Glass', 'Difficulty', 'Category', 'Creator ID']
    },
    drink_ingredients: {
        api: 'api/drink_ingredients.php',
        idField: 'DrinkID', 
        fields: ['DrinkID', 'IngredientID', 'Quantity', 'Unit', 'Preperation_note', 'Ingredient_order'],
        labels: ['Drink ID', 'Ingredient ID', 'Qty', 'Unit', 'Notes', 'Order']
    },
    inventory: {
        api: 'api/inventory.php',
        idField: 'UserID', 
        fields: ['UserID', 'IngredientID', 'Quantity_owned', 'Unit'],
        labels: ['User ID', 'Ingredient ID', 'Qty Owned', 'Unit']
    },
    favorites: {
        api: 'api/favorites.php',
        idField: 'UserID',
        fields: ['UserID', 'DrinkID'],
        labels: ['User ID', 'Drink ID']
    },
    history: {
        api: 'api/history.php',
        idField: 'HistoryID',
        fields: ['UserID', 'DrinkID', 'personal_rating', 'notes'],
        labels: ['User ID', 'Drink ID', 'Rating (1-5)', 'Notes']
    },
    shopping_lists: {
        api: 'api/shopping_lists.php',
        idField: 'ShoppingListID',
        fields: ['UserID', 'list_name', 'status'],
        labels: ['User ID', 'List Name', 'Status']
    },
    shopping_items: {
        api: 'api/shopping_items.php',
        idField: 'ShoppinglistID',
        fields: ['ShoppinglistID', 'IngredientID', 'Unit', 'Is_purchased', 'notes'],
        labels: ['List ID', 'Ingredient ID', 'Unit', 'Purchased (0/1)', 'Notes']
    }
};

async function doLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const formData = new FormData();
    formData.append('action', 'login');
    formData.append('email', email);
    formData.append('password', password);

    const res = await apiRequest('api/auth.php', { method: 'POST', body: formData });

    if (res.status === 'success') {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'flex';
        document.getElementById('welcome-msg').innerText = `Hello, ${res.name}`;

        // Only show "Manage Users" to admins
        if (res.role === 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
        }
        renderTable('ingredients');
    } else {
        const err = document.getElementById('login-error');
        err.innerText = res.message;
        err.style.display = 'block';
    }
}

async function doLogout() {
    const formData = new FormData();
    formData.append('action', 'logout');
    await apiRequest('api/auth.php', { method: 'POST', body: formData });
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
}

// On page load, check if already logged in
async function checkSession() {
    const res = await apiRequest('api/auth.php?action=check');
    if (res.status === 'logged_in') {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-screen').style.display = 'flex';
        document.getElementById('welcome-msg').innerText = `Hello, ${res.name}`;
        if (res.role === 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
        }
        renderTable('ingredients');
    }
}

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

    const data = await apiRequest(schema.api);
    
    // Safety check if the database is down or empty
    if (!data || data.status === 'error') {
        container.innerHTML = `<p class="error">Error: Could not reach the server.</p>`;
        return;
    }

    // Build the Add button and Table start
    let html = `<button onclick="showForm('${schemaKey}')" class="btn-add">+ Add New</button>`;
    html += `<table class="universal-table"><thead><tr>`;
    
    // Dynamically create Table Headers from our Schema Labels
    schema.labels.forEach(label => html += `<th>${label}</th>`);
    html += `<th>Actions</th></tr></thead><tbody>`;

    // Loop through the data from SQL and build the rows
    data.forEach(row => {
        html += `<tr>`;
        schema.fields.forEach(field => html += `<td>${row[field] || ''}</td>`);
        
        // Grab the ID for this specific row so the Edit/Delete buttons know which row they are touching
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
 * 5. NAVIGATION & INITIALIZATION
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

        // Render the requested table
        renderTable(targetSchema);
    });
});

// Run this as soon as the page finishes loading
window.onload = () => {
    renderTable('ingredients'); // Start the app by showing the Pantry
};
