<?php
include __DIR__ . '/../db_connect.php';
include __DIR__ . '/BaseController.php';
header('Content-Type: application/json');

// IngredientController inherits all methods (read, upsert, delete) from BaseController
class IngredientController extends BaseController {
}

// Create the instance with Ingredient-specific settings
$controller = new IngredientController(
    $conn, 
    "Ingredient", 
    "IngredientID", 
    ['Ingredient_name', 'category', 'unit_of_measurement', 'is_base_spirit']
);

$controller->handleRequest($_SERVER['REQUEST_METHOD']);
