import os
from fastapi import FastAPI
from pydantic import BaseModel
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


class EmissionInput(BaseModel):
    industry: str = "general"
    electricity: float = 0
    natural_gas: float = 0
    petrol: float = 0
    diesel: float = 0
    air_travel: float = 0
    hotels: float = 0
    commuting: float = 0
    waste: float = 0


@app.post("/calculate")
def calculate_footprint(data: EmissionInput):
    response = (
        supabase.table("emission_factors")
        .select("*")
        .eq("industry", data.industry)
        .execute()
    )
    factors = response.data

    if not factors:
        response = (
            supabase.table("emission_factors")
            .select("*")
            .eq("industry", "general")
            .execute()
        )
        factors = response.data

    factor_map = {f["category"]: f["factor_value"] for f in factors}

    inputs = {
        "electricity": data.electricity,
        "natural_gas": data.natural_gas,
        "petrol": data.petrol,
        "diesel": data.diesel,
        "air_travel": data.air_travel,
        "hotels": data.hotels,
        "commuting": data.commuting,
        "waste": data.waste,
    }

    category_totals = {}
    for category, value in inputs.items():
        factor = factor_map.get(category, 0)
        category_totals[category] = round(value * factor, 2)

    total = round(sum(category_totals.values()), 2)

    energy = category_totals["electricity"] + category_totals["natural_gas"]
    transport = (
        category_totals["petrol"]
        + category_totals["diesel"]
        + category_totals["air_travel"]
        + category_totals["commuting"]
    )
    waste = category_totals["waste"] + category_totals["hotels"]

    breakdown_pct = {}
    if total > 0:
        breakdown_pct = {
            "energy": round((energy / total) * 100),
            "transport": round((transport / total) * 100),
            "waste": round((waste / total) * 100),
        }

    return {
        "total_tco2e": total,
        "category_totals": category_totals,
        "breakdown_pct": breakdown_pct,
    }



# ---- Auth ----

class SignUpInput(BaseModel):
    email: str
    password: str

class SignInInput(BaseModel):
    email: str
    password: str


@app.post("/auth/signup")
def sign_up(data: SignUpInput):
    response = supabase.auth.sign_up({
        "email": data.email,
        "password": data.password,
    })
    return {
        "user": response.user,
        "session": response.session,
    }


@app.post("/auth/signin")
def sign_in(data: SignInInput):
    response = supabase.auth.sign_in_with_password({
        "email": data.email,
        "password": data.password,
    })
    return {
        "user": response.user,
        "session": response.session,
    }


# ---- Auth verification (for protecting endpoints) ----

from fastapi import Header, HTTPException

def get_current_user(authorization: str = Header(...)):
    """
    Expects header: Authorization: Bearer <access_token>
    Returns the authenticated user's info, or raises 401 if invalid.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.replace("Bearer ", "")

    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return user_response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# Example protected route to test it
from fastapi import Depends

@app.get("/me")
def get_my_profile(current_user = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
    }

