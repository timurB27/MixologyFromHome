<?php
include '../db_connect.php';
include 'BaseController.php';
header('Content-Type: application/json');

$fields = ['UserID', 'IngredientID', 'Quantity_owned', 'Unit'];
$controller = new BaseController($conn, "User_Inventory", "UserID", $fields);
$controller->handleRequest($_SERVER['REQUEST_METHOD']);
