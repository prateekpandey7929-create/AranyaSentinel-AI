from .history_utils import get_all_history
from .history_models import TrendResponse, TrendPoint

def compile_historical_trends() -> TrendResponse:
    """
    Parses historical data and returns trend arrays suitable for charting.
    Ensures data is ordered chronologically (oldest to newest) for line charts.
    """
    records = get_all_history()
    
    # Sort chronological for charts
    sorted_records = sorted(records, key=lambda x: x.get("date", ""))
    
    forest_loss_trend = []
    ndvi_trend = []
    health_trend = []
    severity_trend = []
    human_activity_trend = []
    
    for r in sorted_records:
        date = r.get("date", "Unknown")
        forest_loss_trend.append(TrendPoint(date=date, value=r.get("forest_loss_percentage", 0.0)))
        ndvi_trend.append(TrendPoint(date=date, value=r.get("ndvi", 0.0)))
        health_trend.append(TrendPoint(date=date, value=float(r.get("forest_health_score", 0))))
        
        # Mapping Severity to numeric for bar chart, or sending categorical
        # Usually charting libs handle categorical if structured correctly.
        # Let's map severity to a 1-3 scale for the chart, or return string value if supported.
        # TrendPoint takes float for value, so let's map: Low=1, Medium=2, High=3
        sev = r.get("severity", "Low")
        sev_val = 3.0 if sev == "High" else 2.0 if sev == "Medium" else 1.0
        severity_trend.append(TrendPoint(date=date, value=sev_val))
        
        human_activity_trend.append(TrendPoint(date=date, value=float(r.get("human_activity_score", 0))))
        
    return TrendResponse(
        forest_loss_trend=forest_loss_trend,
        ndvi_trend=ndvi_trend,
        health_trend=health_trend,
        severity_trend=severity_trend,
        human_activity_trend=human_activity_trend
    )
