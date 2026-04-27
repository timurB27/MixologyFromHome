<?php
include __DIR__ . '/../db_connect.php';
include __DIR__ . '/BaseController.php';
header('Content-Type: application/json');

$fields = ['ShoppinglistID', 'IngredientID', 'Unit', 'Is_purchased', 'notes'];

class ShoppingItemsController extends BaseController {
    protected function read() {
        $isAdmin = ($_SESSION['role'] ?? '') === 'admin';
        if ($isAdmin) {
            $result = $this->conn->query("SELECT * FROM `{$this->tableName}`");
            echo json_encode($result->fetch_all(MYSQLI_ASSOC));
        } else {
            $uid = $_SESSION['user_id'];
            $stmt = $this->conn->prepare("
                SELECT sli.* FROM `{$this->tableName}` sli
                JOIN Shopping_List sl ON sli.ShoppinglistID = sl.ShoppingListID
                WHERE sl.UserID = ?
            ");
            $stmt->bind_param("i", $uid);
            $stmt->execute();
            echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
        }
    }
}

$controller = new ShoppingItemsController($conn, "Shopping_List_Item", "RowID", $fields);
$controller->handleRequest($_SERVER['REQUEST_METHOD']);
