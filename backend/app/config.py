import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# 1. Get the absolute path to the .env file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE_PATH = os.path.join(BASE_DIR, ".env")

# 2. FORCE load the variables into the system environment immediately
load_dotenv(ENV_FILE_PATH)

# 3. Now Pydantic will find them natively
class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    SUPABASE_URL: str
    SUPABASE_KEY: str
    GEMINI_API_KEY: str

settings = Settings()