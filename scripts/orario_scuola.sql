CREATE USER 'utente'@'localhost' IDENTIFIED BY 'utente';
GRANT ALL PRIVILEGES ON orario_scuola.* TO 'utente'@'localhost';
GRANT FILE ON *.* TO 'utente'@'localhost';
FLUSH PRIVILEGES;

CREATE DATABASE IF NOT EXISTS orario_scuola 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE orario_scuola;

CREATE TABLE IF NOT EXISTS orario (
    NUMERO INT PRIMARY KEY AUTO_INCREMENT,
    DURATA VARCHAR(10) NOT NULL, 
    CLASSE VARCHAR(10) NOT NULL,
    AULA VARCHAR(50) NOT NULL,
    GIORNO ENUM('lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì') NOT NULL,
    O_INIZIO VARCHAR(10) NOT NULL,
    
    INDEX idx_giorno_orario (GIORNO, O_INIZIO),
    INDEX idx_classe (CLASSE),
    INDEX idx_aula (AULA)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci;

LOAD DATA LOCAL INFILE 'absolute_path/to/your/EXP_COURS.csv'
INTO TABLE orario FIELDS TERMINATED BY ';' LINES TERMINATED BY '\n' 
IGNORE 1 LINES (NUMERO, DURATA, CLASSE, AULA, GIORNO, O_INIZIO);

SELECT * FROM orario;