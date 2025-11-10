import sys
from sqlalchemy import create_engine, text

# --- CONFIGURE YOUR DATABASE DETAILS ---
# These should match your project's settings.
DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "cif"
# -----------------------------------------

def test_database_connection():
    """Prompts for credentials and attempts to connect to the database."""
    print("--- PostgreSQL Connection Test ---")
    
    # Get the credentials you want to test
    user = input("Enter username: ")
    password = input("Enter password: ")

    try:
        # 1. Construct the database connection URL (URI)
        db_uri = f"postgresql+psycopg2://{user}:{password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

        # 2. Create a database engine
        engine = create_engine(db_uri)

        # 3. Try to connect and run a simple query
        with engine.connect() as connection:
            print("\nAttempting to connect...")
            result = connection.execute(text("SELECT current_user;"))
            db_user = result.scalar_one()
            print("✅ SUCCESS: Connection established.")
            print(f"✅ Logged into database '{DB_NAME}' as user: {db_user}")

    except Exception as e:
        print("\n❌ FAILED: Could not connect to the database.")
        print(f"❌ Error details: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_database_connection()