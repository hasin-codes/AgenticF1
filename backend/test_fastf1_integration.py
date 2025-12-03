"""
FastF1 Integration Test Script
Tests FastF1 installation, caching, and telemetry extraction
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import fastf1
from app.config import settings

print("=" * 60)
print("FastF1 Integration Test")
print("=" * 60)

# Test 1: FastF1 Installation
print("\n1. Testing FastF1 Installation...")
try:
    import fastf1
    import pandas as pd
    import numpy as np
    print("   ✓ FastF1 installed successfully")
    print(f"   FastF1 version: {fastf1.__version__}")
except ImportError as e:
    print(f"   ✗ FastF1 installation failed: {e}")
    sys.exit(1)

# Test 2: Cache Configuration
print("\n2. Testing Cache Configuration...")
try:
    cache_dir = settings.FASTF1_CACHE_PATH
    print(f"   Cache directory: {cache_dir}")
    
    if settings.FASTF1_CACHE_ENABLED:
        os.makedirs(cache_dir, exist_ok=True)
        fastf1.Cache.enable_cache(cache_dir)
        print("   ✓ Cache enabled successfully")
    else:
        print("   ⚠ Cache is disabled (data fetching will be slower)")
except Exception as e:
    print(f"   ✗ Cache configuration failed: {e}")

# Test 3: Load Session
print("\n3. Testing Session Load (2024 Monaco GP Race)...")
try:
    year = 2024
    gp = 'Monaco'
    session= 'R'
    
    print(f"   Loading: {year} {gp} {session}")
    f1_session = fastf1.get_session(year, gp, session)
    f1_session.load(laps=True, telemetry=True)
    
    print(f"   ✓ Session loaded: {f1_session.event.EventName}")
    print(f"   Session: {f1_session.name}")
    print(f"   Total laps: {len(f1_session.laps)}")
    
    # Get drivers
    drivers = sorted(set(f1_session.laps['Driver'].dropna().unique()))
    print(f"   Drivers: {', '.join(drivers[:5])}...")
    
except Exception as e:
    print(f"   ✗ Session load failed: {e}")
    print("   Note: This may be expected if the 2024 Monaco GP hasn't happened yet")
    print("   Trying 2023 Monaco GP instead...")
    
    try:
        year = 2023
        f1_session = fastf1.get_session(year, gp, session)
        f1_session.load(laps=True, telemetry=True)
        print(f"   ✓ Session loaded: {f1_session.event.EventName}")
        drivers = sorted(set(f1_session.laps['Driver'].dropna().unique()))
        print(f"   Drivers: {', '.join(drivers[:5])}...")
    except Exception as e2:
        print(f"   ✗ Failed with 2023 as well: {e2}")
        sys.exit(1)

# Test 4: Extract Telemetry
print("\n4. Testing Telemetry Extraction...")
try:
    # Get first available driver
    driver = drivers[0]
    
    # Get driver's laps
    driver_laps = f1_session.laps.pick_driver(driver)
    
    if driver_laps.empty:
        print(f"   ✗ No laps found for {driver}")
    else:
        # Get lap number (use lap 10 or first available)
        available_laps = driver_laps['LapNumber'].tolist()
        lap_num = 10 if 10 in available_laps else available_laps[min(5, len(available_laps)-1)]
        
        lap = driver_laps[driver_laps['LapNumber'] == lap_num].iloc[0]
        
        print(f"   Testing with: {driver} - Lap {lap_num}")
        
        # Get telemetry
        telemetry = lap.get_telemetry()
        
        if telemetry.empty:
            print(f"   ✗ No telemetry data available for this lap")
        else:
            print(f"   ✓ Telemetry extracted successfully")
            print(f"   Telemetry samples: {len(telemetry)}")
            print(f"   Channels: {', '.join(telemetry.columns.tolist()[:8])}...")
            
            # Show sample data
            if 'Speed' in telemetry.columns:
                print(f"   Max speed: {telemetry['Speed'].max():.1f} km/h")
            if 'nGear' in telemetry.columns:
                print(f"   Max gear: {int(telemetry['nGear'].max())}")
                
except Exception as e:
    print(f"   ✗ Telemetry extraction failed: {e}")

# Test 5: Test API Module Imports
print("\n5. Testing API Module Imports...")
try:
    from app.telemetry.session_loader import load_session, get_session_metadata
    from app.telemetry.data_processor import extract_lap_telemetry
    from app.telemetry.models import SessionMetadata, TelemetryData
    print("   ✓ All telemetry modules imported successfully")
except ImportError as e:
    print(f"   ✗ Module import failed: {e}")

print("\n" + "=" * 60)
print("Test Complete!")
print("=" * 60)
print("\nNext Steps:")
print("1. Start the backend: python run.py")
print("2. Test endpoints:")
print(f"   - http://localhost:8000/api/telemetry/events/{year}")
print(f"   - http://localhost:8000/api/telemetry/session?year={year}&gp={gp}&session={session}")
print(f"   - http://localhost:8000/docs (FastAPI Swagger UI)")
