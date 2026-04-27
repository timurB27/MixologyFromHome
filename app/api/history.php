<?php
include __DIR__ . '/../db_connect.php';
include __DIR__ . '/BaseController.php';
header('Content-Type: application/json');

$fields = ['DrinkID', 'personal_rating', 'notes'];
$controller = new BaseController($conn, "User_Drink_History", "HistoryID", $fields, "UserID");
$controller->handleRequest($_SERVER['REQUEST_METHOD']);
