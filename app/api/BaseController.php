<?php
/**
 * THE ENGINE (BaseController)
 * This class handles all the SQL heavy lifting so we don't have to write
 * "INSERT INTO..." or "UPDATE..." 50 different times.
 */
class BaseController {
    protected $conn;      // The Database connection
    protected $tableName; // Which table are we talking to?
    protected $idField;   // What is the Primary Key (e.g., UserID)?
    protected $fields;    // Which columns are we allowed to touch?

    public function __construct($db, $tableName, $idField, $fields) {
        $this->conn = $db;
        $this->tableName = $tableName;
        $this->idField = $idField;
        $this->fields = $fields;
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
     * READ (GET): Fetches every row from the table.
     */
    protected function read() {
        $result = $this->conn->query("SELECT * FROM `{$this->tableName}`");
        echo json_encode($result->fetch_all(MYSQLI_ASSOC));
    }

    /**
     * UPSERT (POST): A combination of UPDATE and INSERT.
     * If an 'id' is sent from JavaScript, it updates that record.
     * If no 'id' is sent, it creates a new record.
     */
    protected function upsert() {
        $id = $_POST['id'] ?? null;
        $setClause = [];
        $types = "";
        $values = [];

        // Loop through our allowed fields and see what the Frontend sent us
        foreach ($this->fields as $f) {
            if (isset($_POST[$f])) {
                $setClause[] = "`$f` = ?";
                $types .= "s"; // Treat as string
                $values[] = $_POST[$f];
            }
        }

        if ($id) {
            // UPDATE Logic
            $sql = "UPDATE `{$this->tableName}` SET " . implode(', ', $setClause) . " WHERE `{$this->idField}` = ?";
            $types .= "i"; // Add integer type for the ID
            $values[] = $id;
        } else {
            // INSERT Logic
            $cols = implode(', ', array_keys(array_intersect_key(array_flip($this->fields), $_POST)));
            $placeholders = implode(', ', array_fill(0, count($values), '?'));
            $sql = "INSERT INTO `{$this->tableName}` ($cols) VALUES ($placeholders)";
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
     * DELETE: Removes a record by its ID.
     */
    protected function delete() {
        // Grab 'id' from the URL (e.g., api/users.php?id=10)
        $id = $_GET['id'] ?? null;

        if (!$id) {
            echo json_encode(["status" => "error", "message" => "No ID provided"]);
            return;
        }

        // We use backticks `` around table/field names to prevent SQL reserved word errors
        $sql = "DELETE FROM `{$this->tableName}` WHERE `{$this->idField}` = ?";
        $stmt = $this->conn->prepare($sql);
        
        if (!$stmt) {
             echo json_encode(["status" => "error", "message" => "SQL Prepare failed: " . $this->conn->error]);
             return;
        }

        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            // IMPORTANT: Changed from "deleted" to "success" to match JS expectations!
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }
}