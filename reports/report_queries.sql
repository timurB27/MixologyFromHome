-- ============================================================
-- Mixology From Home — Report Queries
-- These are executed live by app/api/reports.php
-- ============================================================

-- Report 1: Drinks the logged-in user can make right now
-- Uses a correlated NOT EXISTS subquery to find drinks whose
-- full ingredient list is covered by the user's pantry (User_Inventory).
-- Only considers drinks that have at least one Drink_Ingredient row.
SELECT d.name, d.difficulty, d.category, d.flavor_profile
FROM Drink d
WHERE d.DrinkID IN (SELECT DISTINCT DrinkID FROM Drink_Ingredient)
AND NOT EXISTS (
    SELECT 1 FROM Drink_Ingredient di
    WHERE di.DrinkID = d.DrinkID
    AND di.IngredientID NOT IN (
        SELECT IngredientID FROM User_Inventory WHERE UserID = :user_id
    )
)
ORDER BY d.name;


-- Report 2: Top 10 most favorited drinks across all users
-- Uses GROUP BY + COUNT aggregate and a JOIN between Drink and Favorite.
SELECT d.name, COUNT(f.UserID) AS fav_count
FROM Drink d
JOIN Favorite f ON d.DrinkID = f.DrinkID
GROUP BY d.DrinkID, d.name
ORDER BY fav_count DESC
LIMIT 10;


-- Report 3: Drinks ranked by average personal rating
-- Uses GROUP BY + AVG aggregate and a JOIN to User_Drink_History.
-- Rounds the average to one decimal place.
SELECT d.name,
       ROUND(AVG(h.personal_rating), 1) AS avg_rating,
       COUNT(h.HistoryID) AS times_made
FROM Drink d
JOIN User_Drink_History h ON d.DrinkID = h.DrinkID
GROUP BY d.DrinkID, d.name
ORDER BY avg_rating DESC;
