<?php
include __DIR__ . '/../db_connect.php';
include __DIR__ . '/BaseController.php';
header('Content-Type: application/json');

$fields = ['ShoppinglistID', 'IngredientID', 'Unit', 'Is_purchased', 'notes'];
$controller = new BaseController($conn, "Shopping_List_Item", "RowID", $fields);
$controller->handleRequest($_SERVER['REQUEST_METHOD']);
