<?php
require_once 'config.php';

// Set header for JSON
header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = getDbConnection(); // Database connection
    $secretToken = "12345";

    // Accept uploaded file from HTML form field `file` (multipart/form-data)
    if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
        echo json_encode(["success" => false, "error" => "File CSV non ricevuto. Invia il file con campo 'file'."]);
        exit;
    }


    $tmpFile = $_FILES['file']['tmp_name'];

    // Token validation: require POST field 'token' equal to '12345'
    $token = isset($_POST['token']) ? $_POST['token'] : null;
    if ($token !== $secretToken) {
        http_response_code(403);
        echo json_encode(["success" => false, "error" => "Invalid token"]);
        exit;
    }

    // Processing rules copied/adapted from scripts/process_csv.py
    $SCHOOL_TIMES = [
        "08h00",
        "08h55",
        "10h00",
        "10h55",
        "11h55",
        "13h00",
        "13h50",
    ];

    // Helpers
    function remove_accents($text) {
        if ($text === null) return $text;
        $map = [
            'ì' => 'i', 'Í' => 'i', 'í' => 'i', 'Ì' => 'i',
        ];
        $res = strtr($text, $map);
        // lowercase as in python version
        return mb_strtolower(trim($res), 'UTF-8');
    }

    function clean_aula($aula_value) {
        if ($aula_value === null) return $aula_value;
        // remove "PLESSO A/B/C/D" case-insensitive
        $cleaned = preg_replace('/\s+PLESSO\s+[A-D]/iu', '', $aula_value);
        return trim($cleaned);
    }

    // Read CSV
    $processed_rows = [];
    $existing_nums = [];

    if (($handle = fopen($tmpFile, 'r')) === false) {
        echo json_encode(["success" => false, "error" => "Impossibile aprire file CSV caricato."]);
        exit;
    }

    // Read header and normalize: replace dots/spaces with underscore and uppercase
    $header = fgetcsv($handle, 0, ';');
    if ($header === false) {
        fclose($handle);
        echo json_encode(["success" => false, "error" => "CSV vuoto o intestazione non valida."]);
        exit;
    }

    $normalizedHeader = [];
    foreach ($header as $h) {
        $hnorm = strtoupper(str_replace(['.', ' '], '_', trim($h)));
        $normalizedHeader[] = $hnorm;
    }

    // Read all input rows
    $input_rows = [];
    while (($data = fgetcsv($handle, 0, ';')) !== false) {
        // build assoc with normalized keys
        $row = [];
        foreach ($normalizedHeader as $i => $colName) {
            $row[$colName] = isset($data[$i]) ? trim($data[$i]) : '';
        }
        $input_rows[] = $row;

        // collect NUMERO if integer
        if (isset($row['NUMERO'])) {
            $num = intval($row['NUMERO']);
            if ($num > 0) $existing_nums[] = $num;
        }
    }
    fclose($handle);

    $next_available = !empty($existing_nums) ? (max($existing_nums) + 1) : 1;

    // Process rows following original python logic
    foreach ($input_rows as $row) {
        $aula_val = isset($row['AULA']) ? $row['AULA'] : '';
        $mat_val = isset($row['MAT_NOME']) ? $row['MAT_NOME'] : '';

        if (trim($aula_val) === '' || mb_strtolower(trim($mat_val), 'UTF-8') === 'disposizione') {
            // skip
            continue;
        }

        // NUMERO fallback
        $raw_num = isset($row['NUMERO']) ? $row['NUMERO'] : '';
        $original_num = intval($raw_num);
        if ($original_num <= 0) {
            $original_num = $next_available;
            $next_available += 1;
        }

        // DURATA -> hours
        $durata = isset($row['DURATA']) ? $row['DURATA'] : '';
        $hours = 0;
        if ($durata !== '') {
            $parts = explode('h', $durata);
            if (is_array($parts) && intval($parts[0]) > 0) {
                $hours = intval($parts[0]);
            }
        }
        if ($hours <= 0) $hours = 1; // fallback

        $start_time = isset($row['O_INIZIO']) ? $row['O_INIZIO'] : (isset($row['O.INIZIO']) ? $row['O.INIZIO'] : '');
        $start_time = trim($start_time);
        $start_index = array_search($start_time, $SCHOOL_TIMES, true);

        if ($hours <= 1 || $start_index === false) {
            $out_row = [
                'NUMERO' => $original_num,
                'CLASSE' => isset($row['CLASSE']) ? $row['CLASSE'] : '',
                'AULA' => clean_aula(isset($row['AULA']) ? $row['AULA'] : ''),
                'GIORNO' => remove_accents(isset($row['GIORNO']) ? $row['GIORNO'] : ''),
                'O_INIZIO' => $start_time
            ];
            $processed_rows[] = $out_row;
        } else {
            for ($i = 0; $i < $hours; $i++) {
                $idx = $start_index + $i;
                if ($idx >= count($SCHOOL_TIMES)) {
                    // cannot map further chunks; stop splitting
                    break;
                }
                $chunk_start = $SCHOOL_TIMES[$idx];
                if ($i == 0) {
                    $assigned_num = $original_num;
                } else {
                    $assigned_num = $next_available;
                    $next_available += 1;
                }
                $out_row = [
                    'NUMERO' => $assigned_num,
                    'CLASSE' => isset($row['CLASSE']) ? $row['CLASSE'] : '',
                    'AULA' => clean_aula(isset($row['AULA']) ? $row['AULA'] : ''),
                    'GIORNO' => remove_accents(isset($row['GIORNO']) ? $row['GIORNO'] : ''),
                    'O_INIZIO' => $chunk_start
                ];
                $processed_rows[] = $out_row;
            }
        }
    }

    // Now upload to DB: TRUNCATE and insert processed rows
    try {
        // Truncate table
        $pdo->exec("TRUNCATE TABLE orario");

        $insertSql = "INSERT INTO orario (NUMERO, CLASSE, AULA, GIORNO, O_INIZIO) VALUES (:numero, :classe, :aula, :giorno, :o_inizio)";
        $stmtIns = $pdo->prepare($insertSql);

        $inserted = 0;
        foreach ($processed_rows as $r) {
            $stmtIns->bindValue(':numero', $r['NUMERO'], PDO::PARAM_INT);
            $stmtIns->bindValue(':classe', $r['CLASSE'], PDO::PARAM_STR);
            $stmtIns->bindValue(':aula', $r['AULA'], PDO::PARAM_STR);
            $stmtIns->bindValue(':giorno', $r['GIORNO'], PDO::PARAM_STR);
            $stmtIns->bindValue(':o_inizio', $r['O_INIZIO'], PDO::PARAM_STR);
            $stmtIns->execute();
            $inserted++;
        }
    } catch (PDOException $dbErr) {
        throw $dbErr;
    }

    echo json_encode([
        'success' => true,
        'processed_rows' => count($processed_rows),
        'inserted_rows' => $inserted
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;

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