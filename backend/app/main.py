import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import wind

# Show INFO messages (such as "Elexon returned N records") in the terminal
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

app = FastAPI(title="WindSight API")

# CORS: browsers block a page from calling an API on a different address
# unless the API says it is allowed. We allow only our own frontend.
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Register the wind data endpoints
app.include_router(wind.router)
