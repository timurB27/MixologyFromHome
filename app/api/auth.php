<?php
session_start();
include '../db_connect.php';
header('Content-Type: application/json');

$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($action === 'login') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    // Use prepared statement to prevent SQL injection
    $stmt = $conn->prepare("SELECT UserID, first_name, role, password FROM User WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();

    if ($result && password_verify($password, $result['password'])) {
        $_SESSION['user_id'] = $result['UserID'];
        $_SESSION['user_name'] = $result['first_name'];
        $_SESSION['role'] = $result['role'];
        echo json_encode([
            "status" => "success",
            "name" => $result['first_name'],
            "role" => $result['role']
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
    }

} elseif ($action === 'logout') {
    session_destroy();
    echo json_encode(["status" => "success"]);

} elseif ($action === 'check') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            "status" => "logged_in",
            "name" => $_SESSION['user_name'],
            "role" => $_SESSION['role']
        ]);
    } else {
        echo json_encode(["status" => "logged_out"]);
    }
}
