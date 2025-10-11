#!/usr/bin/env python3
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="assessment_db",
    user="assessment_user",
    password="bAX2lyThZOSk0nmwwT6R7mva1bTHN+zJq2JugLHDykg="
)
cur = conn.cursor()

session_id = '80593af9-d674-405c-ae7f-4d0bad7212f6'

# Trova tutti i record con il typo
cur.execute("""
    SELECT id, process, activity, score, note
    FROM assessment_result 
    WHERE session_id = %s 
    AND dimension = 'Livello di standadizzazione del processo'
""", (session_id,))

typo_records = cur.fetchall()
print(f"Trovati {len(typo_records)} record con typo 'standadizzazione'\n")

for record in typo_records:
    print(f"ID: {record[0]} | Processo: {record[1]} | Attività: {record[2]} | Score: {record[3]}")
    
    # Controlla se esiste già un record con il nome corretto
    cur.execute("""
        SELECT id, score FROM assessment_result 
        WHERE session_id = %s 
        AND process = %s 
        AND activity = %s 
        AND category = 'Governance'
        AND dimension = 'Livello di standardizzazione del processo'
    """, (session_id, record[1], record[2]))
    
    existing = cur.fetchone()
    
    if existing:
        print(f"  ⚠️ Esiste già record corretto (ID: {existing[0]}, Score: {existing[1]})")
        print(f"  🗑️ Elimino il duplicato con typo")
        cur.execute("DELETE FROM assessment_result WHERE id = %s", (record[0],))
    else:
        print(f"  ✅ Aggiorno il nome della dimensione")
        cur.execute("""
            UPDATE assessment_result 
            SET dimension = 'Livello di standardizzazione del processo'
            WHERE id = %s
        """, (record[0],))
    print()

conn.commit()
print("✅ Correzioni completate!")

cur.close()
conn.close()
