"""
Telemetry module for F1 data access using FastF1
"""

from .session_loader import load_session, get_session_metadata
from .data_processor import extract_lap_telemetry, compare_drivers_telemetry
from .models import (
    SessionMetadata,
    LapMetadata,
    TelemetryData,
    LapTelemetryResponse,
    ComparisonResponse
)

__all__ = [
    'load_session',
    'get_session_metadata',
    'extract_lap_telemetry',
    'compare_drivers_telemetry',
    'SessionMetadata',
    'LapMetadata',
    'TelemetryData',
    'LapTelemetryResponse',
    'ComparisonResponse',
]
