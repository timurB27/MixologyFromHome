<?php
session_start();
// Protect all API routes — must be logged in
if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}
/**
 * THE ENGINE (BaseController)
 * This class handles all the SQL heavy lifting so we don't have to write
 * "INSERT INTO..." or "UPDATE..." 50 different times.
 */
class BaseController {
    protected $conn;        // The Database connection
    protected $tableName;   // Which table are we talking to?
    protected $idField;     // What is the Primary Key (e.g., UserID)?
    protected $fields;      // Which columns are we allowed to touch?
    protected $userFilter;  // Column name to filter/own by session user (e.g., "UserID"), or null

    public function __construct($db, $tableName, $idField, $fields, $userFilter = null) {
        $this->conn = $db;
        $this->tableName = $tableName;
        $this->idField = $idField;
        $this->fields = $fields;
        $this->userFilter = $userFilter;
    }

    /**
     * ROUTER: This looks at the HTTP Method (GET, POST, DELETE)
     * and sends the request to the right function below.
     */
    public function handleRequest($method) {
        try {
            if ($method === 'GET') $this->read();
            elseif ($method === 'POST') $this->upsert();
            elseif ($method === 'DELETE') $this->delete();
        } catch (Exception $e) {
            // If anything goes wrong, send a JSON error instead of crashing with HTML
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }

    /**
     * READ (GET): Fetches rows from the table, filtered to session user if userFilter is set.
     */
    protected function read() {
        if ($this->userFilter) {
            $uid = $_SESSION['user_id'];
            $stmt = $this->conn->prepare("SELECT * FROM `{$this->tableName}` WHERE `{$this->userFilter}` = ?");
            $stmt->bind_param("i", $uid);
            $stmt->execute();
            $result = $stmt->get_result();
            echo json_encode($result->fetch_all(MYSQLI_ASSOC));
        } else {
            $result = $this->conn->query("SELECT * FROM `{$this->tableName}`");
            echo json_encode($result->fetch_all(MYSQLI_ASSOC));
        }
    }

    /**
     * UPSERT (POST): A combination of UPDATE and INSERT.
     * If an 'id' is sent from JavaScript, it updates that record.
     * If no 'id' is sent, it creates a new record.
     * When userFilter is set, UserID is auto-injected from session (not from POST data).
     */
    protected function upsert() {
        $id = $_POST['id'] ?? null;
        $setClause = [];
        $cols = [];
        $types = "";
        $values = [];

        // Loop through our allowed fields and see what the Frontend sent us
        foreach ($this->fields as $f) {
            if (isset($_POST[$f])) {
                $setClause[] = "`$f` = ?";
                $cols[] = "`$f`";
                $types .= "s";
                $values[] = $_POST[$f];
            }
        }

        // Auto-inject ownership column on INSERT when userFilter is active
        if ($this->userFilter && !$id) {
            $setClause[] = "`{$this->userFilter}` = ?";
            $cols[] = "`{$this->userFilter}`";
            $types .= "i";
            $values[] = $_SESSION['user_id'];
        }

        if ($id) {
            // UPDATE Logic — also enforce ownership if userFilter is set
            $sql = "UPDATE `{$this->tableName}` SET " . implode(', ', $setClause) . " WHERE `{$this->idField}` = ?";
            $types .= "i";
            $values[] = $id;
            if ($this->userFilter) {
                $sql .= " AND `{$this->userFilter}` = ?";
                $types .= "i";
                $values[] = $_SESSION['user_id'];
            }
        } else {
            // INSERT Logic
            $placeholders = implode(', ', array_fill(0, count($values), '?'));
            $sql = "INSERT INTO `{$this->tableName}` (" . implode(', ', $cols) . ") VALUES ($placeholders)";
        }

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param($types, ...$values);

        if ($stmt->execute()) {
            // Always return "success" so the JavaScript 'saveData' knows it worked
            echo json_encode(["status" => "success", "id" => $id ?: $this->conn->insert_id]);
        } else {
            echo json_encode(["status" => "error", "message" => $this->conn->error]);
        }
    }

    /**
     * DELETE: Removes a record by its ID, enforcing ownership if userFilter is set.
     */
    protected function delete() {
        // Grab 'id' from the URL (e.g., api/users.php?id=10)
        $id = $_GET['id'] ?? null;

        if (!$id) {
            echo json_encode(["status" => "error", "message" => "No ID provided"]);
            return;
        }

        $sql = "DELETE FROM `{$this->tableName}` WHERE `{$this->idField}` = ?";
        $types = "i";
        $params = [$id];

        if ($this->userFilter) {
            $sql .= " AND `{$this->userFilter}` = ?";
            $types .= "i";
            $params[] = $_SESSION['user_id'];
        }

        $stmt = $this->conn->prepare($sql);

        if (!$stmt) {
             echo json_encode(["status" => "error", "message" => "SQL Prepare failed: " . $this->conn->error]);
             return;
        }

        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }
}
