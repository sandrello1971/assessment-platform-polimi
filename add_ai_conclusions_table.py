#!/usr/bin/env python3
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="assessment_db",
    user="assessment_user",
    password="bAX2lyThZOSk0nmwwT6R7mva1bTHN+zJq2JugLHDykg="
)
cur = conn.cursor()

# Crea tabella per le conclusioni AI
cur.execute("""
CREATE TABLE IF NOT EXISTS ai_conclusions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES assessment_session(id) ON DELETE CASCADE,
    raw_content TEXT NOT NULL,
    formatted_content TEXT,
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_conclusions_session ON ai_conclusions(session_id);
""")

conn.commit()
print("✅ Tabella ai_conclusions creata!")

cur.close()
conn.close()
