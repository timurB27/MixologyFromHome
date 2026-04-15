<?php
include '../db_connect.php';
include 'BaseController.php';
header('Content-Type: application/json');

$fields = ['UserID', 'DrinkID'];
$controller = new BaseController($conn, "Favorite", "UserID", $fields);
$controller->handleRequest($_SERVER['REQUEST_METHOD']);
