/**
 * 1. THE MASTER BLUEPRINT (The Schema Map)
 */
const schemas = {
    users: {
        label: 'User',
        api: 'api/users.php',
        idField: 'UserID',
        fields: ['first_name', 'last_name', 'email', 'password', 'phone', 'role', 'status', 'bio'],
        labels: ['First Name', 'Last Name', 'Email', 'Password', 'Phone', 'Role', 'Status', 'Bio']
    },
    ingredients: {
        label: 'Ingredient',
        api: 'api/ingredients.php',
        idField: 'IngredientID',
        fields: ['Ingredient_name', 'category', 'unit_of_measurement', 'is_base_spirit'],
        labels: ['Ingredient', 'Category', 'Unit', 'Base Spirit (0/1)']
    },
    drinks: {
        label: 'Drink',
        api: 'api/drinks.php',
        idField: 'DrinkID',
        fields: ['name', 'description', 'recipe', 'base_spirit_ID', 'flavor_profile', 'glassware_type', 'difficulty', 'category', 'created_by_userID'],
        labels: ['Drink Name', 'Description', 'Recipe Text', 'Base Spirit', 'Flavor', 'Glass', 'Difficulty', 'Category', 'Created By'],
        lookups: { base_spirit_ID: 'ingredients', created_by_userID: 'users' }
    },
    drink_ingredients: {
        label: 'Drink Ingredient',
        api: 'api/drink_ingredients.php',
        idField: 'RowID',
        fields: ['DrinkID', 'IngredientID', 'Quantity', 'Unit', 'Preperation_note', 'Ingredient_order'],
        labels: ['Drink', 'Ingredient', 'Qty', 'Unit', 'Notes', 'Order'],
        lookups: { DrinkID: 'drinks', IngredientID: 'ingredients' }
    },
    inventory: {
        label: 'Pantry Item',
        api: 'api/inventory.php',
        idField: 'RowID',
        fields: ['IngredientID', 'Quantity_owned', 'Unit'],
        labels: ['Ingredient', 'Qty Owned', 'Unit'],
        lookups: { IngredientID: 'ingredients' }
    },
    favorites: {
        label: 'Favorite',
        api: 'api/favorites.php',
        idField: 'RowID',
        fields: ['DrinkID'],
        labels: ['Drink'],
        lookups: { DrinkID: 'drinks' }
    },
    history: {
        label: 'History Entry',
        api: 'api/history.php',
        idField: 'HistoryID',
        fields: ['DrinkID', 'personal_rating', 'notes'],
        labels: ['Drink', 'Rating (1-5)', 'Notes'],
        lookups: { DrinkID: 'drinks' },
        extraAction: (row) => `<button class="btn-star" onclick="addToFavorites(${row.DrinkID}, this)" title="Add to Favorites">⭐ Favorite</button>`
    },
    shopping_lists: {
        label: 'Shopping List',
        api: 'api/shopping_lists.php',
        idField: 'ShoppingListID',
        fields: ['list_name', 'status'],
        labels: ['List Name', 'Status']
    },
    shopping_items: {
        label: 'Shopping Item',
        api: 'api/shopping_items.php',
        idField: 'RowID',
        fields: ['ShoppinglistID', 'IngredientID', 'Unit', 'Is_purchased', 'notes'],
        labels: ['Shopping List', 'Ingredient', 'Unit', 'Purchased (0/1)', 'Notes'],
        lookups: { ShoppinglistID: 'shopping_lists', IngredientID: 'ingredients' }
    }
};

/**
 * LOOKUP CACHE — maps IDs to human-readable names for foreign key fields.
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

/**
 * 2. THE NETWORK CLIENT
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
 * 3. CURRENT VIEW TRACKER
 */
let currentView = null;
let currentUserRole = null; // set by showApp() in index.html

function refreshView() {
    if (!currentView) return;
    if (currentView === 'drinks') renderDrinksGrid();
    else if (currentView === 'ingredients') renderBrowseIngredients();
    else if (currentView === 'reports') renderReports();
    else renderTable(currentView);
}

/**
 * Helper — returns the .form-actions div inside the universal modal (not the pw-modal).
 * Both modals have a .form-actions, so we must scope to #modal-overlay.
 */
function getFormActions() {
    return document.querySelector('#modal-overlay .form-actions');
}

/**
 * 4. THE TABLE BUILDER
 */
async function renderTable(schemaKey) {
    currentView = schemaKey;
    const schema = schemas[schemaKey];
    const container = document.getElementById('table-container');
    container.innerHTML = '<div class="loading">Loading data...</div>';

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
        const extraBtn = schema.extraAction ? schema.extraAction(row) : '';
        html += `<td>
            ${extraBtn}
            <button class="btn-edit" onclick="editRow('${schemaKey}', ${id})">Edit</button>
            <button class="btn-delete" onclick="deleteRow('${schemaKey}', ${id})">Delete</button>
        </td></tr>`;
    });

    container.innerHTML = html + `</tbody></table>`;
}

/**
 * 5. DRINK RECIPES — card grid view
 */
let _drinkCache = {};

async function renderDrinksGrid() {
    currentView = 'drinks';
    const container = document.getElementById('table-container');
    container.innerHTML = '<div class="loading">Loading drinks...</div>';

    await loadLookups();
    const data = await apiRequest('api/drinks.php');

    if (!data || data.status === 'error') {
        container.innerHTML = `<p class="error">Error: Could not load drinks.</p>`;
        return;
    }

    _drinkCache = {};
    data.forEach(d => { _drinkCache[d.DrinkID] = d; });

    let html = `<button onclick="showForm('drinks')" class="btn-add">+ Add New Drink</button>`;
    html += `<div class="drink-grid">`;

    data.forEach(drink => {
        const base = lookupCache.ingredients[drink.base_spirit_ID] || '';
        html += `
            <div class="drink-card">
                <div class="drink-card-body" onclick="showDrinkDetail(${drink.DrinkID})">
                    <div class="drink-card-name">${drink.name}</div>
                    <div class="drink-card-tags">
                        ${drink.category ? `<span class="tag">${drink.category}</span>` : ''}
                        ${drink.difficulty ? `<span class="tag tag-diff">${drink.difficulty}</span>` : ''}
                    </div>
                    ${drink.flavor_profile ? `<div class="drink-card-flavor">${drink.flavor_profile}</div>` : ''}
                    ${base ? `<div class="drink-card-spirit">🍶 ${base}</div>` : ''}
                </div>
                <div class="drink-card-footer">
                    <button class="btn-card-edit" onclick="editRow('drinks', ${drink.DrinkID})">✏️ Edit</button>
                    <button class="btn-card-delete" onclick="deleteRow('drinks', ${drink.DrinkID})">🗑️ Delete</button>
                </div>
            </div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
}

function showDrinkDetail(drinkId) {
    const drink = _drinkCache[drinkId];
    if (!drink) return;

    const modal = document.getElementById('modal-overlay');
    document.getElementById('modal-title').innerText = drink.name;
    document.getElementById('form-id-field').value = '';

    const base = lookupCache.ingredients[drink.base_spirit_ID] || '—';
    const creator = lookupCache.users[drink.created_by_userID] || '—';

    document.getElementById('form-inputs').innerHTML = `
        <div class="drink-detail-grid">
            <div class="detail-row"><span class="detail-label">Category</span><span class="detail-value">${drink.category || '—'}</span></div>
            <div class="detail-row"><span class="detail-label">Difficulty</span><span class="detail-value">${drink.difficulty || '—'}</span></div>
            <div class="detail-row"><span class="detail-label">Flavor</span><span class="detail-value">${drink.flavor_profile || '—'}</span></div>
            <div class="detail-row"><span class="detail-label">Glassware</span><span class="detail-value">${drink.glassware_type || '—'}</span></div>
            <div class="detail-row"><span class="detail-label">Base Spirit</span><span class="detail-value">${base}</span></div>
            <div class="detail-row"><span class="detail-label">Created By</span><span class="detail-value">${creator}</span></div>
            ${drink.description ? `<div class="detail-section"><div class="detail-label">Description</div><div class="detail-body">${drink.description}</div></div>` : ''}
            ${drink.recipe ? `<div class="detail-section"><div class="detail-label">Recipe</div><div class="detail-body">${drink.recipe}</div></div>` : ''}
        </div>`;

    getFormActions().innerHTML = `
        <button type="button" class="btn-edit" onclick="editRow('drinks', ${drinkId})">✏️ Edit</button>
        <button type="button" class="btn-delete" onclick="deleteRow('drinks', ${drinkId})">🗑️ Delete</button>
        <button type="button" onclick="closeModal()" class="btn-cancel">Close</button>`;

    modal.style.display = 'flex';
}

/**
 * 6. BROWSE INGREDIENTS — table with "+ Pantry" action per row
 */
async function renderBrowseIngredients() {
    currentView = 'ingredients';
    const container = document.getElementById('table-container');
    container.innerHTML = '<div class="loading">Loading ingredients...</div>';

    const data = await apiRequest('api/ingredients.php');

    if (!data || data.status === 'error') {
        container.innerHTML = `<p class="error">Error: Could not load ingredients.</p>`;
        return;
    }

    let html = `<button onclick="showForm('ingredients')" class="btn-add">+ Add New Ingredient</button>`;
    html += `<table class="universal-table"><thead><tr>
        <th>Ingredient</th><th>Category</th><th>Unit</th><th>Base Spirit</th><th>Actions</th>
    </tr></thead><tbody>`;

    data.forEach(ing => {
        const safeName = ing.Ingredient_name.replace(/'/g, "\\'");
        html += `<tr>
            <td>${ing.Ingredient_name}</td>
            <td>${ing.category || '—'}</td>
            <td>${ing.unit_of_measurement || '—'}</td>
            <td>${ing.is_base_spirit ? 'Yes' : 'No'}</td>
            <td>
                <button class="btn-pantry" onclick="showAddToPantryModal(${ing.IngredientID}, '${safeName}')">+ Pantry</button>
                <button class="btn-edit" onclick="editRow('ingredients', ${ing.IngredientID})">Edit</button>
                <button class="btn-delete" onclick="deleteRow('ingredients', ${ing.IngredientID})">Delete</button>
            </td>
        </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function showAddToPantryModal(ingredientId, ingredientName) {
    const modal = document.getElementById('modal-overlay');
    document.getElementById('modal-title').innerText = `Add to Pantry: ${ingredientName}`;
    document.getElementById('form-id-field').value = '';

    document.getElementById('form-inputs').innerHTML = `
        <input type="hidden" name="IngredientID" value="${ingredientId}">
        <div class="form-group">
            <label>Quantity</label>
            <input type="text" name="Quantity_owned" value="" required>
        </div>
        <div class="form-group">
            <label>Unit</label>
            <input type="text" name="Unit" value="" required>
        </div>`;

    getFormActions().innerHTML = `
        <button type="submit" class="btn-save">💾 Add to Pantry</button>
        <button type="button" onclick="closeModal()" class="btn-cancel">Cancel</button>`;

    modal.style.display = 'flex';

    document.getElementById('universal-form').onsubmit = (e) => {
        e.preventDefault();
        saveData('inventory');
    };
}

/**
 * 7. ADD TO FAVORITES from history
 */
async function addToFavorites(drinkId, btn) {
    const formData = new FormData();
    formData.append('DrinkID', drinkId);
    const res = await apiRequest('api/favorites.php', { method: 'POST', body: formData });
    if (res && res.status === 'success') {
        if (btn) { btn.innerText = '✅ Added'; btn.disabled = true; }
    } else {
        alert('Could not add to favorites: ' + (res && res.message ? res.message : 'Unknown error'));
    }
}

/**
 * 8. MODAL & FORM LOGIC
 */
async function showForm(schemaKey, id = null, existingData = null) {
    const schema = schemas[schemaKey];
    if (schema.lookups) await loadLookups();

    const modal = document.getElementById('modal-overlay');
    const inputContainer = document.getElementById('form-inputs');
    const idHiddenInput = document.getElementById('form-id-field');

    idHiddenInput.value = id || '';
    const displayLabel = schema.label || schemaKey;
    document.getElementById('modal-title').innerText = id ? `Edit ${displayLabel}` : `Add New ${displayLabel}`;
    inputContainer.innerHTML = '';

    schema.fields.forEach((field, index) => {
        const label = schema.labels[index];
        const value = existingData ? existingData[field] : '';
        const lookupType = schema.lookups && schema.lookups[field];

        let input;
        if (lookupType && lookupCache[lookupType]) {
            const options = Object.entries(lookupCache[lookupType])
                .map(([optId, optName]) => `<option value="${optId}"${optId == value ? ' selected' : ''}>${optName}</option>`)
                .join('');
            input = `<select name="${field}" required><option value="">-- Select --</option>${options}</select>`;
        } else {
            input = `<input type="text" name="${field}" value="${value}" required>`;
        }

        inputContainer.innerHTML += `
            <div class="form-group">
                <label>${label}</label>
                ${input}
            </div>`;
    });

    // Reset form-actions to default Save/Cancel
    getFormActions().innerHTML = `
        <button type="submit" class="btn-save">💾 Save</button>
        <button type="button" onclick="closeModal()" class="btn-cancel">Cancel</button>`;

    modal.style.display = 'flex';

    document.getElementById('universal-form').onsubmit = (e) => {
        e.preventDefault();
        saveData(schemaKey);
    };
}

async function saveData(schemaKey) {
    const schema = schemas[schemaKey];
    const formData = new FormData(document.getElementById('universal-form'));

    const id = document.getElementById('form-id-field').value;
    if (id) formData.append('id', id);

    const response = await apiRequest(schema.api, {
        method: 'POST',
        body: formData
    });

    if (response && response.status === 'success') {
        closeModal();
        refreshView();
    } else {
        alert("Save failed: " + (response.message || "Unknown error"));
    }
}

async function editRow(schemaKey, id) {
    const schema = schemas[schemaKey];
    const data = await apiRequest(schema.api);
    if (data && !data.status) {
        const record = data.find(item => item[schema.idField] == id);
        showForm(schemaKey, id, record);
    }
}

async function deleteRow(schemaKey, id) {
    if (!confirm("Are you sure you want to delete this?")) return;

    const response = await apiRequest(`${schemas[schemaKey].api}?id=${id}`, {
        method: 'DELETE'
    });

    if (response && response.status === 'success') {
        closeModal();
        refreshView();
    } else {
        alert("Delete failed: " + (response && response.message ? response.message : "Unknown error"));
    }
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
    // Reset form-actions in the universal modal to default
    getFormActions().innerHTML = `
        <button type="submit" class="btn-save">💾 Save</button>
        <button type="button" onclick="closeModal()" class="btn-cancel">Cancel</button>`;
}

/**
 * 9. REPORTS VIEW
 */
async function renderReports() {
    currentView = 'reports';
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
 * 10. NAVIGATION & INITIALIZATION
 */
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        const targetSchema = this.getAttribute('data-target');
        document.getElementById('view-title').innerText = this.innerText;

        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');

        if (targetSchema === 'reports') {
            renderReports();
        } else if (targetSchema === 'drinks') {
            renderDrinksGrid();
        } else if (targetSchema === 'ingredients') {
            renderBrowseIngredients();
        } else {
            renderTable(targetSchema);
        }
    });
});

// window.onload is defined inline in index.html
