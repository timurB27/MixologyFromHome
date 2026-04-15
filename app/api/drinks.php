<?php
include __DIR__ . '/../db_connect.php';
include __DIR__ . '/BaseController.php';
header('Content-Type: application/json');

$fields = ['name', 'description', 'recipe', 'base_spirit_ID', 'flavor_profile', 'glassware_type', 'difficulty', 'category', 'created_by_userID'];
$controller = new BaseController($conn, "Drink", "DrinkID", $fields);
$controller->handleRequest($_SERVER['REQUEST_METHOD']);
