import os
import yaml

# Resolve absolute path to project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CONFIG_PATH = os.path.join(BASE_DIR, 'config', 'settings.yaml')
OUTPUTS_DIR = os.path.join(BASE_DIR, 'outputs')

def load_settings():
    """
    Loads configuration settings from config/settings.yaml.
    """
    if not os.path.exists(CONFIG_PATH):
        raise FileNotFoundError(f"Configuration file not found at: {CONFIG_PATH}")
    with open(CONFIG_PATH, "r") as f:
        return yaml.safe_load(f)

def save_settings(config_data):
    """
    Saves updated configuration data back to config/settings.yaml dynamically.
    """
    with open(CONFIG_PATH, "w") as f:
        yaml.safe_dump(config_data, f, default_flow_style=False)
    print(f"Updated configuration saved successfully to: {CONFIG_PATH}")
    return True

def get_summary_text():
    """
    Returns the plain-text contents of outputs/summary.txt.
    """
    summary_path = os.path.join(OUTPUTS_DIR, "summary.txt")
    if not os.path.exists(summary_path):
        raise FileNotFoundError(f"Summary report file not found at: {summary_path}. Run /analyze first.")
    with open(summary_path, "r") as f:
        return f.read()

def get_severity_json():
    """
    Returns the JSON metrics of outputs/severity.json.
    """
    import json
    severity_path = os.path.join(OUTPUTS_DIR, "severity.json")
    if not os.path.exists(severity_path):
        raise FileNotFoundError(f"Severity metrics file not found at: {severity_path}. Run /analyze first.")
    with open(severity_path, "r") as f:
        return json.load(f)
