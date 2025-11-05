<?php
require_once 'config.php';

// Imposta header per JSON
header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = getDbConnection(); // Connessione al database

    // Parametro orario e giorno dalla query string (es: ?orario=08h00&giorno=lunedì)
    $orario_richiesto = $_GET['orario'] ?? null;
    $giorno_richiesto = $_GET['giorno'] ?? null;

    //errore se non orario e giorno != null
    if (!$orario_richiesto || !$giorno_richiesto) {
        echo json_encode([
            'success' => false,
            'error' => 'Parametri "orario" e "giorno" richiesti. Esempio: ?orario=08h00&giorno=lunedì',
        ]);
        exit();
    }
    // validità dell'orario (formattazione: 08h00)
    if (!preg_match('/^\d{2}h\d{2}$/', $orario_richiesto)) {
        echo json_encode([
            'success' => false,
            'error' => 'Formato orario non valido. Usa formato es. 08h00',
        ]);
        exit();
    }
    //validità del giorno (accettati: lunedì martedì mercoledì giovedì venerdì)
    $giorni_validi = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì'];
    if (!in_array($giorno_richiesto, $giorni_validi)) {
        echo json_encode([
            'success' => false,
            'error' => 'Giorno non valido. Giorni accettati: lunedì, martedì, mercoledì, giovedì, venerdì',
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
    $orario_param = "%" . $orario_richiesto . "%"; // %% per usare LIKE per flessibilità (presenza di \n negli orari. sono pigro non voglio toglierli)
    $stmt->bindValue(':orario', $orario_param, PDO::PARAM_STR);
    $stmt->bindValue(':giorno', $giorno_richiesto, PDO::PARAM_STR);
    $stmt->execute();

    $results = $stmt->fetchAll();

    // Prepara la risposta JSON
    $response = [
        'success' => true,
        'orario_richiesto' => $orario_richiesto,
        'giorno_richiesto' => $giorno_richiesto,
        'count' => count($results),
        'classi' => $results
    ];

    // messaggio di warning se non ci sono orari
    if (count($results) == 0) {
        $response['message'] = 'Nessuna lezione trovata per l\'orario ' . $orario_richiesto .
            ' del giorno ' . $giorno_richiesto;
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