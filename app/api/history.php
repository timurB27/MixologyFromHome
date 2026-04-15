<?php
include '../db_connect.php';
include 'BaseController.php';
header('Content-Type: application/json');

$fields = ['UserID', 'DrinkID', 'personal_rating', 'notes'];
$controller = new BaseController($conn, "User_Drink_History", "HistoryID", $fields);
$controller->handleRequest($_SERVER['REQUEST_METHOD']);
