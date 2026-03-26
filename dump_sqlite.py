import sqlite3
import json
import datetime

def dump_db():
    conn = sqlite3.connect('surf_school.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    
    data = {}
    for table in tables:
        if table == 'sqlite_sequence': continue
        cursor.execute(f"SELECT * FROM {table}")
        rows = [dict(row) for row in cursor.fetchall()]
        data[table] = rows
        print(f"Dumped {table}: {len(rows)} rows")
        
    with open('db_dump.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    conn.close()

if __name__ == "__main__":
    dump_db()
