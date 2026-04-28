<?php
include __DIR__ . '/../db_connect.php';
include __DIR__ . '/BaseController.php';
header('Content-Type: application/json');

class ShoppingListController extends BaseController {
    protected function delete() {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            echo json_encode(["status" => "error", "message" => "No ID provided"]);
            return;
        }

        $isAdmin = ($_SESSION['role'] ?? '') === 'admin';
        $sessionUserId = (int)$_SESSION['user_id'];

        // Verify the list exists and check ownership
        $stmt = $this->conn->prepare("SELECT UserID FROM `{$this->tableName}` WHERE `{$this->idField}` = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();

        if (!$row) {
            echo json_encode(["status" => "error", "message" => "Record not found"]);
            return;
        }

        if (!$isAdmin && (int)$row['UserID'] !== $sessionUserId) {
            echo json_encode(["status" => "error", "message" => "Unauthorized"]);
            return;
        }

        // Delete all items in this list first (bypasses FK constraint)
        $delItems = $this->conn->prepare("DELETE FROM Shopping_List_Item WHERE ShoppinglistID = ?");
        $delItems->bind_param("i", $id);
        $delItems->execute();

        // Now delete the list itself
        $stmt2 = $this->conn->prepare("DELETE FROM `{$this->tableName}` WHERE `{$this->idField}` = ?");
        if (!$stmt2) {
            echo json_encode(["status" => "error", "message" => "SQL error: " . $this->conn->error]);
            return;
        }
        $stmt2->bind_param("i", $id);

        if ($stmt2->execute()) {
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt2->error]);
        }
    }
}

$fields = ['list_name', 'status'];
$controller = new ShoppingListController($conn, "Shopping_List", "ShoppingListID", $fields, "UserID");
$controller->handleRequest($_SERVER['REQUEST_METHOD']);
