<?php
// Database credentials for Docker
$host = 'db'; // This matches the service name in docker-compose.yml
$db   = 'project_db';
$user = 'root';
$pass = 'root_password';

// Create connection
$conn = new mysqli($host, $user, $pass, $db);

// Check connection
if ($conn->connect_error) {
    // We send a JSON error so the Frontend knows what happened
    header('Content-Type: application/json');
    die(json_encode([
        "status" => "error", 
        "message" => "Connection failed: " . $conn->connect_error
    ]));
}

// Ensure UTF-8 for special characters in drink names
$conn->set_charset("utf8mb4");
?>