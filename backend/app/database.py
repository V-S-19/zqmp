import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUNDLED_DB_PATH = os.path.join(ROOT_DIR, "data", "energy_trading.db")

if os.environ.get("VERCEL"):
    import shutil
    TMP_DB_PATH = "/tmp/energy_trading.db"
    if not os.path.exists(TMP_DB_PATH) and os.path.exists(BUNDLED_DB_PATH):
        try:
            shutil.copyfile(BUNDLED_DB_PATH, TMP_DB_PATH)
        except Exception as e:
            pass
    DATABASE_PATH = TMP_DB_PATH if os.path.exists(TMP_DB_PATH) else BUNDLED_DB_PATH
else:
    DATABASE_PATH = BUNDLED_DB_PATH

DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
