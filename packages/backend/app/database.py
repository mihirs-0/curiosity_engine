# Supabase database configuration
# All database operations should go through Supabase client, not local SQLModel/SQLAlchemy

import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Optional

load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")  # Use anon key for now

USE_SUPABASE = bool(supabase_url and supabase_key)
supabase: Optional[Client] = None

if USE_SUPABASE:
    supabase = create_client(supabase_url, supabase_key)
    print("✅ Supabase client initialized with anon key")
else:
    print("⚠️ Supabase not configured - check environment variables")

def get_supabase() -> Client:
    """Dependency to get Supabase client"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    return supabase

def create_db_and_tables():
    """
    Database tables are managed through Supabase migrations.
    This function is kept for backward compatibility but does nothing
    since tables are created via Supabase migrations.
    """
    print("✅ Database tables managed by Supabase migrations")
    pass

def get_session():
    """
    This function is deprecated since we use Supabase client directly.
    Kept for backward compatibility.
    """
    pass 