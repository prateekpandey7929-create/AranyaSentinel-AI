import logging

logger = logging.getLogger("backend")

def generate_recommendations(prediction: str) -> list:
    """
    Returns an actionable list of suggestions based on prediction category.
    """
    logger.info(f"Recommendation Engine: Resolving action checklist for '{prediction}'...")
    
    if prediction == "Illegal Encroachment & Forest Loss":
        return [
            "Dispatch local forest ranger units for immediate on-site boundary verification.",
            "Flag coordinate bounds to state police for legal investigation under Forest Protection Laws.",
            "Deploy drone passes for real-time high-resolution surveillance of the encroachment buffer area."
        ]
    elif prediction == "Natural Seasonal Vegetation Change":
        return [
            "Bypass immediate ground verification alerts as the canopy drop is seasonally consistent.",
            "Continue monthly automated satellite monitoring to confirm monsoon canopy green-up recovery.",
            "Analyze local soil moisture indices to assess summer drought stress levels."
        ]
    elif prediction == "Deforestation Alarm (Potential Logging)":
        return [
            "Coordinate with regional forest authorities to review local clearing permits and logging logs.",
            "Deploy field patrols to inspect the area for timber extraction paths or fire damage signs.",
            "Perform a historical 12-month vegetation health analysis to verify when the clearing began."
        ]
    elif prediction == "Canopy Ecological Health Decline":
        return [
            "Collect soil samples and inspect foliage during the next scheduled field survey.",
            "Evaluate regional water availability index and check nearby river basin hydrology.",
            "Incorporate targeted ecological restoration activities (e.g. boundary patrol, weeding)."
        ]
    else:
        return [
            "Maintain current automated satellite monitoring pass schedules (Sentinel-2).",
            "Log baseline health parameters for historical forest ecosystem reference."
        ]
