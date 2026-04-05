import sqlite3
import json

def inspect_db():
    conn = sqlite3.connect('surf_school.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"Tables: {', '.join(tables)}")
    
    for table in tables:
        if table == 'sqlite_sequence': continue
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"- {table}: {count} rows")
    conn.close()

if __name__ == "__main__":
    inspect_db()
