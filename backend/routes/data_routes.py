import os
import pandas as pd
from flask import Blueprint, jsonify

data_bp = Blueprint("data", __name__)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
file_path1 = os.path.join(BASE_DIR, "Data", "Processed", "insights.csv")
file_path2 = os.path.join(BASE_DIR, "Data", "Processed", "feature_engineered.csv")

print("🔍 Loading file from:", file_path1)

insights_data = pd.read_csv(file_path1)
feature_data = pd.read_csv(file_path2)

# Route for insights.csv
@data_bp.route("/raw-data-insights", methods=["GET"])
def get_raw_data_insights():
    return insights_data.to_dict(orient="records")

# Route for feature_engineered.csv
@data_bp.route("/raw-data-features", methods=["GET"])
def get_raw_data_features():
    return feature_data.to_dict(orient="records")
