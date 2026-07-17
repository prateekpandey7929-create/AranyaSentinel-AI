import logging

logger = logging.getLogger("backend")

def generate_explanation(metrics: dict, category: str) -> str:
    """
    Generates a rule-based natural language explanation summarizing the forest condition
    based on the calculated metric scores. Avoids external LLM APIs.
    """
    try:
        veg = metrics.get("vegetation_health", 50.0)
        density = metrics.get("forest_density", 50.0)
        loss = metrics.get("forest_loss", 50.0)
        human = metrics.get("human_activity", 100.0)
        water = metrics.get("water_availability", 50.0)
        fire = metrics.get("fire_risk", 50.0)

        # 1. Base statement based on category
        if category == "Excellent":
            summary = "The forest is in pristine ecological condition."
        elif category == "Healthy":
            summary = "The forest is in stable, healthy condition."
        elif category == "Moderate":
            summary = "The forest exhibits moderate health with localized areas of concern."
        elif category == "Poor":
            summary = "The forest is in a degraded, poor condition."
        else:
            summary = "The forest ecosystem is in critical condition, requiring urgent intervention."

        # 2. Vegetation & Density description
        if veg >= 80:
            veg_desc = "vegetation cover is highly dense and lush"
        elif veg >= 50:
            veg_desc = "vegetation cover is moderate"
        else:
            veg_desc = "vegetation is severely sparse and degraded"

        # 3. Forest Loss description
        if loss >= 90:
            loss_desc = "forest clearing is minimal"
        elif loss >= 60:
            loss_desc = "moderate deforestation has occurred"
        else:
            loss_desc = "heavy forest loss has been detected"

        # 4. Human disturbance description
        if human >= 90:
            human_desc = "human disturbance and construction activity are minimal"
        elif human >= 60:
            human_desc = "some artificial encroachments or building constructions have been detected"
        else:
            human_desc = "significant illegal encroachment and construction activities are disrupting the habitat"

        # 5. Moisture and Fire risk description
        moisture_risk = []
        if water < 40:
            moisture_risk.append("severe dryness and low water availability")
        if fire < 40:
            moisture_risk.append("critical fire vulnerability")
        
        if not moisture_risk:
            if water >= 75 and fire >= 75:
                moisture_desc = "there is adequate soil moisture and low vulnerability to wildfires"
            else:
                moisture_desc = "water availability and fire safety are at moderate levels"
        else:
            moisture_desc = " and ".join(moisture_risk) + " pose an active threat to the ecosystem"

        # Combine explanations
        explanation = (
            f"{summary} This is primarily because {veg_desc}, while {loss_desc}. "
            f"Furthermore, {human_desc}, and {moisture_desc}."
        )
        return explanation
    except Exception as e:
        logger.error(f"Error generating explanation: {e}")
        return "Forest health metrics calculations compiled. Analysis completed."
