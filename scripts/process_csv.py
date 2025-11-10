#!/usr/bin/env python3
"""
Script to process EXP_COURS.csv:
1. Removes the columns MAT_NOME, DOC_COGN, DOC_NOME
2. Converts durations from 2h00 to two separate rows of 1h00 with consecutive times
3. Saves the result in the root folder of the project.
"""

import csv
import os
from datetime import datetime, timedelta

# Map of actual school hours
SCHOOL_TIMES = {
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

def get_next_hour(start_time):
    return SCHOOL_TIMES.get(start_time, None)

def process_csv():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(script_dir, 'EXP_COURS.csv')
    output_file = os.path.join(os.path.dirname(script_dir), 'school_schedule.csv')
    
    print(f"Reading file: {input_file}")
    print(f"Writing file: {output_file}")
    
    try:
        with open(input_file, 'r', encoding='utf-8') as infile:
            # Reads the CSV with delimiter ';'
            reader = csv.DictReader(infile, delimiter=';')
            
            # Columns to keep
            output_columns = ['NUMERO', 'DURATA', 'CLASSE', 'AULA', 'GIORNO', 'O.INIZIO']
            
            processed_rows = []
            row_counter = 1
            
            # Formatting double hours
            for row in reader:
                durata = row.get('DURATA', '')
                
                if durata == '2h00':
                    start_time_str = row.get('O.INIZIO', '')
                    second_hour_str = get_next_hour(start_time_str)
                    
                    if second_hour_str:
                        # First hour
                        first_row = {
                            'NUMERO': row_counter,
                            'DURATA': '1h00',
                            'CLASSE': row.get('CLASSE', ''),
                            'AULA': row.get('AULA', ''),
                            'GIORNO': row.get('GIORNO', ''),
                            'O.INIZIO': start_time_str
                        }
                        processed_rows.append(first_row)
                        row_counter += 1
                        
                        # Second hour
                        second_row = {
                            'NUMERO': row_counter,
                            'DURATA': '1h00',
                            'CLASSE': row.get('CLASSE', ''),
                            'AULA': row.get('AULA', ''),
                            'GIORNO': row.get('GIORNO', ''),
                            'O.INIZIO': second_hour_str
                        }
                        processed_rows.append(second_row)
                        row_counter += 1
                        
                        print(f"Converted 2h00 lesson: {row.get('CLASSE', '')} {row.get('GIORNO', '')} {start_time_str} -> {second_hour_str}")
                    else:
                        print(f"Error: time {start_time_str} not found in the schedule map or is the last hour of the day")
                        # Original row if conversion fails
                        processed_row = {
                            'NUMERO': row_counter,
                            'DURATA': durata,
                            'CLASSE': row.get('CLASSE', ''),
                            'AULA': row.get('AULA', ''),
                            'GIORNO': row.get('GIORNO', ''),
                            'O.INIZIO': start_time_str
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
        
        # Writing output
        with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=output_columns, delimiter=';')
            writer.writeheader()
            writer.writerows(processed_rows)
        
        print(f"\nProcessing completed!")
        print(f"Rows processed: {len(processed_rows)}")
        print(f"File saved in: {output_file}")

    except FileNotFoundError:
        print(f"Error: File {input_file} not found!")
    except Exception as e:
        print(f"Error during processing: {e}")

if __name__ == "__main__":
    process_csv()