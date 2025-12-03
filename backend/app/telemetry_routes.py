"""
Telemetry API routes for FastF1 data access
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from .telemetry.session_loader import load_session, get_session_metadata, get_available_sessions
from .telemetry.data_processor import extract_lap_telemetry, compare_drivers_telemetry, get_fastest_lap
from .telemetry.models import (
    SessionMetadata,
    LapTelemetryResponse,
    ComparisonResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


@router.get("/events/{year}")
async def get_events(year: int):
    """
    Get list of F1 events for a given year
    
    Args:
        year: Season year (e.g., 2024)
    
    Returns:
        List of events with metadata
    """
    try:
        events = get_available_sessions(year)
        return {"year": year, "events": events}
    except Exception as e:
        logger.error(f"Failed to get events for {year}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve events: {str(e)}"
        )


@router.get("/session", response_model=SessionMetadata)
async def get_session(
    year: int = Query(..., description="Season year (e.g., 2024)"),
    gp: str = Query(..., description="Grand Prix name (e.g., 'Monaco')"),
    session: str = Query(..., description="Session type (FP1, FP2, FP3, Q, S, R)")
):
    """
    Get session metadata including available drivers and laps
    
    Args:
        year: Season year
        gp: Grand Prix name
        session: Session identifier
    
    Returns:
        Session metadata
    """
    try:
        logger.info(f"Getting session metadata: {year} {gp} {session}")
        
        # Load session (without telemetry for faster metadata retrieval)
        f1_session = load_session(year, gp, session, load_telemetry=False)
        
        # Extract metadata
        metadata = get_session_metadata(f1_session)
        
        return SessionMetadata(**metadata)
        
    except ValueError as e:
        logger.warning(f"Session not found: {e}")
        raise HTTPException(status_code=404, detail=f"Session not found: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to get session metadata: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve session metadata: {str(e)}"
        )


@router.get("/lap", response_model=LapTelemetryResponse)
async def get_lap_telemetry(
    year: int = Query(..., description="Season year"),
    gp: str = Query(..., description="Grand Prix name"),
    session: str = Query(..., description="Session type"),
    driver: str = Query(..., description="Driver code (e.g., VER, HAM)"),
    lap: int = Query(..., description="Lap number")
):
    """
    Get telemetry data for a specific driver and lap
    
    Args:
        year: Season year
        gp: Grand Prix name
        session: Session identifier
        driver: Driver code
        lap: Lap number
    
    Returns:
        Lap metadata and telemetry data
    """
    try:
        logger.info(f"Getting lap telemetry: {year} {gp} {session} - {driver} lap {lap}")
        
        # Load session with telemetry
        f1_session = load_session(year, gp, session, load_telemetry=True)
        
        # Extract lap telemetry
        lap_meta, telemetry = extract_lap_telemetry(f1_session, driver, lap)
        
        if lap_meta is None:
            raise HTTPException(
                status_code=404,
                detail=f"Lap {lap} not found for driver {driver}"
            )
        
        if telemetry is None:
            raise HTTPException(
                status_code=404,
                detail=f"Telemetry not available for driver {driver} lap {lap}"
            )
        
        return LapTelemetryResponse(
            lap_meta=lap_meta,
            telemetry=telemetry
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get lap telemetry: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve lap telemetry: {str(e)}"
        )


@router.get("/compare", response_model=ComparisonResponse)
async def compare_drivers(
    year: int = Query(..., description="Season year"),
    gp: str = Query(..., description="Grand Prix name"),
    session: str = Query(..., description="Session type"),
    driver1: str = Query(..., description="First driver code"),
    driver2: str = Query(..., description="Second driver code"),
    lap: int = Query(..., description="Lap number to compare")
):
    """
    Compare telemetry between two drivers for the same lap
    
    Args:
        year: Season year
        gp: Grand Prix name
        session: Session identifier
        driver1: First driver code
        driver2: Second driver code
        lap: Lap number
    
    Returns:
        Comparison data with both drivers' telemetry
    """
    try:
        logger.info(f"Comparing drivers: {year} {gp} {session} - {driver1} vs {driver2} lap {lap}")
        
        # Load session with telemetry
        f1_session = load_session(year, gp, session, load_telemetry=True)
        
        # Get session metadata
        session_meta = get_session_metadata(f1_session)
        
        # Compare drivers
        lap1_meta, telem1, lap2_meta, telem2, delta_time = compare_drivers_telemetry(
            f1_session, driver1, driver2, lap
        )
        
        if lap1_meta is None or telem1 is None:
            raise HTTPException(
                status_code=404,
                detail=f"Telemetry not available for driver {driver1} lap {lap}"
            )
        
        if lap2_meta is None or telem2 is None:
            raise HTTPException(
                status_code=404,
                detail=f"Telemetry not available for driver {driver2} lap {lap}"
            )
        
        return ComparisonResponse(
            session_meta=SessionMetadata(**session_meta),
            driver1=driver1,
            driver2=driver2,
            lap_number=lap,
            driver1_lap=lap1_meta,
            driver2_lap=lap2_meta,
            driver1_telemetry=telem1,
            driver2_telemetry=telem2,
            delta_time=delta_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to compare drivers: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compare drivers: {str(e)}"
        )


@router.get("/speed")
async def get_speed_telemetry(
    year: int = Query(..., description="Season year"),
    gp: str = Query(..., description="Grand Prix name"),
    session: str = Query(..., description="Session type"),
    drivers: str = Query(..., description="Comma-separated driver codes (e.g., 'VER,LEC')"),
    lap: Optional[int] = Query(None, description="Specific lap number, or None for fastest"),
    lap_type: str = Query('fastest', description="'fastest' or 'specific'")
):
    """
    Get speed telemetry traces for multiple drivers
    
    Args:
        year: Season year
        gp: Grand Prix name
        session: Session identifier
        drivers: Comma-separated driver codes
        lap: Specific lap number (optional)
        lap_type: Type of lap selection
    
    Returns:
        Speed traces for all drivers with delta data
    """
    try:
        from .telemetry.speed_extractor import extract_speed_traces
        
        driver_list = [d.strip().upper() for d in drivers.split(',')]
        logger.info(f"Getting speed telemetry: {year} {gp} {session} - Drivers: {driver_list}, Lap: {lap or lap_type}")
        
        # Load session with telemetry
        f1_session = load_session(year, gp, session, load_telemetry=True)
        
        # Extract speed traces
        result = extract_speed_traces(
            f1_session,
            driver_list,
            lap_number=lap,
            lap_type=lap_type
        )
        
        if not result['traces']:
            raise HTTPException(
                status_code=404,
                detail=result.get('error', 'No telemetry data available')
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get speed telemetry: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve speed telemetry: {str(e)}"
        )


@router.get("/fastest-lap/{year}/{gp}/{session}/{driver}")
async def get_driver_fastest_lap(year: int, gp: str, session: str, driver: str):
    """
    Get the fastest lap number for a specific driver in a session
    
    Args:
        year: Season year
        gp: Grand Prix name
        session: Session identifier
        driver: Driver code
    
    Returns:
        Fastest lap number and metadata
    """
    try:
        logger.info(f"Getting fastest lap: {year} {gp} {session} - {driver}")
        
        # Load session
        f1_session = load_session(year, gp, session, load_telemetry=False)
        
        # Get fastest lap
        fastest_lap_num = get_fastest_lap(f1_session, driver)
        
        if fastest_lap_num is None:
            raise HTTPException(
                status_code=404,
                detail=f"No laps found for driver {driver}"
            )
        
        return {
            "driver": driver,
            "fastest_lap": fastest_lap_num
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get fastest lap: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve fastest lap: {str(e)}"
        )
