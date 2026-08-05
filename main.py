from fastapi import FastAPI
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel
from typing import Optional
import os
import time

app = FastAPI(title="Location Tracker")

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")


# Pydantic Models 
class LocationModel(BaseModel):
    latitude: float
    longitude: float
    altitude: Optional[float] = None
    accuracy: Optional[float] = None
    vertical_accuracy: Optional[float] = None
    bearing: Optional[float] = None
    speed: Optional[float] = None
    elapsedMs: Optional[int] = None
    provider: Optional[str] = None


class BatteryModel(BaseModel):
    present: Optional[bool] = None
    technology: Optional[str] = None
    health: Optional[str] = None
    plugged: Optional[str] = None
    status: Optional[str] = None
    temperature: Optional[float] = None
    voltage: Optional[int] = None
    current: Optional[int] = None
    percentage: Optional[int] = None
    level: Optional[int] = None
    scale: Optional[int] = None
    charge_counter: Optional[int] = None


class TrackingData(BaseModel):
    location: LocationModel
    battry: Optional[BatteryModel] = None  # Field name kept as in the sample input JSON


# In-memory Store 
_latest_data: Optional[TrackingData] = None
_received_at: Optional[float] = None


# Endpoints 
@app.post("/location")
async def post_location(data: TrackingData):
    """Receive location and battery JSON from the device"""
    global _latest_data, _received_at
    _latest_data = data
    _received_at = time.time()
    return {
        "status": "ok",
        "received_at": _received_at,
        "location": {
            "latitude": data.location.latitude,
            "longitude": data.location.longitude,
        },
        "battery": data.battry.percentage if data.battry else None,
    }


@app.get("/api/location")
async def get_latest_location():
    """Return the latest stored data"""
    if _latest_data is None:
        return {"location": None, "battry": None, "received_at": None, "received_at_display": None}
    received_at_display = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(_received_at)) if _received_at else None
    return {
        "location": _latest_data.location.model_dump(),
        "battry": _latest_data.battry.model_dump() if _latest_data.battry else None,
        "received_at": _received_at,
        "received_at_display": received_at_display,
    }


@app.get("/", response_class=HTMLResponse)
@app.get("/map", response_class=HTMLResponse)
async def show_map():
    """Display the map page"""
    return FileResponse(os.path.join(TEMPLATES_DIR, "map.html"))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=9000)
