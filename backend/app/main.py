from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas
from .db.database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Curiosity Engine Backend is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/queries", response_model=schemas.Query)
def create_query(query: schemas.QueryCreate, db: Session = Depends(get_db)):
    # Hard-code user_id as requested
    db_query = models.Query(
        user_id=1,  # Hard-coded demo user
        raw_query=query.raw_query,
        answer_markdown=query.answer_markdown
    )
    db.add(db_query)
    db.commit()
    db.refresh(db_query)
    return db_query