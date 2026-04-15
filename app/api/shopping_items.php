<?php
include '../db_connect.php';
include 'BaseController.php';
header('Content-Type: application/json');

$fields = ['ShoppinglistID', 'IngredientID', 'Unit', 'Is_purchased', 'notes'];
$controller = new BaseController($conn, "Shopping_List_Item", "ShoppinglistID", $fields);
$controller->handleRequest($_SERVER['REQUEST_METHOD']);
