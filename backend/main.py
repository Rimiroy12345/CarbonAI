import os
from fastapi import FastAPI
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="CarbonAI Backend")

@app.get("/")
def read_root():
    return {"message": "CarbonAI backend is running!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/emission-factors")
def get_emission_factors():
    response = supabase.table("emission_factors").select("*").execute()
    return response.data
