from fastapi import FastAPI
from routes import filter

app = FastAPI()

app.include_router(filter.router)

@app.get("/")
def home():
    return {"message": "Computer Vision Project API"}