import logging

logger = logging.getLogger("backend")

# Database of major protected forests/national parks in India with bounding boxes
# Bounding box format: (min_lat, max_lat, min_lon, max_lon)
FORESTS_SPATIAL_DB = [
    {
        "key": "kanha",
        "bbox": (22.0, 22.6, 80.3, 81.1),
        "data": {
            "name": "Kanha Tiger Reserve",
            "forest_type": "Tropical Moist & Dry Deciduous Forest",
            "protected_status": "National Park & Tiger Reserve (IUCN Category II)",
            "district": "Mandla and Balaghat",
            "state": "Madhya Pradesh",
            "country": "India",
            "geographical_location": "Maikal range of Satpuras, Central India",
            "climate": "Subtropical Monsoonal. Temp: 10°C (Winter) to 43°C (Summer)",
            "annual_rainfall": "1620 mm",
            "major_vegetation": "Sal (Shorea robusta) and Teak (Tectona grandis) mixed forest, Bamboo thickets, and open grass meadows",
            "dominant_tree_species": ["Sal (Shorea robusta)", "Teak (Tectona grandis)", "Saj (Terminalia tomentosa)", "Bija (Pterocarpus marsupium)", "Lendia", "Mahua"],
            "biodiversity": "Very High. Prime habitat for large carnivores and rare swamp deer species.",
            "important_flora_and_fauna": "Bengal Tiger, Barasingha (Swamp Deer - state animal), Indian Leopard, Dhole (Wild Dog), Gaur (Indian Bison), Sloth Bear",
            "ecological_importance": "Source area for the Banjar and Halon rivers (tributaries of Narmada River). Vital genetic corridor for tigers in Central India.",
            "nearby_water_bodies": "Banjar River, Halon River, Sulkhum River, and Shravan Tal lake",
            "why_famous": "Famous for successfully saving the Southern Barasingha (Swamp Deer) from extinction, and as the ecological setting that inspired Rudyard Kipling's 'The Jungle Book'."
        }
    },
    {
        "key": "satpura",
        "bbox": (22.3, 22.8, 77.8, 78.5),
        "data": {
            "name": "Satpura Tiger Reserve",
            "forest_type": "Central Highlands dry deciduous and mixed moist deciduous",
            "protected_status": "National Park & Tiger Reserve (IUCN Category II)",
            "district": "Hoshangabad (Narmadapuram)",
            "state": "Madhya Pradesh",
            "country": "India",
            "geographical_location": "Satpura Range, Central Indian Highlands",
            "climate": "Moderate Highlands Climate. Temp: 11°C (Winter) to 42°C (Summer)",
            "annual_rainfall": "1300 mm",
            "major_vegetation": "Teak forest, mixed dry deciduous forest, medicinal plants, and highland shrubs",
            "dominant_tree_species": ["Teak (Tectona grandis)", "Saj (Terminalia elliptica)", "Tendu (Diospyros melanoxylon)", "Mahua (Madhuca longifolia)", "Amla", "Semal"],
            "biodiversity": "High. High rate of endemism in flora.",
            "important_flora_and_fauna": "Indian Giant Squirrel, Bengal Tiger, Leopard, Sloth Bear, Chousingha (Four-horned antelope), Blackbuck, Malabar Whistling Thrush",
            "ecological_importance": "Protects catchment of the Denwa and Tawa rivers. Important bio-corridor connecting eastern and western forest ranges.",
            "nearby_water_bodies": "Denwa River, Tawa Reservoir, and Sonbhadra River",
            "why_famous": "Known for its rugged sandstone peaks, deep gorges, ancient rock shelters with prehistoric paintings (over 10,000 years old), and walking safaris."
        }
    },
    {
        "key": "corbett",
        "bbox": (29.4, 29.7, 78.7, 79.1),
        "data": {
            "name": "Jim Corbett National Park",
            "forest_type": "Himalayan Subtropical Pine & Moist Deciduous Forest",
            "protected_status": "National Park & Tiger Reserve (IUCN Category II)",
            "district": "Nainital and Pauri Garhwal",
            "state": "Uttarakhand",
            "country": "India",
            "geographical_location": "Himalayan Foothills / Shivalik Range",
            "climate": "Temperate Monsoonal. Temp: 4°C (Winter) to 40°C (Summer)",
            "annual_rainfall": "1500 mm to 2000 mm",
            "major_vegetation": "Sal forest, mixed moist deciduous forest, riverine belts, and hilly grasslands (Chaurs)",
            "dominant_tree_species": ["Sal", "Haldu", "Bakli", "Khair", "Sissu", "Chir Pine"],
            "biodiversity": "Extremely High. Over 500 species of birds and rich mammalian density.",
            "important_flora_and_fauna": "Bengal Tiger, Asian Elephant, Gharial (Crocodile), Sambar Deer, Leopard Cat, Great Hornbill, Indian Rock Python",
            "ecological_importance": "Critical watershed basin for the Ramganga River. Preserves the delicate Shivalik Himalayan foothills ecosystem.",
            "nearby_water_bodies": "Ramganga River, Kosi River, and Sonanadi River",
            "why_famous": "Established in 1936 as Hailey National Park, it is India's oldest national park and the birthplace of Project Tiger (launched in 1973)."
        }
    },
    {
        "key": "gir",
        "bbox": (21.0, 21.4, 70.4, 71.3),
        "data": {
            "name": "Gir Forest National Park",
            "forest_type": "Teak-dominated Dry Deciduous Forest & Thorn Scrub",
            "protected_status": "National Park & Wildlife Sanctuary (IUCN Category II)",
            "district": "Junagadh and Gir Somnath",
            "state": "Gujarat",
            "country": "India",
            "geographical_location": "Kathiawar Peninsula, Western India",
            "climate": "Semi-arid and Tropical. Temp: 10°C (Winter) to 45°C (Summer)",
            "annual_rainfall": "800 mm average",
            "major_vegetation": "Dry teak forest, thorn scrub forest, savannah-like open grasslands, and acacia patches",
            "dominant_tree_species": ["Teak (Tectona grandis)", "Khair (Acacia catechu)", "Dhab", "Sadad", "Kalam", "Babul"],
            "biodiversity": "High. Unique semi-arid fauna database.",
            "important_flora_and_fauna": "Asiatic Lion, Indian Leopard, Striped Hyena, Chousingha, Mugger Crocodile, Indian Star Tortoise",
            "ecological_importance": "Acts as a barrier against desertification of the Kathiawar peninsula. Main drainage basin for seven major perennial rivers.",
            "nearby_water_bodies": "Hiran River, Shetrunji River, Kamleshwar Dam, and Raval River",
            "why_famous": "The sole natural sanctuary and home of the endangered Asiatic Lion in the entire world."
        }
    }
]

def get_fallback_forest_profile(lat: float, lon: float) -> dict:
    """
    Generates a scientifically reasonable fallback ecological profile
    based on the state/region of the coordinates.
    """
    logger.info(f"Generating fallback forest profile for coordinates ({lat}, {lon})")
    
    # Simple bounding box check to guess the state/zone
    if 21.0 <= lat <= 26.5 and 74.0 <= lon <= 84.0:
        state = "Madhya Pradesh"
        district = "Central Highlands Region"
        forest_name = f"Central Indian Deciduous Forest Zone (near {lat:.2f}°N, {lon:.2f}°E)"
        forest_type = "Tropical Dry Deciduous Forest"
        rainfall = "1050 mm"
        veg = "Dry Teak and mixed forest, scrub grass, and dry shrublands"
        trees = ["Teak (Tectona grandis)", "Tendu", "Palas (Flame of the Forest)", "Saj", "Banyan", "Peepal"]
        fauna = "Indian Leopard, Chital (Spotted Deer), Wild Boar, Jackal, Nilgai (Blue Bull), Grey Langur"
        rivers = "Narmada River basin system / local forest streams"
        famous = "Part of the continuous Central Indian wildlife corridor, critical for regional tiger connectivity."
    elif 18.0 <= lat <= 23.0 and 72.0 <= lon <= 74.5:
        state = "Gujarat / Maharashtra Border"
        district = "Western Dry Belt"
        forest_name = "Deccan Dry Deciduous Scrubland"
        forest_type = "Dry Deciduous Scrub & Thorn Forest"
        rainfall = "750 mm"
        veg = "Acacia scrubs, dry thorn bushes, and hardy tropical grasses"
        trees = ["Babul (Acacia nilotica)", "Khair", "Neem", "Khejri", "Palas"]
        fauna = "Striped Hyena, Jungle Cat, Indian Fox, Blackbuck, Common Langur, Desert Monitor"
        rivers = "Tapi river basin network"
        famous = "Known for dry-deciduous thorn ecosystems and rich raptor/bird populations."
    else:
        state = "Indian Subcontinent Forest Zone"
        district = "Generic Conservation Zone"
        forest_name = f"Indian Forest Range (Coordinates: {lat:.2f}°N, {lon:.2f}°E)"
        forest_type = "Subtropical Mixed Deciduous Forest"
        rainfall = "1200 mm"
        veg = "Mixed broadleaf deciduous trees, undergrowth shrubs, and seasonal grass"
        trees = ["Teak", "Sal", "Neem", "Banyan", "Peepal", "Bamboo"]
        fauna = "Jungle Cat, Spotted Deer (Chital), Rhesus Macaque, Indian Hare, Peafowl, Indian Cobra"
        rivers = "Local river tributaries"
        famous = "Supports local biodiversity, prevents regional soil erosion, and acts as a local carbon sink."

    return {
        "name": forest_name,
        "forest_type": forest_type,
        "protected_status": "Reserve Forest (State Forest Department Management)",
        "district": district,
        "state": state,
        "country": "India",
        "geographical_location": f"Coordinates: {lat:.4f}°N, {lon:.4f}°E",
        "climate": "Tropical Monsoonal. Typical temperatures: 15°C (Winter) to 42°C (Summer)",
        "annual_rainfall": rainfall,
        "major_vegetation": veg,
        "dominant_tree_species": trees,
        "biodiversity": "Moderate. Supports local bird populations and smaller mammals.",
        "important_flora_and_fauna": fauna,
        "ecological_importance": "Vital local carbon sink, controls watershed runoff, and prevents soil erosion in agricultural zones.",
        "nearby_water_bodies": rivers,
        "why_famous": famous
    }
