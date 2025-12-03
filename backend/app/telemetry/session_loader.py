"""
FastF1 session loader with caching support
"""

import os
import logging
from typing import Optional, Tuple
import fastf1

from ..config import settings

logger = logging.getLogger(__name__)

# Initialize FastF1 cache
if settings.FASTF1_CACHE_ENABLED:
    cache_dir = settings.FASTF1_CACHE_PATH
    os.makedirs(cache_dir, exist_ok=True)
    fastf1.Cache.enable_cache(cache_dir)
    logger.info(f"FastF1 cache enabled at: {cache_dir}")
else:
    logger.warning("FastF1 cache is disabled - data fetching will be slower")


def load_session(year: int, gp: str, session: str, load_telemetry: bool = True) -> fastf1.core.Session:
    """
    Load a Formula 1 session using FastF1
    
    Args:
        year: Season year (e.g., 2024)
        gp: Grand Prix name (e.g., 'Monaco', 'Monaco Grand Prix')
        session: Session identifier ('FP1', 'FP2', 'FP3', 'Q', 'S', 'R')
        load_telemetry: Whether to load telemetry data (default True)
    
    Returns:
        FastF1 Session object
    
    Raises:
        ValueError: If session cannot be found
        Exception: For other loading errors
    """
    try:
        logger.info(f"Loading session: {year} {gp} {session}")
        
        # Get session
        f1_session = fastf1.get_session(year, gp, session)
        logger.info(f"Session object created for: {year} {gp} {session}")
        
        # Load session data
        # laps=True loads lap data, telemetry loads car telemetry
        logger.info(f"Loading session data (laps=True, telemetry={load_telemetry})...")
        f1_session.load(laps=True, telemetry=load_telemetry)
        logger.info(f"Successfully loaded session data")
        
        logger.info(f"Successfully loaded session: {f1_session.event.EventName} - {f1_session.name}")
        return f1_session
        
    except Exception as e:
        logger.error(f"Failed to load session {year} {gp} {session}: {e}", exc_info=True)
        raise


def get_session_metadata(f1_session: fastf1.core.Session) -> dict:
    """
    Extract metadata from a FastF1 session
    
    Args:
        f1_session: Loaded FastF1 session
    
    Returns:
        Dictionary with session metadata
    """
    try:
        # Get unique drivers from laps
        drivers = sorted(set(f1_session.laps['Driver'].dropna().unique()))
        
        # Get total number of laps
        total_laps = int(f1_session.laps['LapNumber'].max()) if len(f1_session.laps) > 0 else 0
        
        metadata = {
            'year': f1_session.event.year,
            'gp': f1_session.event.EventName,
            'session': f1_session.name,
            'drivers': drivers,
            'total_laps': total_laps,
            'session_name': f1_session.name,
            'event_name': f1_session.event.EventName,
            'cached': True  # If we got here, data was loaded (potentially from cache)
        }
        
        return metadata
        
    except Exception as e:
        logger.error(f"Failed to extract session metadata: {e}")
        raise


def get_available_sessions(year: int) -> list:
    """
    Get list of available sessions for a given year
    
    Args:
        year: Season year
    
    Returns:
        List of events with session information
    """
    try:
        schedule = fastf1.get_event_schedule(year)
        events = []
        
        for idx, event in schedule.iterrows():
            event_info = {
                'round': int(event['RoundNumber']),
                'event_name': event['EventName'],
                'country': event['Country'],
                'location': event['Location'],
                'date': event['EventDate'].isoformat() if hasattr(event['EventDate'], 'isoformat') else str(event['EventDate']),
            }
            events.append(event_info)
        
        return events
        
    except Exception as e:
        logger.error(f"Failed to get event schedule for {year}: {e}")
        raise
