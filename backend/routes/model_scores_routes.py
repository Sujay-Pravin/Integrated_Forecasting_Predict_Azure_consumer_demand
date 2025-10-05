import os
import pandas as pd
from flask import Blueprint, jsonify

model_scores_bp = Blueprint("models_scores", __name__)

# ---------- Load datasets ----------
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

file_top = os.path.join(BASE_DIR, "Model", "results", "top_models_summary.csv")
file_comp = os.path.join(BASE_DIR, "Model", "results", "model_comparison.csv")

df_top = pd.read_csv(file_top)
df_comp = pd.read_csv(file_comp)


# ---------- Routes ----------

# 1. Entire CSVs as JSON
@model_scores_bp.route("/all/top", methods=["GET"])
def get_all_top():
    return jsonify(df_top.to_dict(orient="records"))

@model_scores_bp.route("/all/comparison", methods=["GET"])
def get_all_comparison():
    return jsonify(df_comp.to_dict(orient="records"))


# 2. Best model info per target (from top_model_summary.csv)
@model_scores_bp.route("/<string:target>", methods=["GET"])
def get_best_model_by_target(target):
    row = df_top[df_top["Target"] == target]

    if row.empty:
        return jsonify({"error": f"No model found for target '{target}'"}), 404

    record = row.iloc[0].to_dict()
    result = {
        "model": record["Best_Model"],
        "mae": record["Test_MAE"],
        "rmse": record["Test_RMSE"],
        "mape": record["Test_MAPE"],
        "bias": record["Test_Bias"],
        "hyperparameters": record.get("Hyperparameters", "N/A")
    }
    return jsonify(result)


# 3. All models for a target (from model_comparision.csv)
@model_scores_bp.route("/<string:target>/all", methods=["GET"])
def get_all_models_by_target(target):
    rows = df_comp[df_comp["Target"] == target]

    if rows.empty:
        return jsonify({"error": f"No models found for target '{target}'"}), 404

    return jsonify(rows.to_dict(orient="records"))


# 4. Top 3 models by Test_MAE (from model_comparision.csv)
@model_scores_bp.route("/<string:target>/top3", methods=["GET"])
def get_top3_models_by_target(target):
    rows = df_comp[df_comp["Target"] == target]

    if rows.empty:
        return jsonify({"error": f"No models found for target '{target}'"}), 404

    top3 = rows.sort_values("Val_MAE").head(3)

    return jsonify(top3.to_dict(orient="records"))
