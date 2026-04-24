<?php
session_start();
include __DIR__ . '/../db_connect.php';
header('Content-Type: application/json');

$action = $_POST['action'] ?? $_GET['action'] ?? '';

// ── LOGIN ────────────────────────────────────────────────────
if ($action === 'login') {
    $email    = $_POST['email']    ?? '';
    $password = $_POST['password'] ?? '';

    $stmt = $conn->prepare("SELECT UserID, first_name, role, password FROM User WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();

    if ($result && password_verify($password, $result['password'])) {
        $_SESSION['user_id']   = $result['UserID'];
        $_SESSION['user_name'] = $result['first_name'];
        $_SESSION['role']      = $result['role'];
        echo json_encode([
            "status" => "success",
            "name"   => $result['first_name'],
            "role"   => $result['role']
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid email or password."]);
    }

// ── SIGNUP ───────────────────────────────────────────────────
} elseif ($action === 'signup') {
    $first_name = $_POST['first_name'] ?? '';
    $last_name  = $_POST['last_name']  ?? '';
    $email      = $_POST['email']      ?? '';
    $password   = $_POST['password']   ?? '';

    if (!$first_name || !$last_name || !$email || !$password) {
        echo json_encode(["status" => "error", "message" => "All fields are required."]);
        exit;
    }

    // Check if email already exists
    $check = $conn->prepare("SELECT UserID FROM User WHERE email = ?");
    $check->bind_param("s", $email);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        echo json_encode(["status" => "error", "message" => "That email is already registered."]);
        exit;
    }

    // Hash the password — never store plain text
    $hashed = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare(
        "INSERT INTO User (first_name, last_name, email, password, role, status) VALUES (?, ?, ?, ?, 'user', 'active')"
    );
    $stmt->bind_param("ssss", $first_name, $last_name, $email, $hashed);

    if ($stmt->execute()) {
        // Auto-login after signup
        $_SESSION['user_id']   = $conn->insert_id;
        $_SESSION['user_name'] = $first_name;
        $_SESSION['role']      = 'user';
        echo json_encode([
            "status" => "success",
            "name"   => $first_name,
            "role"   => "user"
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Could not create account. Try again."]);
    }

// ── LOGOUT ───────────────────────────────────────────────────
} elseif ($action === 'logout') {
    session_destroy();
    echo json_encode(["status" => "success"]);

// ── CHECK SESSION ────────────────────────────────────────────
} elseif ($action === 'check') {
    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            "status" => "logged_in",
            "name"   => $_SESSION['user_name'],
            "role"   => $_SESSION['role']
        ]);
    } else {
        echo json_encode(["status" => "logged_out"]);
    }

// ── CHANGE PASSWORD ──────────────────────────────────────────
} elseif ($action === 'change_password') {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(["status" => "error", "message" => "Not logged in."]);
        exit;
    }

    $current  = $_POST['current_password'] ?? '';
    $new_pass = $_POST['new_password']      ?? '';
    $confirm  = $_POST['confirm_password']  ?? '';

    if (!$current || !$new_pass || !$confirm) {
        echo json_encode(["status" => "error", "message" => "All fields are required."]);
        exit;
    }
    if ($new_pass !== $confirm) {
        echo json_encode(["status" => "error", "message" => "New passwords do not match."]);
        exit;
    }
    if (strlen($new_pass) < 6) {
        echo json_encode(["status" => "error", "message" => "Password must be at least 6 characters."]);
        exit;
    }

    $user_id = $_SESSION['user_id'];
    $stmt = $conn->prepare("SELECT password FROM User WHERE UserID = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if (!$row || !password_verify($current, $row['password'])) {
        echo json_encode(["status" => "error", "message" => "Current password is incorrect."]);
        exit;
    }

    $hashed = password_hash($new_pass, PASSWORD_DEFAULT);
    $upd = $conn->prepare("UPDATE User SET password = ? WHERE UserID = ?");
    $upd->bind_param("si", $hashed, $user_id);

    if ($upd->execute()) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Could not update password."]);
    }
}
?>
