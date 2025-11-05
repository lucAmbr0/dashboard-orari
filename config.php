<?php
// Configurazione database
define('DB_HOST', 'localhost');
define('DB_USERNAME', 'root'); // cambia con il tuo username
define('DB_PASSWORD', ''); // cambia con la tua password  
define('DB_NAME', 'orario_scuola'); // Database creato con create_database.sql

// Funzione per connessione database
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