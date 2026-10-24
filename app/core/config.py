import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Nociva API"
    SUPABASE_URL: str
    SUPABASE_KEY: str 

    class Config:
        env_file = ".env"
        extra = "ignore" #! DO NOT REMOVE THIS: this drop unexpected things in .env file

settings = Settings()