"""
Telemetry data processor - converts FastF1 data to API-ready format
"""

import logging
from typing import Optional, Dict, Any
import pandas as pd
import numpy as np
import fastf1

from .models import LapMetadata, TelemetryData

logger = logging.getLogger(__name__)


def extract_lap_telemetry(
    f1_session: fastf1.core.Session,
    driver: str,
    lap_number: int
) -> tuple[Optional[LapMetadata], Optional[TelemetryData]]:
    """
    Extract telemetry data for a specific driver and lap
    
    Args:
        f1_session: Loaded FastF1 session
        driver: Driver code (e.g., 'VER', 'HAM')
        lap_number: Lap number
    
    Returns:
        Tuple of (LapMetadata, TelemetryData) or (None, None) if not found
    """
    try:
        # Get driver's laps
        driver_laps = f1_session.laps.pick_driver(driver)
        
        if driver_laps.empty:
            logger.warning(f"No laps found for driver {driver}")
            return None, None
        
        # Get specific lap
        lap = driver_laps[driver_laps['LapNumber'] == lap_number]
        
        if lap.empty:
            logger.warning(f"Lap {lap_number} not found for driver {driver}")
            return None, None
        
        lap = lap.iloc[0]
        
        # Extract lap metadata
        lap_meta = _extract_lap_metadata(lap, driver)
        
        # Extract telemetry
        try:
            telemetry_df = lap.get_telemetry()
            telemetry_data = _process_telemetry_dataframe(telemetry_df)
        except Exception as e:
            logger.warning(f"Failed to get telemetry for {driver} lap {lap_number}: {e}")
            return lap_meta, None
        
        return lap_meta, telemetry_data
        
    except Exception as e:
        logger.error(f"Failed to extract lap telemetry: {e}")
        raise


def _extract_lap_metadata(lap: pd.Series, driver: str) -> LapMetadata:
    """Extract metadata from a lap Series"""
    try:
        # Get lap time
        lap_time = lap.get('LapTime')
        lap_time_seconds = None
        lap_time_str = None
        
        if pd.notna(lap_time):
            if hasattr(lap_time, 'total_seconds'):
                lap_time_seconds = lap_time.total_seconds()
                # Format as MM:SS.mmm
                minutes = int(lap_time_seconds // 60)
                seconds = lap_time_seconds % 60
                lap_time_str = f"{minutes}:{seconds:06.3f}"
        
        # Get sector times
        sector_1 = lap.get('Sector1Time')
        sector_2 = lap.get('Sector2Time')
        sector_3 = lap.get('Sector3Time')
        
        sector_1_time = sector_1.total_seconds() if pd.notna(sector_1) and hasattr(sector_1, 'total_seconds') else None
        sector_2_time = sector_2.total_seconds() if pd.notna(sector_2) and hasattr(sector_2, 'total_seconds') else None
        sector_3_time = sector_3.total_seconds() if pd.notna(sector_3) and hasattr(sector_3, 'total_seconds') else None
        
        # Get compound
        compound = lap.get('Compound')
        compound_str = str(compound) if pd.notna(compound) else None
        
        # Check if personal best
        is_personal_best = bool(lap.get('IsPersonalBest', False))
        
        return LapMetadata(
            lap_number=int(lap['LapNumber']),
            driver=driver,
            lap_time_seconds=lap_time_seconds,
            lap_time_str=lap_time_str,
            sector_1_time=sector_1_time,
            sector_2_time=sector_2_time,
            sector_3_time=sector_3_time,
            compound=compound_str,
            is_personal_best=is_personal_best
        )
    except Exception as e:
        logger.error(f"Failed to extract lap metadata: {e}")
        raise


def _process_telemetry_dataframe(telemetry_df: pd.DataFrame) -> TelemetryData:
    """
    Convert pandas telemetry DataFrame to TelemetryData model
    
    Args:
        telemetry_df: FastF1 telemetry DataFrame
    
    Returns:
        TelemetryData model
    """
    try:
        # Helper function to safely convert to list
        def safe_to_list(column_name: str, dtype=float) -> list:
            if column_name in telemetry_df.columns:
                series = telemetry_df[column_name]
                # Replace NaN with 0 or appropriate default
                series = series.fillna(0)
                if dtype == int:
                    return series.astype(int).tolist()
                return series.astype(float).tolist()
            return []
        
        # Convert Time to seconds from session start
        time_data = telemetry_df['Time'] if 'Time' in telemetry_df.columns else telemetry_df.index
        if hasattr(time_data.iloc[0], 'total_seconds'):
            time_list = [t.total_seconds() for t in time_data]
        else:
            time_list = time_data.tolist()
        
        # Normalize time to start from 0
        if time_list:
            start_time = time_list[0]
            time_list = [t - start_time for t in time_list]
        
        telemetry = TelemetryData(
            time=time_list,
            distance=safe_to_list('Distance', float),
            speed=safe_to_list('Speed', float),
            throttle=safe_to_list('Throttle', float),
            brake=safe_to_list('Brake', float),
            gear=safe_to_list('nGear', int),
            rpm=safe_to_list('RPM', float) if 'RPM' in telemetry_df.columns else None,
            drs=safe_to_list('DRS', int) if 'DRS' in telemetry_df.columns else None
        )
        
        return telemetry
        
    except Exception as e:
        logger.error(f"Failed to process telemetry dataframe: {e}")
        raise


def compare_drivers_telemetry(
    f1_session: fastf1.core.Session,
    driver1: str,
    driver2: str,
    lap_number: int
) -> tuple[Optional[LapMetadata], Optional[TelemetryData], Optional[LapMetadata], Optional[TelemetryData], Optional[float]]:
    """
    Compare telemetry between two drivers for the same lap
    
    Args:
        f1_session: Loaded FastF1 session
        driver1: First driver code
        driver2: Second driver code
        lap_number: Lap number to compare
    
    Returns:
        Tuple of (driver1_lap_meta, driver1_telemetry, driver2_lap_meta, driver2_telemetry, delta_time)
    """
    try:
        # Get telemetry for both drivers
        lap1_meta, telem1 = extract_lap_telemetry(f1_session, driver1, lap_number)
        lap2_meta, telem2 = extract_lap_telemetry(f1_session, driver2, lap_number)
        
        # Calculate delta time
        delta_time = None
        if lap1_meta and lap2_meta and lap1_meta.lap_time_seconds and lap2_meta.lap_time_seconds:
            delta_time = lap1_meta.lap_time_seconds - lap2_meta.lap_time_seconds
        
        return lap1_meta, telem1, lap2_meta, telem2, delta_time
        
    except Exception as e:
        logger.error(f"Failed to compare drivers: {e}")
        raise


def get_fastest_lap(f1_session: fastf1.core.Session, driver: str) -> Optional[int]:
    """
    Get the fastest lap number for a driver
    
    Args:
        f1_session: Loaded FastF1 session
        driver: Driver code
    
    Returns:
        Lap number of fastest lap, or None if not found
    """
    try:
        driver_laps = f1_session.laps.pick_driver(driver)
        
        if driver_laps.empty:
            return None
        
        # Find fastest lap
        fastest = driver_laps.loc[driver_laps['LapTime'].idxmin()]
        return int(fastest['LapNumber'])
        
    except Exception as e:
        logger.warning(f"Failed to get fastest lap for {driver}: {e}")
        return None
