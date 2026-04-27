<?php
include __DIR__ . '/../db_connect.php';
include __DIR__ . '/BaseController.php';
header('Content-Type: application/json');

$fields = ['list_name', 'status'];
$controller = new BaseController($conn, "Shopping_List", "ShoppingListID", $fields, "UserID");
$controller->handleRequest($_SERVER['REQUEST_METHOD']);
