import logging

logger = logging.getLogger("backend")

def format_reasoning(prediction: str, forest_loss_pct: float, encroachments: int, health_score: float) -> str:
    """
    Formulates a descriptive reason for the resolved category.
    """
    logger.info(f"Explanation Generator: Formatting reason details...")
    
    if prediction == "Illegal Encroachment & Forest Loss":
        return (
            f"Active human encroachment detected. The YOLOv8 construction footprint scanner identified "
            f"{encroachments} building structure(s) inside the forest boundary, accompanied by "
            f"{forest_loss_pct:.1f}% forest canopy loss."
        )
    elif prediction == "Natural Seasonal Vegetation Change":
        return (
            "Observed canopy drop is verified as natural deciduous leaf shedding. In this season, high "
            "temperatures and lack of rainfall trigger deciduous trees to shed leaves. Normal forest canopy "
            "remains intact underneath."
        )
    elif prediction == "Deforestation Alarm (Potential Logging)":
        return (
            f"Significant forest canopy clearing of {forest_loss_pct:.1f}% detected with zero visible building "
            f"footprints, suggesting potential logging, agricultural encroachment, or forest fire clearing."
        )
    elif prediction == "Canopy Ecological Health Decline":
        return (
            f"Forest health index has dropped to {health_score:.1f}/100. While active clearing is low "
            f"({forest_loss_pct:.1f}%), the forest is experiencing general stress, likely from drought, "
            f"soil nutrient depletion, or pests."
        )
    else:
        return (
            f"The forest canopy is stable, showing minor natural variance. Vegetation levels ({health_score:.1f}/100) "
            f"indicate a healthy, thriving local ecosystem."
        )

def build_executive_summary(reason: str, severity: str, confidence: float, first_action: str) -> str:
    """
    Constructs an executive text summary answering:
    - What happened
    - Why it happened
    - How severe it is
    - What should be done next
    """
    return (
        f"WHAT: A canopy change check was run on this region. "
        f"WHY: {reason} "
        f"SEVERITY: {severity} severity status has been logged with {confidence:.1f}% AI confidence. "
        f"NEXT STEPS: It is suggested to: {first_action.strip('.')}"
    )
