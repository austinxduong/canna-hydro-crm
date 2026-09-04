from db import get_connection

def main():
    conn = get_connection()
    print("Connected to:", conn.info.dbname)
    conn.close()

if __name__ == "__main__":
    main()