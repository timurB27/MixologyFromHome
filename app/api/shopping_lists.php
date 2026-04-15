<?php
include '../db_connect.php';
include 'BaseController.php';
header('Content-Type: application/json');

$fields = ['UserID', 'list_name', 'status'];
$controller = new BaseController($conn, "Shopping_List", "ShoppingListID", $fields);
$controller->handleRequest($_SERVER['REQUEST_METHOD']);
