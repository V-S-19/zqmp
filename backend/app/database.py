import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

app_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(app_dir)
root_dir = os.path.dirname(backend_dir)

candidates = [
    os.path.join(backend_dir, "data", "energy_trading.db"),
    os.path.join(root_dir, "data", "energy_trading.db"),
    os.path.join(os.getcwd(), "data", "energy_trading.db"),
    os.path.join(os.getcwd(), "backend", "data", "energy_trading.db"),
]

BUNDLED_DB_PATH = candidates[0]
for p in candidates:
    if os.path.exists(p):
        BUNDLED_DB_PATH = p
        break

if os.environ.get("VERCEL"):
    import shutil
    TMP_DB_PATH = "/tmp/energy_trading.db"
    if not os.path.exists(TMP_DB_PATH) and os.path.exists(BUNDLED_DB_PATH):
        try:
            shutil.copyfile(BUNDLED_DB_PATH, TMP_DB_PATH)
        except Exception:
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
