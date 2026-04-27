<?php
include __DIR__ . '/../db_connect.php';
include __DIR__ . '/BaseController.php'; // runs session_start() + auth check
header('Content-Type: application/json');

$user_id = $_SESSION['user_id'];

// Report 1: Drinks the logged-in user can make with their current pantry.
// A drink qualifies when every ingredient in its recipe exists in the user's
// inventory with Quantity_owned > 0.  Drinks with no recipe defined are excluded.
$stmt = $conn->prepare("
    SELECT d.name, d.difficulty, d.category, d.flavor_profile
    FROM Drink d
    WHERE d.DrinkID IN (SELECT DISTINCT DrinkID FROM Drink_Ingredient)
    AND NOT EXISTS (
        SELECT 1
        FROM Drink_Ingredient di
        LEFT JOIN User_Inventory ui
            ON ui.IngredientID = di.IngredientID AND ui.UserID = ?
        WHERE di.DrinkID = d.DrinkID
          AND (ui.IngredientID IS NULL OR ui.Quantity_owned <= 0)
    )
    ORDER BY d.name
");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$can_make = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

// Report 2: Top 10 most favorited drinks across all users.
$popular = $conn->query("
    SELECT d.name, COUNT(f.UserID) AS fav_count
    FROM Drink d
    JOIN Favorite f ON d.DrinkID = f.DrinkID
    GROUP BY d.DrinkID, d.name
    ORDER BY fav_count DESC
    LIMIT 10
")->fetch_all(MYSQLI_ASSOC);

// Report 3: Drinks ranked by average personal rating from history entries.
$top_rated = $conn->query("
    SELECT d.name, ROUND(AVG(h.personal_rating), 1) AS avg_rating, COUNT(h.HistoryID) AS times_made
    FROM Drink d
    JOIN User_Drink_History h ON d.DrinkID = h.DrinkID
    GROUP BY d.DrinkID, d.name
    ORDER BY avg_rating DESC
")->fetch_all(MYSQLI_ASSOC);

echo json_encode([
    'can_make'  => $can_make,
    'popular'   => $popular,
    'top_rated' => $top_rated
]);
