"""
Speed telemetry extraction for multi-driver comparison
"""

import logging
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
import fastf1

logger = logging.getLogger(__name__)


def extract_speed_traces(
    f1_session: fastf1.core.Session,
    drivers: List[str],
    lap_number: Optional[int] = None,
    lap_type: str = 'fastest'
) -> Dict[str, Any]:
    """
    Extract speed telemetry traces for multiple drivers
    
    Args:
        f1_session: Loaded FastF1 session
        drivers: List of driver codes (e.g., ['VER', 'LEC'])
        lap_number: Specific lap number, or None for fastest
        lap_type: 'fastest' or 'specific' or lap number
    
    Returns:
        Dictionary with driver traces and metadata
    """
    try:
        traces = []
        max_distance = 0
        
        for driver in drivers:
            try:
                # Get driver laps
                driver_laps = f1_session.laps.pick_driver(driver)
                
                if driver_laps.empty:
                    logger.warning(f"No laps found for driver {driver}")
                    continue
                
                
                # Select lap based on criteria
                if lap_number is not None:
                    lap = driver_laps[driver_laps['LapNumber'] == lap_number]
                    if lap.empty:
                        logger.warning(f"Lap {lap_number} not found for {driver}")
                        continue
                elif lap_type == 'fastest':
                    # Get fastest lap - filter out invalid times first
                    valid_laps = driver_laps[driver_laps['LapTime'].notna()]
                    if valid_laps.empty:
                        logger.warning(f"No valid lap times for {driver}")
                        continue
                    fastest_idx = valid_laps['LapTime'].idxmin()
                    lap = valid_laps.loc[[fastest_idx]]
                else:
                    # Default to first valid lap
                    lap = driver_laps.iloc[[0]]
                
                if lap.empty:
                    logger.warning(f"No valid lap found for {driver}")
                    continue
                
                lap = lap.iloc[0]
                
                # Get telemetry
                try:
                    logger.info(f"Getting telemetry for {driver}, lap {lap['LapNumber']}")
                    telemetry = lap.get_telemetry()
                    logger.info(f"Telemetry retrieved: {len(telemetry)} data points")
                except Exception as tel_error:
                    logger.error(f"Error getting telemetry for {driver}: {tel_error}")
                    continue
                
                if telemetry is None or telemetry.empty:
                    logger.warning(f"No telemetry data for {driver}")
                    continue
                
                # Sample at 10Hz for performance
                telemetry = telemetry.add_distance()
                
                # Extract speed, distance, throttle, and brake
                distance = telemetry['Distance'].to_numpy()
                speed = telemetry['Speed'].to_numpy()
                throttle = telemetry['Throttle'].to_numpy()
                brake = telemetry['Brake'].to_numpy()
                
                # Track max distance for normalization
                if len(distance) > 0:
                    max_distance = max(max_distance, distance[-1])
                
                # Get lap metadata
                lap_time = lap.get('LapTime')
                lap_time_seconds = lap_time.total_seconds() if pd.notna(lap_time) and hasattr(lap_time, 'total_seconds') else None
                
                # Get driver's team for color (simplified - could enhance with team mapping)
                team = f1_session.get_driver(driver).get('TeamName', 'Unknown') if hasattr(f1_session, 'get_driver') else 'Unknown'
                
                traces.append({
                    'driver': driver,
                    'team': team,
                    'lap_number': int(lap['LapNumber']),
                    'lap_time': lap_time_seconds,
                    'distance': distance.tolist(),
                    'speed': speed.tolist(),
                    'throttle': throttle.tolist(),
                    'brake': brake.tolist(),
                    'color': _get_team_color(team, driver)
                })
                
            except Exception as e:
                logger.error(f"Failed to extract telemetry for {driver}: {e}")
                continue
        
        if not traces:
            return {
                'traces': [],
                'max_distance': 0,
                'error': 'No telemetry data available for selected drivers'
            }
        
        # Calculate delta if we have exactly 2 drivers
        delta_data = None
        if len(traces) == 2:
            delta_data = _calculate_delta(traces[0], traces[1], max_distance)
        
        # Get circuit info (corners)
        circuit_info = None
        try:
            circuit = f1_session.get_circuit_info()
            if circuit is not None:
                circuit_info = {
                    'corners': circuit.corners[['Number', 'Distance']].to_dict('records'),
                    'rotation': circuit.rotation
                }
        except Exception as e:
            logger.warning(f"Failed to get circuit info: {e}")

        return {
            'traces': traces,
            'max_distance': float(max_distance),
            'delta': delta_data,
            'circuit_info': circuit_info,
            'session_info': {
                'year': f1_session.event.year,
                'gp': f1_session.event.EventName,
                'session': f1_session.name
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to extract speed traces: {e}")
        raise


def _calculate_delta(trace1: Dict, trace2: Dict, max_distance: float) -> Dict[str, Any]:
    """
    Calculate speed delta between two drivers
    
    Args:
        trace1: First driver's trace data
        trace2: Second driver's trace data
        max_distance: Maximum distance for interpolation
    
    Returns:
        Delta data aligned by distance
    """
    try:
        # Interpolate both traces to common distance points
        num_points = 200  # Balanced resolution
        common_distance = np.linspace(0, max_distance, num_points)
        
        # Interpolate speed traces
        speed1_interp = np.interp(common_distance, trace1['distance'], trace1['speed'])
        speed2_interp = np.interp(common_distance, trace2['distance'], trace2['speed'])
        
        # Calculate delta (driver1 - driver2)
        delta_speed = speed1_interp - speed2_interp
        
        return {
            'distance': common_distance.tolist(),
            'delta': delta_speed.tolist(),
            'driver1': trace1['driver'],
            'driver2': trace2['driver']
        }
        
    except Exception as e:
        logger.error(f"Failed to calculate delta: {e}")
        return None


def _get_team_color(team: str, driver: str) -> str:
    """
    Get team color hex code
    
    Args:
        team: Team name
        driver: Driver code (fallback)
    
    Returns:
        Hex color code
    """
    # F1 2024 team colors
    team_colors = {
        'red bull racing': '#1E5F63',
        'ferrari': '#DC0000',
        'mercedes': '#00D2BE',
        'mclaren': '#FF8700',
        'aston martin': '#006F62',
        'alpine': '#0090FF',
        'williams': '#005AFF',
        'alphatauri': '#2B4562',
        'rb': '#2B4562',
        'alfa romeo': '#900000',
        'haas': '#FFFFFF',
        'sauber': '#00E701',
        'kick sauber': '#00E701'
    }
    
    team_lower = team.lower()
    for team_key, color in team_colors.items():
        if team_key in team_lower:
            return color
    
    # Fallback: generate color from driver code
    return f"#{hash(driver) % 0xFFFFFF:06x}"
