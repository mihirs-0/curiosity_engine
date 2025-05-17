from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from ..db.database import Base

class Query(Base):
    __tablename__ = "queries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)  # Hard-coded for now as requested
    raw_query = Column(Text, nullable=False)
    answer_markdown = Column(Text, nullable=False)
    sonar_data = Column(JSON, nullable=True)
    sonar_status = Column(String(20), default='pending')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 