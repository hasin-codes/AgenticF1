"""
Pydantic models for telemetry API
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class SessionMetadata(BaseModel):
    """Session metadata including drivers and available laps"""
    year: int
    gp: str
    session: str
    drivers: List[str] = Field(description="List of driver codes (e.g., VER, HAM)")
    total_laps: int
    session_name: str
    event_name: str
    cached: bool = Field(default=False, description="Whether data was loaded from cache")


class LapMetadata(BaseModel):
    """Metadata for a single lap"""
    lap_number: int
    driver: str
    lap_time_seconds: Optional[float] = Field(None, description="Lap time in seconds")
    lap_time_str: Optional[str] = Field(None, description="Formatted lap time (MM:SS.mmm)")
    sector_1_time: Optional[float] = None
    sector_2_time: Optional[float] = None
    sector_3_time: Optional[float] = None
    compound: Optional[str] = Field(None, description="Tire compound (SOFT, MEDIUM, HARD)")
    is_personal_best: bool = False


class TelemetryData(BaseModel):
    """Telemetry time series data"""
    time: List[float] = Field(description="Time in seconds from start of lap")
    distance: List[float] = Field(description="Distance in meters")
    speed: List[float] = Field(description="Speed in km/h")
    throttle: List[float] = Field(description="Throttle position (0-100)")
    brake: List[float] = Field(description="Brake pressure (0-100)")
    gear: List[int] = Field(description="Gear number")
    rpm: Optional[List[float]] = Field(None, description="Engine RPM")
    drs: Optional[List[int]] = Field(None, description="DRS status (0=closed, 1=open)")


class LapTelemetryResponse(BaseModel):
    """Response model for lap telemetry endpoint"""
    lap_meta: LapMetadata
    telemetry: TelemetryData
    

class ComparisonResponse(BaseModel):
    """Response model for driver comparison endpoint"""
    session_meta: SessionMetadata
    driver1: str
    driver2: str
    lap_number: int
    driver1_lap: LapMetadata
    driver2_lap: LapMetadata
    driver1_telemetry: TelemetryData
    driver2_telemetry: TelemetryData
    delta_time: Optional[float] = Field(None, description="Time difference in seconds")
