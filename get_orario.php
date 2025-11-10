<?php
require_once 'config.php';

// Set header for JSON
header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = getDbConnection(); // Database connection

    // Parameters "orario" and "giorno" from query string (e.g., ?orario=08h00&giorno=lunedì)
    $requested_time = $_GET['orario'] ?? null;
    $requested_day = $_GET['giorno'] ?? null;

    // Error if "orario" and "giorno" are null
    if (!$requested_time || !$requested_day) {
        echo json_encode([
            'success' => false,
            'error' => 'Parameters "orario" and "giorno" are required. Example: ?orario=08h00&giorno=lunedì',
        ]);
        exit();
    }
    // Validate time format (format: 08h00)
    if (!preg_match('/^\d{2}h\d{2}$/', $requested_time)) {
        echo json_encode([
            'success' => false,
            'error' => 'Invalid time format. Use format e.g., 08h00',
        ]);
        exit();
    }
    // Validate day (accepted: lunedì, martedì, mercoledì, giovedì, venerdì)
    $valid_days = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì'];
    if (!in_array($requested_day, $valid_days)) {
        echo json_encode([
            'success' => false,
            'error' => 'Invalid day. Accepted days: lunedì, martedì, mercoledì, giovedì, venerdì',
        ]);
        exit();
    }

    $query = "
        SELECT *
        FROM orario 
        WHERE GIORNO = :giorno AND O_INIZIO LIKE :orario
        ORDER BY GIORNO ASC, CLASSE ASC
    ";

    $stmt = $pdo->prepare($query);
    $time_param = "%" . $requested_time . "%"; // %% to use LIKE for flexibility (presence of \n in times. I'm lazy and don't want to remove them)
    $stmt->bindValue(':orario', $time_param, PDO::PARAM_STR);
    $stmt->bindValue(':giorno', $requested_day, PDO::PARAM_STR);
    $stmt->execute();

    $results = $stmt->fetchAll();

    // Prepare JSON response
    $response = [
        'success' => true,
        'requested_time' => $requested_time,
        'requested_day' => $requested_day,
        'count' => count($results),
        'classi' => $results
    ];

    // Warning message if no schedules are found
    if (count($results) == 0) {
        $response['message'] = 'No lessons found for time ' . $requested_time .
            ' on day ' . $requested_day;
    }

    // Output JSON
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage(),
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage(),
    ]);
}
?>