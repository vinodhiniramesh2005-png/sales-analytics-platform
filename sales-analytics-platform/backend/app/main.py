from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import Base, engine
from app.models import models  # noqa: F401 ensures models are registered
from app.routers import auth, upload, dataset, chat, charts, forecast, report, settings_router, dashboard

# Create DB tables
Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT])

app = FastAPI(
    title=settings.APP_NAME,
    description="Production-grade AI-powered sales analytics platform API",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": f"Internal server error: {str(exc)}"})


app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(dataset.router)
app.include_router(chat.router)
app.include_router(charts.router)
app.include_router(forecast.router)
app.include_router(report.router)
app.include_router(settings_router.router)
app.include_router(dashboard.router)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/reports", StaticFiles(directory=settings.REPORTS_DIR), name="reports")


@app.get("/")
def root():
    return {"message": settings.APP_NAME, "status": "running", "docs": "/docs"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
