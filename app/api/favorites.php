<?php
include __DIR__ . '/../db_connect.php';
include __DIR__ . '/BaseController.php';
header('Content-Type: application/json');

$fields = ['UserID', 'DrinkID'];
$controller = new BaseController($conn, "Favorite", "UserID", $fields);
$controller->handleRequest($_SERVER['REQUEST_METHOD']);
