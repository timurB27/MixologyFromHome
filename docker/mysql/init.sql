-- 1. User Table
CREATE TABLE User (
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(20),
    role ENUM('admin', 'user') DEFAULT 'user',
    status VARCHAR(20),
    bio TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Ingredient Table
CREATE TABLE Ingredient (
    IngredientID INT PRIMARY KEY AUTO_INCREMENT,
    Ingredient_name VARCHAR(100),
    category VARCHAR(50),
    unit_of_measurement VARCHAR(20),
    is_base_spirit BOOLEAN
);

-- 3. Drink Table
CREATE TABLE Drink (
    DrinkID INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    description TEXT,
    recipe TEXT,
    base_spirit_ID INT,
    flavor_profile VARCHAR(50),
    glassware_type VARCHAR(50),
    difficulty VARCHAR(20),
    category VARCHAR(50),
    created_by_userID INT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (base_spirit_ID) REFERENCES Ingredient(IngredientID),
    FOREIGN KEY (created_by_userID) REFERENCES User(UserID)
);

-- 4. Drink_Ingredient Table (Bridge)
CREATE TABLE Drink_Ingredient (
    RowID INT AUTO_INCREMENT PRIMARY KEY,
    DrinkID INT,
    IngredientID INT,
    Quantity DECIMAL(5,2),
    Unit VARCHAR(20),
    Preperation_note TEXT,
    Ingredient_order INT,
    UNIQUE KEY uq_drink_ingredient (DrinkID, IngredientID),
    FOREIGN KEY (DrinkID) REFERENCES Drink(DrinkID),
    FOREIGN KEY (IngredientID) REFERENCES Ingredient(IngredientID)
);

-- 5. User_Inventory Table (Bridge)
CREATE TABLE User_Inventory (
    RowID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    IngredientID INT,
    Quantity_owned DECIMAL(5,2),
    Unit VARCHAR(20),
    UNIQUE KEY uq_user_inventory (UserID, IngredientID),
    FOREIGN KEY (UserID) REFERENCES User(UserID),
    FOREIGN KEY (IngredientID) REFERENCES Ingredient(IngredientID)
);

-- 6. Favorite Table (Bridge)
CREATE TABLE Favorite (
    RowID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    DrinkID INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_favorite (UserID, DrinkID),
    FOREIGN KEY (UserID) REFERENCES User(UserID),
    FOREIGN KEY (DrinkID) REFERENCES Drink(DrinkID)
);

-- 7. User_Drink_History Table
CREATE TABLE User_Drink_History (
    HistoryID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT,
    DrinkID INT,
    made_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    personal_rating INT,
    notes TEXT,
    FOREIGN KEY (UserID) REFERENCES User(UserID),
    FOREIGN KEY (DrinkID) REFERENCES Drink(DrinkID)
);

-- 8. Shopping_List Table
CREATE TABLE Shopping_List (
    ShoppingListID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT,
    list_name VARCHAR(100),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20),
    FOREIGN KEY (UserID) REFERENCES User(UserID)
);

-- 9. Shopping_List_Item Table (Bridge)
CREATE TABLE Shopping_List_Item (
    RowID INT AUTO_INCREMENT PRIMARY KEY,
    ShoppinglistID INT,
    IngredientID INT,
    Unit VARCHAR(20),
    Is_purchased BOOLEAN DEFAULT FALSE,
    notes TEXT,
    UNIQUE KEY uq_shopping_item (ShoppinglistID, IngredientID),
    FOREIGN KEY (ShoppinglistID) REFERENCES Shopping_List(ShoppingListID),
    FOREIGN KEY (IngredientID) REFERENCES Ingredient(IngredientID)
);


-- user table insert:
INSERT INTO User (first_name, last_name, email, password, phone, status, bio) VALUES
('John', 'Doe', 'john.doe@email.com', 'hash123', '555-0101', 'active', 'Love classic martinis.'),
('Jane', 'Smith', 'jane.smith@email.com', 'hash123', '555-0102', 'active', 'Home bartender enthusiast.'),
('Mike', 'Johnson', 'mike.j@email.com', 'hash123', '555-0103', 'active', 'Looking for low-cal drinks.'),
('Emily', 'Davis', 'emily.d@email.com', 'hash123', '555-0104', 'inactive', 'Professional mixologist.'),
('Chris', 'Brown', 'cbrown@email.com', 'hash123', '555-0105', 'active', 'Whiskey sour fan.'),
('Sarah', 'Miller', 'sarah.m@email.com', 'hash123', '555-0106', 'active', 'Tropical drink lover.'),
('David', 'Wilson', 'david.w@email.com', 'hash123', '555-0107', 'active', 'Gin collector.'),
('Anna', 'Taylor', 'anna.t@email.com', 'hash123', '555-0108', 'active', 'Spicy margarita fan.'),
('James', 'Anderson', 'james.a@email.com', 'hash123', '555-0109', 'active', 'Old Fashioned purist.'),
('Laura', 'Thomas', 'laura.t@email.com', 'hash123', '555-0110', 'active', 'Experimental drinks only.'),
('Robert', 'Jackson', 'robert.j@email.com', 'hash123', '555-0111', 'active', 'Beer and shot guy.'),
('Linda', 'White', 'linda.w@email.com', 'hash123', '555-0112', 'active', 'Wine enthusiast.'),
('Kevin', 'Harris', 'kevin.h@email.com', 'hash123', '555-0113', 'active', 'Negroni expert.'),
('Maria', 'Martin', 'maria.m@email.com', 'hash123', '555-0114', 'active', 'Sours and fizzes.'),
('Jason', 'Thompson', 'jason.t@email.com', 'hash123', '555-0115', 'active', 'Mezcal explorer.'),
('Lisa', 'Garcia', 'lisa.g@email.com', 'hash123', '555-0116', 'active', 'Mocktail specialist.'),
('Brian', 'Martinez', 'brian.m@email.com', 'hash123', '555-0117', 'active', 'Rum diarist.'),
('Karen', 'Robinson', 'karen.r@email.com', 'hash123', '555-0118', 'active', 'Classic cocktail fan.'),
('Steven', 'Clark', 'steven.c@email.com', 'hash123', '555-0119', 'active', 'Bitter flavors lover.'),
('Donna', 'Lewis', 'donna.l@email.com', 'hash123', '555-0120', 'active', 'Sweet and fruity drinks.');

-- Admin user with pre-hashed password (password: admin123)
INSERT INTO User (first_name, last_name, email, password, phone, role, status, bio) VALUES
('Admin', 'User', 'admin@mfh.com', '$2y$10$TdEqF0lllIulAmr3TMGoi..34F8XUwUXQFOOYJGh3vsfs5R35spVm', '555-0000', 'admin', 'active', 'Testing functionality.');


-- ingredient table insert:
INSERT INTO Ingredient (Ingredient_name, category, unit_of_measurement, is_base_spirit) VALUES
('London Dry Gin', 'Spirit', 'oz', 1),
('Bourbon Whiskey', 'Spirit', 'oz', 1),
('White Rum', 'Spirit', 'oz', 1),
('Blanco Tequila', 'Spirit', 'oz', 1),
('Vodka', 'Spirit', 'oz', 1),
('Sweet Vermouth', 'Fortified Wine', 'oz', 0),
('Dry Vermouth', 'Fortified Wine', 'oz', 0),
('Campari', 'Liqueur', 'oz', 0),
('Angostura Bitters', 'Bitters', 'dashes', 0),
('Simple Syrup', 'Syrup', 'oz', 0),
('Fresh Lime Juice', 'Juice', 'oz', 0),
('Fresh Lemon Juice', 'Juice', 'oz', 0),
('Triple Sec', 'Liqueur', 'oz', 0),
('Cointreau', 'Liqueur', 'oz', 0),
('Mezcal', 'Spirit', 'oz', 1),
('Aperol', 'Liqueur', 'oz', 0),
('Club Soda', 'Mixer', 'oz', 0),
('Ginger Beer', 'Mixer', 'oz', 0),
('Orgeat', 'Syrup', 'oz', 0),
('Grenadine', 'Syrup', 'oz', 0);

-- drink table:
INSERT INTO Drink (name, description, recipe, base_spirit_ID, flavor_profile, glassware_type, difficulty, category, created_by_userID) VALUES
('Martini', 'The classic gin martini.', 'Stir gin and vermouth with ice. Strain.', 1, 'Spirit-forward', 'Martini', 'Medium', 'Classic', 1),
('Old Fashioned', 'Whiskey, bitters, and sugar.', 'Muddle sugar/bitters. Add bourbon and ice.', 2, 'Spirit-forward', 'Rocks', 'Easy', 'Classic', 2),
('Daiquiri', 'Simple rum and lime.', 'Shake rum, lime, syrup. Strain.', 3, 'Sour', 'Coupe', 'Easy', 'Classic', 1),
('Margarita', 'Tequila and lime.', 'Shake tequila, lime, triple sec. Salt rim.', 4, 'Sour/Citrus', 'Rocks', 'Easy', 'Classic', 2),
('Negroni', 'Equal parts gin, campari, vermouth.', 'Stir ingredients. Garnish with orange.', 1, 'Bitter', 'Rocks', 'Easy', 'Classic', 13),
('Manhattan', 'Rye/Bourbon with sweet vermouth.', 'Stir whiskey and vermouth. Add bitters.', 2, 'Spirit-forward', 'Coupe', 'Medium', 'Classic', 9),
('Gimlet', 'Gin and lime syrup.', 'Shake gin and lime juice. Serve up.', 1, 'Sour/Sweet', 'Coupe', 'Easy', 'Classic', 7),
('Tom Collins', 'Gin sparkling lemonade.', 'Build in glass with gin, lemon, soda.', 1, 'Refreshing', 'Highball', 'Easy', 'Classic', 1),
('Whiskey Sour', 'Bourbon and citrus.', 'Shake bourbon, lemon, syrup. Optional egg white.', 2, 'Sour', 'Rocks', 'Medium', 'Classic', 5),
('Aperol Spritz', 'Light and bubbly.', 'Build in wine glass with Aperol, prosecco, soda.', 16, 'Bitter/Sweet', 'Wine Glass', 'Easy', 'Modern', 8),
('Paloma', 'Tequila and grapefruit.', 'Mix tequila, lime, grapefruit soda.', 4, 'Citrus', 'Highball', 'Easy', 'Classic', 8),
('Moscow Mule', 'Vodka and ginger.', 'Mix vodka, lime, ginger beer in copper mug.', 5, 'Spicy/Fresh', 'Copper Mug', 'Easy', 'Classic', 11),
('Dark and Stormy', 'Rum and ginger beer.', 'Float dark rum over ginger beer and lime.', 3, 'Spicy', 'Highball', 'Easy', 'Classic', 17),
('Bee’s Knees', 'Gin, honey, and lemon.', 'Shake gin, lemon, honey syrup.', 1, 'Sour/Sweet', 'Coupe', 'Easy', 'Prohibition', 1),
('Sidecar', 'Cognac and lemon.', 'Shake cognac, lemon, triple sec. Sugar rim.', 13, 'Sour', 'Coupe', 'Medium', 'Classic', 4),
('Last Word', 'Equal parts complexity.', 'Shake gin, maraschino, lime, chartreuse.', 1, 'Herbaceous', 'Coupe', 'Hard', 'Classic', 10),
('Mai Tai', 'The ultimate tiki drink.', 'Shake rums, lime, orgeat, curacao.', 3, 'Tropical', 'Rocks', 'Hard', 'Tiki', 6),
('Mojito', 'Mint and rum.', 'Muddle mint. Add rum, lime, sugar, soda.', 3, 'Minty', 'Highball', 'Medium', 'Classic', 1),
('Boulevardier', 'Negroni but with whiskey.', 'Stir bourbon, vermouth, campari.', 2, 'Bitter', 'Rocks', 'Easy', 'Classic', 13),
('Vesper', 'Bond’s drink.', 'Shake gin, vodka, Lillet Blanc.', 1, 'Strong', 'Martini', 'Medium', 'Classic', 1);


-- user inventory insert:
INSERT INTO User_Inventory (UserID, IngredientID, Quantity_owned, Unit) VALUES
(1, 1, 1.0, 'bottle'),
(1, 11, 5.0, 'oz'),
(1, 10, 12.0, 'oz'),
(2, 2, 0.5, 'bottle'),
(2, 9, 1.0, 'bottle'),
(3, 5, 1.0, 'bottle'),
(3, 17, 24.0, 'oz'),
(4, 1, 2.0, 'bottle'),
(5, 2, 1.0, 'bottle'),
(6, 3, 1.0, 'bottle'),
(7, 1, 3.0, 'bottle'),
(8, 4, 1.0, 'bottle'),
(8, 11, 2.0, 'oz'),
(9, 2, 0.75, 'bottle'),
(10, 15, 1.0, 'bottle'),
(11, 5, 2.0, 'bottle'),
(12, 6, 1.0, 'bottle'),
(13, 8, 1.0, 'bottle'),
(14, 12, 10.0, 'oz'),
(15, 15, 0.5, 'bottle');

-- favorites insert:
INSERT INTO Favorite (UserID, DrinkID) VALUES
(1, 1), (1, 3), (1, 5), (2, 2), (2, 4), (3, 12), (4, 16), (5, 9), (6, 17), (7, 5),
(8, 10), (8, 11), (9, 6), (10, 16), (11, 12), (12, 10), (13, 5), (13, 19), (14, 18), (15, 4);


-- drink history insert:
INSERT INTO User_Drink_History (UserID, DrinkID, personal_rating, notes) VALUES
(1, 1, 5, 'Perfectly chilled.'),
(1, 3, 4, 'Slightly too sour.'),
(2, 2, 5, 'Best Old Fashioned yet.'),
(3, 12, 3, 'Ginger beer was flat.'),
(4, 15, 4, 'Great sugar rim.'),
(5, 9, 5, 'Egg white made it creamy.'),
(6, 17, 2, 'Too much ice.'),
(7, 5, 5, 'Love the bitterness.'),
(8, 10, 4, 'Very refreshing.'),
(9, 6, 4, 'Great vermouth pairing.'),
(10, 16, 5, 'Complexity is amazing.'),
(11, 12, 4, 'Good spice level.'),
(12, 10, 3, 'A bit watered down.'),
(13, 5, 5, 'Classic favorite.'),
(14, 18, 4, 'Fresh mint makes it.'),
(15, 4, 5, 'Perfect beach vibe.'),
(16, 8, 4, 'Nice and bubbly.'),
(17, 13, 4, 'Zesty.'),
(18, 1, 5, 'Clean finish.'),
(19, 19, 5, 'Bold and bitter.');

-- shopping list insert:
INSERT INTO Shopping_List (UserID, list_name, status) VALUES
(1, 'Weekend Party', 'active'),
(2, 'Home Stockup', 'active'),
(3, 'Low-Cal Project', 'completed'),
(4, 'Bar Event', 'active'),
(5, 'Birthday Prep', 'active'),
(6, 'Tiki Night', 'active'),
(7, 'Gin Tasting', 'active'),
(8, 'Brunch Supplies', 'completed'),
(9, 'Whiskey Restock', 'active'),
(10, 'Experimental Lab', 'active'),
(11, 'Mule Night', 'active'),
(12, 'Wine & Dine', 'active'),
(13, 'Negroni Week', 'active'),
(14, 'Sour Sunday', 'active'),
(15, 'Mezcal Monday', 'active'),
(16, 'Mocktail Expo', 'active'),
(17, 'Rum Run', 'active'),
(18, 'The Classics', 'active'),
(19, 'Bitter List', 'active'),
(20, 'Fruity Needs', 'active');



