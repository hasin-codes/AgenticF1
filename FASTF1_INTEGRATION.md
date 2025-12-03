# FastF1 Integration Guide

## Overview

This guide documents the integration of FastF1 library into the F1 Telemetry application's Python FastAPI backend.

## What is FastF1?

FastF1 is the de-facto community library for accessing and analyzing Formula 1 results, telemetry, timing data, and session information. It provides:

- Race results and standings
- Lap-by-lap timing data
- Car telemetry (speed, throttle, brake, gear, etc.)
- Session metadata (drivers, laps, sectors)

**Important Constraints:**
- Full telemetry is only available for **2018 onwards**
- Some sessions may have missing or incomplete data
- Data is from unofficial public timing feeds
- Live timing requires Python 3.8 or 3.9 (we focus on post-session analysis)

## Installation

Dependencies are specified in `backend/requirements.txt`:

```
fastf1>=3.0.0
pandas>=2.0.0
numpy>=1.24.0
```

Install with:
```bash
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

## Configuration

FastF1 caching is configured in `backend/app/config.py`:

- `FASTF1_CACHE_PATH`: Cache directory (default: `./data/fastf1_cache`)
- `FASTF1_CACHE_ENABLED`: Enable/disable caching (default: `true`)
- `TELEMETRY_MAX_LAPS`: Maximum laps to process
- `TELEMETRY_TIMEOUT`: Timeout for telemetry requests

Cache significantly improves performance. First-time session loads may take 10-30 seconds, subsequent loads from cache take <1 second.

## API Endpoints

### GET `/api/telemetry/events/{year}`
Get list of F1 events for a given year.

**Example:**
```bash
curl http://localhost:8000/api/telemetry/events/2024
```

**Response:**
```json
{
  "year": 2024,
  "events": [
    {
      "round": 1,
      "event_name": "Bahrain Grand Prix",
      "country": "Bahrain",
      "location": "Sakhir",
      "date": "2024-03-02"
    },
    ...
  ]
}
```

### GET `/api/telemetry/session`
Get session metadata including available drivers and laps.

**Query Params:**
- `year`: Season year (e.g., 2024)
- `gp`: Grand Prix name (e.g., "Monaco")  
- `session`: Session type ("FP1", "FP2", "FP3", "Q", "S", "R")

**Example:**
```bash
curl "http://localhost:8000/api/telemetry/session?year=2024&gp=Monaco&session=R"
```

**Response:**
```json
{
  "year": 2024,
  "gp": "Monaco Grand Prix",
  "session": "R",
  "drivers": ["VER", "HAM", "LEC", ...],
  "total_laps": 78,
  "session_name": "Race",
  "event_name": "Monaco Grand Prix",
  "cached": true
}
```

### GET `/api/telemetry/lap`
Get telemetry data for a specific driver and lap.

**Query Params:**
- `year`: Season year
- `gp`: Grand Prix name
- `session`: Session type
- `driver`: Driver code (e.g., "VER", "HAM")
- `lap`: Lap number

**Example:**
```bash
curl "http://localhost:8000/api/telemetry/lap?year=2024&gp=Monaco&session=R&driver=VER&lap=12"
```

**Response:**
```json
{
  "lap_meta": {
    "lap_number": 12,
    "driver": "VER",
    "lap_time_seconds": 72.345,
    "lap_time_str": "1:12.345",
    "sector_1_time": 18.234,
    "sector_2_time": 26.543,
    "sector_3_time": 27.568,
    "compound": "SOFT",
    "is_personal_best": false
  },
  "telemetry": {
    "time": [0.0, 0.05, 0.1, ...],
    "distance": [0.0, 3.5, 7.0, ...],
    "speed": [0, 45.5, 91.2, ..., 285.3, ...],
    "throttle": [0, 50.5, 100, ...],
    "brake": [0, 0, 0, ..., 100, ...],
    "gear": [1, 2, 3, ..., 8, ...],
    "rpm": [8000, 10000, 12000, ...],
    "drs": [0, 0, 1, ...]
  }
}
```

### GET `/api/telemetry/compare`
Compare telemetry between two drivers for the same lap.

**Query Params:**
- `year`: Season year
- `gp`: Grand Prix name
- `session`: Session type
- `driver1`: First driver code
- `driver2`: Second driver code
- `lap`: Lap number

**Example:**
```bash
curl "http://localhost:8000/api/telemetry/compare?year=2024&gp=Monaco&session=R&driver1=VER&driver2=LEC&lap=12"
```

**Response:**
```json
{
  "session_meta": { ... },
  "driver1": "VER",
  "driver2": "LEC",
  "lap_number": 12,
  "driver1_lap": { ... },
  "driver2_lap": { ... },
  "driver1_telemetry": { ... },
  "driver2_telemetry": { ... },
  "delta_time": -0.234
}
```

### GET `/api/telemetry/fastest-lap/{year}/{gp}/{session}/{driver}`
Get the fastest lap number for a specific driver.

**Example:**
```bash
curl http://localhost:8000/api/telemetry/fastest-lap/2024/Monaco/Q/VER
```

## Error Handling

All endpoints return structured errors:

**404 - Not Found:**
```json
{
  "detail": "Lap 12 not found for driver VER"
}
```

**500 - Server Error:**
```json
{
  "detail": "Failed to retrieve session metadata: ..."
}
```

## Testing

Run the integration test script:

```bash
cd backend
python test_fastf1_integration.py
```

This will test:
1. FastF1 installation
2. Cache configuration
3. Session loading
4. Telemetry extraction
5. Module imports

## Interactive API Documentation

FastAPI provides automatic Swagger UI documentation:

```
http://localhost:8000/docs
```

Visit this URL while the backend is running to interactively test all endpoints.

## Known Limitations

1. **Data Availability**: Telemetry only available for 2018+ seasons
2. **Missing Sessions**: Some races may have incomplete or missing telemetry
3. **Performance**: First-time loads can take 10-30 seconds without cache
4. **Live Timing**: Not supported in current implementation
5. **Legal**: Unofficial data from public feeds - check redistribution constraints

## Troubleshooting

### "Session not found" Error
- Check year, GP name, and session type
- Try using different GP name formats ("Monaco" vs "Monaco Grand Prix")
- Verify the session has taken place

### "Telemetry not available"
- Telemetry may not exist for all laps (e.g., incomplete laps, in/out laps)
- Try a different lap number
- Check if session is from 2018 onwards

### Slow Performance
- Ensure cache is enabled in config
- Check cache directory permissions
- First load will always be slow - subsequent loads use cache

### Module Import Errors
- Verify all dependencies installed: `pip install -r requirements.txt`
- Check Python version (3.9+ recommended)

## Frontend Integration Example

```typescript
// Fetch session data  
const getSession = async (year: number, gp: string, session: string) => {
  const response = await fetch(
    `http://localhost:8000/api/telemetry/session?year=${year}&gp=${gp}&session=${session}`
  );
  return await response.json();
};

// Fetch lap telemetry
const getLapTelemetry = async (year: number, gp: string, session: string, driver: string, lap: number) => {
  const response = await fetch(
    `http://localhost:8000/api/telemetry/lap?year=${year}&gp=${gp}&session=${session}&driver=${driver}&lap=${lap}`
  );
  return await response.json();
};

// Use in component
const telemetry = await getLapTelemetry(2024, 'Monaco', 'R', 'VER', 12);
// telemetry.telemetry.speed = [0, 45.5, 91.2, ...]
// telemetry.telemetry.time = [0, 0.05, 0.1, ...]
```

## Next Steps

1. Start backend: `python run.py`
2. Test endpoints using Swagger UI at `http://localhost:8000/docs`
3. Integrate frontend components to call telemetry APIs
4. Update telemetry panel to visualize real data
