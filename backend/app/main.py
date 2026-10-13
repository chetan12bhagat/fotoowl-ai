from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .models import User, EmailOTP
from .routers import auth_router
from .core.config import settings

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FotoOwl.AI Authentication & OTP API",
    description="Python FastAPI backend providing secure registration, 6-digit email OTP verification, and JWT session management.",
    version="1.0.0",
)

# Configure CORS for local development (Mac, iPhone, Expo dev client)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Expo Web, iOS Simulator, and physical iPhone
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "service": "FotoOwl.AI Auth & OTP API",
        "status": "online",
        "version": "1.0.0",
        "endpoints": {
            "register": "POST /auth/register",
            "verify_email": "POST /auth/verify-email",
            "resend_otp": "POST /auth/resend-otp",
            "login": "POST /auth/login",
            "logout": "POST /auth/logout",
            "me": "GET /auth/me",
            "docs": "/docs",
        },
    }


from sqlalchemy import text


@app.get("/health")
def health_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database": "disconnected", "error": str(e)}


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", settings.PORT))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
