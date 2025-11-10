#!/usr/bin/env python3
"""
Script per processare EXP_COURS.csv:
1. Rimuove le colonne MAT_NOME, DOC_COGN, DOC_NOME
2. Converte le durate da 2h00 a due righe separate da 1h00 con orari consecutivi
3. Salva il risultato nella cartella root del progetto.
"""

import csv
import os
from datetime import datetime, timedelta

# Mappa degli orari scolastici effettivi
ORARI_SCUOLA = {
    "08h00": "08h55",
    "08h55": "10h00", 
    "10h00": "10h55",
    "10h55": "11h55",
    "11h55": "13h00",
    "13h00": "13h50",
}

def parse_time(time_str):
    try:
        hour = int(time_str.split('h')[0])
        minute = int(time_str.split('h')[1])
        return datetime.strptime(f"{hour:02d}:{minute:02d}", "%H:%M")
    except:
        return None

def format_time(dt):
    return f"{dt.hour:02d}h{dt.minute:02d}"

def get_next_hour(orario_inizio):
    return ORARI_SCUOLA.get(orario_inizio, None)

def process_csv():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(script_dir, 'EXP_COURS.csv')
    output_file = os.path.join(os.path.dirname(script_dir), 'orario_scuola.csv')
    
    print(f"Lettura file: {input_file}")
    print(f"Scrittura file: {output_file}")
    
    try:
        with open(input_file, 'r', encoding='utf-8') as infile:
            # Legge il CSV con delimite (sepatatore) ';'
            reader = csv.DictReader(infile, delimiter=';')
            
            # Colonne da mantenere
            output_columns = ['NUMERO', 'DURATA', 'CLASSE', 'AULA', 'GIORNO', 'O.INIZIO']
            
            processed_rows = []
            row_counter = 1
            
            # formattazione delle ore doppie
            for row in reader:
                durata = row.get('DURATA', '')
                
                if durata == '2h00':
                    orario_inizio_str = row.get('O.INIZIO', '')
                    orario_seconda_str = get_next_hour(orario_inizio_str)
                    
                    if orario_seconda_str:
                        # Prima ora
                        first_row = {
                            'NUMERO': row_counter,
                            'DURATA': '1h00',
                            'CLASSE': row.get('CLASSE', ''),
                            'AULA': row.get('AULA', ''),
                            'GIORNO': row.get('GIORNO', ''),
                            'O.INIZIO': orario_inizio_str
                        }
                        processed_rows.append(first_row)
                        row_counter += 1
                        
                        # Seconda ora
                        second_row = {
                            'NUMERO': row_counter,
                            'DURATA': '1h00',
                            'CLASSE': row.get('CLASSE', ''),
                            'AULA': row.get('AULA', ''),
                            'GIORNO': row.get('GIORNO', ''),
                            'O.INIZIO': orario_seconda_str
                        }
                        processed_rows.append(second_row)
                        row_counter += 1
                        
                        print(f"Convertita lezione 2h00: {row.get('CLASSE', '')} {row.get('GIORNO', '')} {orario_inizio_str} -> {orario_seconda_str}")
                    else:
                        print(f"Errore: orario {orario_inizio_str} non trovato nella mappa degli orari o è l'ultima ora del giorno")
                        # riga originale se conversione non va a buon fine.
                        processed_row = {
                            'NUMERO': row_counter,
                            'DURATA': durata,
                            'CLASSE': row.get('CLASSE', ''),
                            'AULA': row.get('AULA', ''),
                            'GIORNO': row.get('GIORNO', ''),
                            'O.INIZIO': orario_inizio_str
                        }
                        processed_rows.append(processed_row)
                        row_counter += 1
                else:
                    processed_row = {
                        'NUMERO': row_counter,
                        'DURATA': durata,
                        'CLASSE': row.get('CLASSE', ''),
                        'AULA': row.get('AULA', ''),
                        'GIORNO': row.get('GIORNO', ''),
                        'O.INIZIO': row.get('O.INIZIO', '')
                    }
                    processed_rows.append(processed_row)
                    row_counter += 1
        
        # scrittura output
        with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=output_columns, delimiter=';')
            writer.writeheader()
            writer.writerows(processed_rows)
        
        print(f"\nProcessing completato!")
        print(f"Righe processate: {len(processed_rows)}")
        print(f"File salvato in: {output_file}")

    except FileNotFoundError:
        print(f"Errore: File {input_file} non trovato!")
    except Exception as e:
        print(f"Errore durante il processing: {e}")

if __name__ == "__main__":
    process_csv()