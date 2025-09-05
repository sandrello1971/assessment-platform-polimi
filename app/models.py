from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import uuid

Base = declarative_base()

class LocalUser(Base):
    __tablename__ = "local_users"

    id = Column(String, primary_key=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String)
    role = Column(String, default="user")
    must_change_password = Column(Boolean, default=True)

class AssessmentSession(Base):
    __tablename__ = "assessment_session"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=True)
    company_id = Column(Integer, nullable=True)
    azienda_nome = Column(Text, nullable=False)
    settore = Column(Text, nullable=True)
    dimensione = Column(Text, nullable=True)
    referente = Column(Text, nullable=True)
    email = Column(Text, nullable=True)
    risposte_json = Column(Text, nullable=True)
    punteggi_json = Column(Text, nullable=True)
    raccomandazioni = Column(Text, nullable=True)
    creato_il = Column(DateTime, nullable=True)

    results = relationship("AssessmentResult", backref="session")

class AssessmentResult(Base):
    __tablename__ = "assessment_result"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("assessment_session.id"), nullable=False)
    process = Column(String, nullable=False)
    category = Column(String, nullable=False)
    dimension = Column(String, nullable=False)
    score = Column(Integer, nullable=False)  # Ora accetta 0-5
    note = Column(Text, nullable=True)
    is_not_applicable = Column(Boolean, default=False, nullable=False)  # ✅ NUOVO CAMPO
