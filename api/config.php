<?php
// Database configuration, remember to run orario_scuola.sql to create the database.
define('DB_HOST', 'localhost'); // default: localhost
define('DB_USERNAME', 'utente'); // default: utente
define('DB_PASSWORD', 'utente'); // default: utente
define('DB_NAME', 'orario_scuola'); // default: orario_scuola

// Function for database connection
function getDbConnection() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USERNAME,
            DB_PASSWORD,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Database connection failed: ' . $e->getMessage()
        ]);
        exit();
    }
}
?>