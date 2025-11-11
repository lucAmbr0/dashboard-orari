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

# Ordered list of school start times. Use this to shift a lesson by positions (not by adding minutes).
SCHOOL_TIMES = [
    "08h00",
    "08h55",
    "10h00",
    "10h55",
    "11h55",
    "13h00",
    "13h50",
]

def parse_time(time_str):
    try:
        hour = int(time_str.split('h')[0])
        minute = int(time_str.split('h')[1])
        return datetime.strptime(f"{hour:02d}:{minute:02d}", "%H:%M")
    except:
        return None

def format_time(dt):
    return f"{dt.hour:02d}h{dt.minute:02d}"

def get_start_index(start_time):
    try:
        return SCHOOL_TIMES.index(start_time)
    except ValueError:
        return None

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
            
            # Columns to keep (we remove MAT_NOME, DOC_COGN, DOC_NOME)
            output_columns = ['NUMERO', 'DURATA', 'CLASSE', 'AULA', 'GIORNO', 'O.INIZIO']

            # Read all rows into memory to collect existing NUMERO values
            input_rows = list(reader)
            existing_nums = set()
            for r in input_rows:
                try:
                    existing_nums.add(int(r.get('NUMERO', '').strip()))
                except Exception:
                    pass

            next_available = max(existing_nums) + 1 if existing_nums else 1

            processed_rows = []

            for row in input_rows:
                # Drop rows with no AULA or where MAT_NOME is 'Disposizione'
                aula_val = row.get('AULA', '').strip()
                mat_val = row.get('MAT_NOME', '').strip()
                if not aula_val or mat_val.lower() == 'disposizione':
                    # skip this row entirely
                    continue
                durata = row.get('DURATA', '').strip()
                raw_num = row.get('NUMERO', '').strip()
                try:
                    original_num = int(raw_num)
                except Exception:
                    # if NUMERO is missing or not integer, assign a new unique number
                    original_num = next_available
                    next_available += 1

                # Determine how many 1h chunks
                hours = 0
                try:
                    hours = int(durata.split('h')[0])
                except Exception:
                    # fallback: treat as single hour if unparsable
                    hours = 1

                # find index of start time in SCHOOL_TIMES
                start_time = row.get('O.INIZIO', '').strip()
                start_index = get_start_index(start_time)

                if hours <= 1 or start_index is None:
                    # keep as-is (single-hour or unknown start)
                    out_row = {
                        'NUMERO': original_num,
                        'DURATA': durata if durata else '1h00',
                        'CLASSE': row.get('CLASSE', ''),
                        'AULA': row.get('AULA', ''),
                        'GIORNO': row.get('GIORNO', ''),
                        'O.INIZIO': start_time
                    }
                    processed_rows.append(out_row)
                else:
                    # split into `hours` rows, each 1h00, shifting start based on SCHOOL_TIMES indices
                    for i in range(hours):
                        idx = start_index + i
                        if idx >= len(SCHOOL_TIMES):
                            print(f"Warning: cannot map chunk {i+1}/{hours} for NUMERO {original_num}: start index {idx} out of range")
                            break

                        chunk_start = SCHOOL_TIMES[idx]
                        if i == 0:
                            assigned_num = original_num
                        else:
                            assigned_num = next_available
                            next_available += 1

                        out_row = {
                            'NUMERO': assigned_num,
                            'DURATA': '1h00',
                            'CLASSE': row.get('CLASSE', ''),
                            'AULA': row.get('AULA', ''),
                            'GIORNO': row.get('GIORNO', ''),
                            'O.INIZIO': chunk_start
                        }
                        processed_rows.append(out_row)
                    print(f"Split NUMERO {original_num} ({durata}) into {min(hours, len(SCHOOL_TIMES)-start_index)} x 1h00 starting at {start_time}")
        
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