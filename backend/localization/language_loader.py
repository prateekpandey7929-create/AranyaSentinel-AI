import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOCALES_DIR = os.path.join(BASE_DIR, "frontend", "public", "locales")

def load_language_file(lang_code: str) -> dict:
    """Loads the UI translation JSON file from the frontend locales directory."""
    file_path = os.path.join(LOCALES_DIR, lang_code, "translation.json")
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def get_supported_languages() -> list:
    """Returns a list of supported language codes."""
    if not os.path.exists(LOCALES_DIR):
        return ["en", "hi"]
    return [d for d in os.listdir(LOCALES_DIR) if os.path.isdir(os.path.join(LOCALES_DIR, d))]
