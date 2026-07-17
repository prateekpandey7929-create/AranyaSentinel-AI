from .language_loader import load_language_file, get_supported_languages
from .translation_utils import translate_text

# In-memory session store for language preference (defaults to 'en')
_current_language = "en"

def get_ui_translations(lang: str) -> dict:
    """Returns the complete UI translation dictionary for the requested language."""
    return load_language_file(lang)

def get_available_languages() -> list:
    """Returns available language codes."""
    return get_supported_languages()

def set_global_language(lang: str):
    """Sets the preferred language for backend generation (like PDF reports)."""
    global _current_language
    if lang in get_supported_languages():
        _current_language = lang
    return _current_language

def get_global_language() -> str:
    """Gets the preferred language."""
    return _current_language

def translate_dynamic_content(text: str) -> str:
    """Translates dynamic text based on current global language preference."""
    lang = get_global_language()
    return translate_text(text, lang)
