import os
import pandas as pd
from flask import Blueprint, jsonify, request
import joblib
from datetime import timedelta
import numpy as np
import requests
from flask import request, jsonify
model_bp = Blueprint("models", __name__)

# ---------- Load dataset ----------
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
file_path_cpu = os.path.join(BASE_DIR, "Data", "models", "enhanced_features.csv")

model_cpu_path = os.path.join(BASE_DIR, "backend", "models","backtested_models", "usage_cpu_best_model.pkl")
model_storage_path = os.path.join(BASE_DIR, "backend", "models", "backtested_models", "usage_storage_best_e_model.pkl")
model_users_path = os.path.join(BASE_DIR, "backend", "models", "backtested_models", "users_active_best_model.pkl")

encoded_insights = pd.read_csv(file_path_cpu)

# ---------- Load Models ----------
model_cpu = joblib.load(model_cpu_path)
model_storage = joblib.load(model_storage_path)
model_users = joblib.load(model_users_path)


# ---------- Helper Function ----------
def predict_for_march(model, target_col):
    """Generalized predictor for March data"""
    encoded_insights["date"] = pd.to_datetime(encoded_insights["date"])
    march_data = encoded_insights[encoded_insights["date"].dt.month == 3].copy()

    if march_data.empty:
        return None

    feature_cols = [
        col
        for col in march_data.columns
        if col not in ["date", "usage_cpu", "usage_storage", "users_active", "unique_id"]
    ]

    X = march_data[feature_cols]
    y_actual = march_data[target_col].values
    y_pred = model.predict(X)

    results = []
    for date, actual, pred in zip(march_data["date"], y_actual, y_pred):
        results.append({
            "date": date.strftime("%Y-%m-%d"),
            "actual": float(actual),
            "predicted": float(pred)
        })

    return results

# ---------- Routes ----------
@model_bp.route("/predict/march/cpu", methods=["GET"])
def predict_cpu_march():
    results = predict_for_march(model_cpu, "usage_cpu")
    if results is None:
        return jsonify({"error": "No data available for March"}), 404
    return jsonify(results)

@model_bp.route("/predict/march/storage", methods=["GET"])
def predict_storage_march():
    results = predict_for_march(model_storage, "usage_storage")
    if results is None:
        return jsonify({"error": "No data available for March"}), 404
    return jsonify(results)

@model_bp.route("/predict/march/users", methods=["GET"])
def predict_users_march():
    results = predict_for_march(model_users, "users_active")
    if results is None:
        return jsonify({"error": "No data available for March"}), 404
    return jsonify(results)

def forecast_next_30_days(model, target_col, df, variability_factor=0.25, seed=42):


    np.random.seed(seed)  
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    hist_df = df.copy()
    last_date = hist_df["date"].max()
    forecasts = []

    z_score = 1.96  

    for i in range(30):  
        next_date = last_date + timedelta(days=i + 1)
        new_row = hist_df.iloc[-1:].copy()
        new_row["date"] = next_date
        new_row["month"] = next_date.month
        new_row["dayofweek"] = next_date.dayofweek
        new_row["dayofmonth"] = next_date.day
        new_row["quarter"] = (next_date.month - 1) // 3 + 1
        new_row["is_weekend"] = 1 if next_date.weekday() >= 5 else 0

        for lag in [1, 7, 14]:
            if len(hist_df) >= lag:
                prev_val = hist_df[target_col].iloc[-lag]
                pct_change = np.random.normal(0, variability_factor)
                new_row[f"{target_col}_lag_{lag}"] = prev_val * (1 + pct_change)
            else:
                new_row[f"{target_col}_lag_{lag}"] = hist_df[target_col].mean()

        for win in [7, 14]:
            if len(hist_df) >= win:
                prev_window = hist_df[target_col].iloc[-win:]
                pct_changes = np.random.normal(0, variability_factor, size=win)
                adjusted_window = prev_window * (1 + pct_changes)
                new_row[f"{target_col}_roll_mean_{win}"] = adjusted_window.mean()
                new_row[f"{target_col}_roll_std_{win}"] = adjusted_window.std(ddof=0)
            else:
                new_row[f"{target_col}_roll_mean_{win}"] = hist_df[target_col].mean()
                new_row[f"{target_col}_roll_std_{win}"] = hist_df[target_col].std(ddof=0)

        feature_cols = [col for col in hist_df.columns if col not in ["date", "usage_cpu", "usage_storage", "users_active", "unique_id"]]
        X_next = new_row[feature_cols]

        pred = model.predict(X_next)[0]

        std_dev = new_row[[f"{target_col}_roll_std_7", f"{target_col}_roll_std_14"]].mean(axis=1).values[0]


        lower = pred - z_score * std_dev
        upper = pred + z_score * std_dev

        if target_col == "usage_cpu":
            upper = min(upper, 100)
        lower = max(lower, 0)

        forecasts.append({
            "date": next_date.strftime("%Y-%m-%d"),
            "predicted": float(pred),
            "lower_95": float(lower),
            "upper_95": float(upper)
        })

        new_row[target_col] = pred
        hist_df = pd.concat([hist_df, new_row], ignore_index=True)

    return forecasts

@model_bp.route("/forecast/cpu", methods=["GET"])
def forecast_cpu():
    results = forecast_next_30_days(model_cpu, "usage_cpu", encoded_insights, variability_factor=0.25)
    return jsonify(results)

@model_bp.route("/forecast/storage", methods=["GET"])
def forecast_storage():
    results = forecast_next_30_days(model_storage, "usage_storage", encoded_insights, variability_factor=0.25)
    return jsonify(results)

@model_bp.route("/forecast/users", methods=["GET"])
def forecast_users():
    results = forecast_next_30_days(model_users, "users_active", encoded_insights, variability_factor=0.25)
    return jsonify(results)

SERVICE_MAP = {
    "compute": {"model": model_cpu, "target": "usage_cpu"},
    "storage": {"model": model_storage, "target": "usage_storage"},
    "users": {"model": model_users, "target": "users_active"}
}


@model_bp.route("/forecast", methods=["GET"])
def forecast():

    region = request.args.get("region", type=int)
    service = request.args.get("service", type=str)
    horizon = request.args.get("horizon", default=30, type=int)

    if service not in SERVICE_MAP:
        return jsonify({"error": f"Invalid service '{service}'. Must be one of {list(SERVICE_MAP.keys())}"}), 400
    
    if horizon not in [7, 14, 30]:
        return jsonify({"error": f"Invalid horizon '{horizon}'. Must be 7, 14, or 30"}), 400

    if region is not None:
        df_region = encoded_insights[encoded_insights["region_encoded"] == region].copy()
        if df_region.empty:
            return jsonify({"error": f"No data found for region '{region}'"}), 404
    else:
        df_region = encoded_insights.copy()

    model = SERVICE_MAP[service]["model"]
    target_col = SERVICE_MAP[service]["target"]

    results = forecast_next_30_days(model, target_col, df_region, variability_factor=0.25)
    results = results[:horizon]

    pred_values = [item["predicted"] for item in results]

    df_region_sorted = df_region.sort_values("date")
    df_daily = df_region_sorted.groupby("date")[target_col].mean().reset_index()

    prev_values = df_daily[target_col].iloc[-horizon:] if len(df_daily) >= horizon else df_daily[target_col]
    
    prev_sum = float(prev_values.sum()) if len(prev_values) > 0 else 0.0
    prev_mean = float(prev_values.mean()) if len(prev_values) > 0 else 0.0

    forecast_sum = float(np.sum(pred_values)) if pred_values else 0.0
    forecast_mean = float(np.mean(pred_values)) if pred_values else 0.0

    recommended_adjustment = forecast_sum - prev_sum
    adjustment_percent = (recommended_adjustment / prev_sum * 100) if prev_sum > 0 else 0.0

    return jsonify({
        "region": region,
        "service": service,
        "horizon": horizon,
        "forecasts": results,
        "forecast_mean": round(forecast_mean,2),
        "forecast_sum": round(forecast_sum,2),
        "previous_mean": round(prev_mean,2),
        "previous_sum": round(prev_sum,2),
        "recommended_adjustment": round(recommended_adjustment,2),
        "adjustment_percent": round(adjustment_percent, 2)
    })



@model_bp.route("/forecast/download", methods=["GET"])
def download_forecast_csv():
    region = request.args.get("region", type=int)
    service = request.args.get("service", type=str)
    horizon = request.args.get("horizon", default=30, type=int)

    if service not in SERVICE_MAP:
        return jsonify({"error": f"Invalid service '{service}'. Must be one of {list(SERVICE_MAP.keys())}"}), 400
    
    if horizon not in [7, 14, 30]:
        return jsonify({"error": f"Invalid horizon '{horizon}'. Must be 7, 14, or 30"}), 400

    if region is not None:
        df_region = encoded_insights[encoded_insights["region_encoded"] == region].copy()
        if df_region.empty:
            return jsonify({"error": f"No data found for region '{region}'"}), 404
    else:
        df_region = encoded_insights.copy()

    model = SERVICE_MAP[service]["model"]
    target_col = SERVICE_MAP[service]["target"]

    forecasts = forecast_next_30_days(model, target_col, df_region, variability_factor=0.25)
    forecasts = forecasts[:horizon]

    df_region_sorted = df_region.sort_values("date")[["date", target_col]].copy()
    df_region_sorted = df_region_sorted.groupby("date").mean().reset_index().round(2)

    forecast_df = pd.DataFrame({
        "date": [f["date"] for f in forecasts],
        target_col: [f["predicted"] for f in forecasts]
    })

    combined_df = pd.concat([df_region_sorted, forecast_df], ignore_index=True)

    forecast_sum = sum(forecast_df[target_col])
    prev_values = df_region_sorted[target_col].iloc[-horizon:] if len(df_region_sorted) >= horizon else df_region_sorted[target_col]
    prev_sum = prev_values.sum()

    recommended_adjustment = forecast_sum - prev_sum
    percent_change = ((forecast_sum / prev_sum - 1) * 100) if prev_sum > 0 else 0
    adjustment_percent = ((recommended_adjustment / prev_sum) * 100) if prev_sum > 0 else 0

    if adjustment_percent > 10:
        risk_indicator = "🔴 Shortage"
    elif adjustment_percent < -10:
        risk_indicator = "🟡 Over-provision"
    else:
        risk_indicator = "🟢 Sufficient"

    summary_row = pd.DataFrame([{
        "date": "SUMMARY",
        "previous_sum": round(prev_sum, 2),
        "forecast_sum": round(forecast_sum, 2),
        "recommended_adjustment": round(recommended_adjustment, 2),
        "adjustment_percent": round(adjustment_percent, 2),
        "percent_change": round(percent_change, 2),
        "risk_indicator": risk_indicator
    }])

    combined_df = pd.concat([combined_df, summary_row], ignore_index=True)

    from io import StringIO
    csv_buffer = StringIO()
    combined_df.to_csv(csv_buffer, index=False)

    from flask import Response
    return Response(
        csv_buffer.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename={service}_forecast_region_{region}.csv"}
    )
