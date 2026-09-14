from fastapi import FastAPI

app = FastAPI(title="CarbonAI Backend")

@app.get("/")
def read_root():
    return {"message": "CarbonAI backend is running!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

