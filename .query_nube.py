import sys
import sqlitecloud

conn_str = "sqlitecloud://nrzdtsjxdk.finer-aphid.eks.use2.1kviht.sqlite.cloud:8860/DocFLowIA.sqlite?apikey=8rpeHUeJghcnbrar3IBJBFOJAiJsq0IWrfwcmqNBDCI"

query = sys.argv[1]

try:
    conn = sqlitecloud.connect(conn_str)
    cursor = conn.cursor()
    cursor.execute(query)
    
    if query.strip().upper().startswith("SELECT") or query.strip().upper().startswith("PRAGMA"):
        rows = cursor.fetchall()
        col_names = [description[0] for description in cursor.description] if cursor.description else []
        if col_names:
            header = " | ".join(col_names)
            print(header)
            print("-" * len(header))
        for row in rows:
            print(" | ".join(str(item) if item is not None else "NULL" for item in row))
    else:
        conn.commit()
        print(f"Consulta ejecutada. Operación realizada con éxito.")
except Exception as e:
    print(f"Error ejecutando la consulta: {e}")
finally:
    if 'conn' in locals():
        conn.close()
