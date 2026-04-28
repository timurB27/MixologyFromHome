<?php
include __DIR__ . '/../db_connect.php';
include __DIR__ . '/BaseController.php';
header('Content-Type: application/json');

class HistoryController extends BaseController {
    protected function delete() {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            echo json_encode(["status" => "error", "message" => "No ID provided"]);
            return;
        }

        $isAdmin = ($_SESSION['role'] ?? '') === 'admin';
        $sessionUserId = (int)$_SESSION['user_id'];

        // Fetch the record first to get DrinkID and ownership info
        $stmt = $this->conn->prepare("SELECT UserID, DrinkID FROM `{$this->tableName}` WHERE `{$this->idField}` = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();

        if (!$row) {
            echo json_encode(["status" => "error", "message" => "Record not found"]);
            return;
        }

        $rowUserId  = (int)$row['UserID'];
        $rowDrinkId = (int)$row['DrinkID'];

        if (!$isAdmin && $rowUserId !== $sessionUserId) {
            echo json_encode(["status" => "error", "message" => "Unauthorized"]);
            return;
        }

        // Cascade: remove the matching favorite for this user + drink
        $delFav = $this->conn->prepare("DELETE FROM Favorite WHERE UserID = ? AND DrinkID = ?");
        $delFav->bind_param("ii", $rowUserId, $rowDrinkId);
        $delFav->execute();

        // Delete the history record
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

$fields = ['DrinkID', 'personal_rating', 'notes'];
$controller = new HistoryController($conn, "User_Drink_History", "HistoryID", $fields, "UserID");
$controller->handleRequest($_SERVER['REQUEST_METHOD']);
