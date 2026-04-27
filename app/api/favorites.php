<?php
include __DIR__ . '/../db_connect.php';
include __DIR__ . '/BaseController.php';
header('Content-Type: application/json');

$fields = ['DrinkID'];
$controller = new BaseController($conn, "Favorite", "RowID", $fields, "UserID");
$controller->handleRequest($_SERVER['REQUEST_METHOD']);
