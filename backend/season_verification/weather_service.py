import logging

logger = logging.getLogger("backend")

# Typical climatological weather data for Central Indian forests
CENTRAL_INDIA_WEATHER = {
    1:  {"season": "Winter (Cool & Dry)", "temp": 19.5, "rainfall": 12.0},  # Jan
    2:  {"season": "Winter (Cool & Dry)", "temp": 22.0, "rainfall": 8.0},   # Feb
    3:  {"season": "Summer (Hot & Dry)",  "temp": 28.5, "rainfall": 4.0},   # Mar
    4:  {"season": "Summer (Hot & Dry)",  "temp": 34.0, "rainfall": 2.0},   # Apr
    5:  {"season": "Summer (Hot & Dry)",  "temp": 38.5, "rainfall": 5.0},   # May
    6:  {"season": "Monsoon (Wet)",       "temp": 32.0, "rainfall": 140.0}, # Jun
    7:  {"season": "Monsoon (Wet)",       "temp": 27.5, "rainfall": 350.0}, # Jul
    8:  {"season": "Monsoon (Wet)",       "temp": 26.5, "rainfall": 380.0}, # Aug
    9:  {"season": "Monsoon (Wet)",       "temp": 27.0, "rainfall": 210.0}, # Sep
    10: {"season": "Winter (Cool & Dry)", "temp": 25.0, "rainfall": 35.0},  # Oct
    11: {"season": "Winter (Cool & Dry)", "temp": 21.5, "rainfall": 10.0},  # Nov
    12: {"season": "Winter (Cool & Dry)", "temp": 18.0, "rainfall": 5.0},   # Dec
}

def resolve_weather_data(lat: float, lon: float, month: int) -> dict:
    """
    Simulates monthly meteorological conditions (temperature, rainfall, and season phase)
    based on the coordinate and target month.
    """
    month = max(1, min(12, int(month)))
    weather = CENTRAL_INDIA_WEATHER.get(month).copy()
    
    # Add minor spatial variations
    # Southern coordinates tend to be slightly warmer
    temp_offset = (22.0 - lat) * 0.2
    weather["temp"] = float(round(weather["temp"] + temp_offset, 1))
    
    # Eastern coordinates tend to get slightly more monsoon rain
    rain_offset = (lon - 80.0) * 15.0 if weather["season"] == "Monsoon (Wet)" else 0.0
    weather["rainfall"] = float(round(max(0.0, weather["rainfall"] + rain_offset), 1))
    
    logger.info(f"Resolved weather parameters: Season={weather['season']}, "
                f"Temp={weather['temp']}°C, Rainfall={weather['rainfall']}mm.")
                
    return weather
