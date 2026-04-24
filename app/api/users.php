<?php
include __DIR__ . '/../db_connect.php';
include __DIR__ . '/BaseController.php';
header('Content-Type: application/json');

// Only admins can create, edit, or delete users
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && ($_SESSION['role'] ?? '') !== 'admin') {
    echo json_encode(["status" => "error", "message" => "Admin access required."]);
    exit;
}

class UserController extends BaseController {
    // We can "Override" the upsert method specifically for Users!
    protected function upsert() {
        if (isset($_POST['password'])) {
            // Password Hashing (The Java-style "Override")
            $_POST['password'] = password_hash($_POST['password'], PASSWORD_DEFAULT);
        }
        parent::upsert(); // Then call the original logic
    }
}

$controller = new UserController(
    $conn,
    "User",
    "UserID",
    ['first_name', 'last_name', 'email', 'password', 'phone', 'role', 'status', 'bio']
);

$controller->handleRequest($_SERVER['REQUEST_METHOD']);
