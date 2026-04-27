<?php
include __DIR__ . '/../db_connect.php';
include __DIR__ . '/BaseController.php';
header('Content-Type: application/json');

$fields = ['DrinkID', 'IngredientID', 'Quantity', 'Unit', 'Preperation_note', 'Ingredient_order'];
$controller = new BaseController($conn, "Drink_Ingredient", "RowID", $fields);
$controller->handleRequest($_SERVER['REQUEST_METHOD']);
