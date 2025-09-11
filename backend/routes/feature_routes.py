import os
import json
import ast
import re
import pandas as pd
from flask import Blueprint, jsonify
from datetime import timedelta

features_bp = Blueprint("features", __name__)

# ---------- Load dataset ----------
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
file_path = os.path.join(BASE_DIR, "Data", "Processed", "feature_engineered.csv")

df = pd.read_csv(file_path)
df["date"] = pd.to_datetime(df["date"])


# ---------- Helpers ----------
def parse_json_field(value):
    """Parse JSON, numpy-style arrays, or leave as-is."""
    if isinstance(value, str):
        value = value.strip()

        # Case 1: Looks like JSON object or list
        if value.startswith("{") or value.startswith("["):
            try:
                return json.loads(value.replace("'", '"'))
            except Exception:
                try:
                    return ast.literal_eval(value)
                except Exception:
                    pass

        # Case 2: NumPy-like array: ['east us' 'west us']
        if value.startswith("[") and "'" in value and " " in value:
            try:
                items = re.findall(r"'([^']+)'", value)
                return items
            except Exception:
                pass

    return value


def safe_value(val):
    """Convert numpy & pandas types to Python builtins"""
    if isinstance(val, (pd.Period,)):
        return str(val)
    if hasattr(val, "item"):
        return val.item()
    return val


def get_row(date):
    row = df[df["date"] == date]
    if row.empty:
        return None
    return row.iloc[0]


# ---------- Routes ----------

@features_bp.route("/dates", methods=["GET"])
def get_all_dates():
    """Return all available dates in the dataset"""
    dates = df["date"].dt.strftime("%Y-%m-%d").unique().tolist()
    return jsonify({"available_dates": dates})

@features_bp.route("/months", methods=["GET"])
def get_all_months():
    """Return all available months in the dataset"""
    months = df["date"].dt.to_period("M").astype(str).unique().tolist()
    months.sort()
    return jsonify({"available_months": months})


@features_bp.route("/dates/<month>", methods=["GET"])
def get_dates_in_month(month):
    """
    Return all available dates in a given month (YYYY-MM format).
    Example: /api/features/dates/2023-01
    """
    try:
        filtered = df[df["date"].dt.to_period("M").astype(str) == month]
        if filtered.empty:
            return jsonify({"error": f"No data found for month {month}"}), 404

        dates = filtered["date"].dt.strftime("%Y-%m-%d").unique().tolist()
        dates.sort()
        return jsonify({"month": month, "available_dates": dates})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@features_bp.route("/<date>/cpu", methods=["GET"])
def cpu_by_date(date):
    row = get_row(date)
    if row is None:
        return jsonify({"error": "Date not found"}), 404

    extremes = parse_json_field(row["cpu"])
    return jsonify({
        "mean": safe_value(row["cpu_mean"]),
        "total": safe_value(row["cpu_tot"]),
        "std": safe_value(row["cpu_std"]),
        "min_resource": extremes.get("min") if isinstance(extremes, dict) else extremes,
        "max_resource": extremes.get("max") if isinstance(extremes, dict) else extremes
    })


@features_bp.route("/<date>/storage", methods=["GET"])
def storage_by_date(date):
    row = get_row(date)
    if row is None:
        return jsonify({"error": "Date not found"}), 404

    extremes = parse_json_field(row["storage"])
    return jsonify({
        "mean": safe_value(row["storage_mean"]),
        "total": safe_value(row["storage_tot"]),
        "std": safe_value(row["storage_std"]),
        "min_resource": extremes.get("min") if isinstance(extremes, dict) else extremes,
        "max_resource": extremes.get("max") if isinstance(extremes, dict) else extremes
    })


@features_bp.route("/<date>/users", methods=["GET"])
def users_by_date(date):
    row = get_row(date)
    if row is None:
        return jsonify({"error": "Date not found"}), 404

    extremes = parse_json_field(row["users"])
    return jsonify({
        "mean": safe_value(row["users_mean"]),
        "total": safe_value(row["users_tot"]),
        "std": safe_value(row["users_std"]),
        "min_resource": extremes.get("min") if isinstance(extremes, dict) else extremes,
        "max_resource": extremes.get("max") if isinstance(extremes, dict) else extremes
    })


@features_bp.route("/<date>/economy", methods=["GET"])
def economy_by_date(date):
    row = get_row(date)
    if row is None:
        return jsonify({"error": "Date not found"}), 404

    return jsonify({
        "economic_index": safe_value(row["economic_index"]),
        "cloud_market_demand": safe_value(row["cloud_market_demand"]),
        "holiday": safe_value(row["holiday"])
    })



@features_bp.route("/<date>/summary", methods=["GET"])
def summary_by_date(date):
    row = get_row(date)
    if row is None:
        return jsonify({"error": "Date not found"}), 404

    return jsonify({
        "unique_regions": safe_value(row["unique_regions"]),
        "total_records": safe_value(row["total_records"]),
        "resources_per_region": parse_json_field(row["resources_per_region"]),
    })

#-------------------------------------------------------------------------------

def get_range_data(start_date_str, days):
    """Return dataframe for a given range (date + days-1)."""
    try:
        start_date = pd.to_datetime(start_date_str)
        days = int(days)
        if days < 1:
            return None
    except Exception:
        return None
    
    end_date = start_date + timedelta(days=days - 1)
    range_df = df[(df["date"] >= start_date) & (df["date"] <= end_date)]
    
    # Ensure all expected days are present
    expected_days = pd.date_range(start=start_date, end=end_date, freq="D")
    if not all(day in range_df["date"].values for day in expected_days):
        return None
    return range_df


#-------------------------------------------------------------------------------

@features_bp.route("/range/<date>/<days>/cpu", methods=["GET"])
def cpu_by_range(date, days):
    range_df = get_range_data(date, days)
    if range_df is None or range_df.empty:
        return jsonify({"error": f"No data for full range starting at {date} for {days} days"}), 404

    # Parse min/max from each day
    min_candidates, max_candidates = [], []
    for _, row in range_df.iterrows():
        parsed = parse_json_field(row["cpu"])
        if isinstance(parsed, dict):
            if "min" in parsed:
                min_candidates.append(parsed["min"])
            if "max" in parsed:
                max_candidates.append(parsed["max"])

    return jsonify({
        "mean": safe_value(range_df["cpu_mean"].mean().round(2)),
        "total": safe_value(range_df["cpu_tot"].sum()),
        "std": safe_value(range_df["cpu_std"].mean().round(2)),
        "min_resource": min(min_candidates, key=lambda x: x["value"]) if min_candidates else None,
        "max_resource": max(max_candidates, key=lambda x: x["value"]) if max_candidates else None,
    })



#-------------------------------------------------------------------------------

@features_bp.route("/range/<date>/<days>/storage", methods=["GET"])
def storage_by_range(date, days):
    range_df = get_range_data(date, days)
    if range_df is None or range_df.empty:
        return jsonify({"error": f"No data for full range starting at {date} for {days} days"}), 404

    min_candidates, max_candidates = [], []
    for _, row in range_df.iterrows():
        parsed = parse_json_field(row["storage"])
        if isinstance(parsed, dict):
            if "min" in parsed:
                min_candidates.append(parsed["min"])
            if "max" in parsed:
                max_candidates.append(parsed["max"])

    return jsonify({
        "mean": safe_value(range_df["storage_mean"].mean().round(2)),
        "total": safe_value(range_df["storage_tot"].sum()),
        "std": safe_value(range_df["storage_std"].mean().round(2)),
        "min_resource": min(min_candidates, key=lambda x: x["value"]) if min_candidates else None,
        "max_resource": max(max_candidates, key=lambda x: x["value"]) if max_candidates else None,
    })




#-------------------------------------------------------------------------------
@features_bp.route("/range/<date>/<days>/users", methods=["GET"])
def users_by_range(date, days):
    range_df = get_range_data(date, days)
    if range_df is None or range_df.empty:
        return jsonify({"error": f"No data for full range starting at {date} for {days} days"}), 404

    min_candidates, max_candidates = [], []
    for _, row in range_df.iterrows():
        parsed = parse_json_field(row["users"])
        if isinstance(parsed, dict):
            if "min" in parsed:
                min_candidates.append(parsed["min"])
            if "max" in parsed:
                max_candidates.append(parsed["max"])

    return jsonify({
        "mean": safe_value(range_df["users_mean"].mean().round(2)),
        "total": safe_value(range_df["users_tot"].sum()),
        "std": safe_value(range_df["users_std"].mean().round(2)),
        "min_resource": min(min_candidates, key=lambda x: x["value"]) if min_candidates else None,
        "max_resource": max(max_candidates, key=lambda x: x["value"]) if max_candidates else None,
    })



#-------------------------------------------------------------------------------

@features_bp.route("/range/<date>/<days>/economy", methods=["GET"])
def economy_by_range(date, days):
    range_df = get_range_data(date, days)
    if range_df is None or range_df.empty:
        return jsonify({"error": f"No data for full range starting at {date} for {days} days"}), 404

    peak_cloud = range_df.loc[range_df["cloud_market_demand"].idxmax()]
    peak_index = range_df.loc[range_df["economic_index"].idxmax()]

    return jsonify({
        "economic_index_mean": safe_value(range_df["economic_index"].mean().round(2)),
        "cloud_market_demand_mean": safe_value(range_df["cloud_market_demand"].mean().round(2)),
        "peak_cloud_demand": {
            "date": str(peak_cloud["date"].date()),
            "value": safe_value(peak_cloud["cloud_market_demand"])
        },
        "peak_cloud_index": {
            "date": str(peak_index["date"].date()),
            "value": safe_value(peak_index["economic_index"])
        }
    })




#-------------------------------------------------------------------------------

@features_bp.route("/range/<date>/<days>/summary", methods=["GET"])
def summary_by_range(date, days):
    range_df = get_range_data(date, days)
    if range_df is None or range_df.empty:
        return jsonify({"error": f"No data for full range starting at {date} for {days} days"}), 404

    return jsonify({
        "unique_regions": safe_value(range_df["unique_regions"].sum()),
        "total_records": safe_value(range_df["total_records"].sum()),
        "resources_per_region": range_df["resources_per_region"].apply(parse_json_field).tolist()
    })



#-------------------------------------------------------------------------------

@features_bp.route("/range/<date>/<days>/holidays", methods=["GET"])
def holidays_by_range(date, days):
    range_df = get_range_data(date, days)
    if range_df is None or range_df.empty:
        return jsonify({"error": f"No data for full range starting at {date} for {days} days"}), 404

    holidays_df = range_df[range_df["holiday"] == 1]
    weekdays_df = range_df[range_df["holiday"] == 0]

    num_holidays = len(holidays_df)

    def percent_change(holiday_val, weekday_val):
        if weekday_val == 0:
            return None
        return round(((holiday_val - weekday_val) / weekday_val) * 100, 2)

    result = {
        "num_holidays": num_holidays,
        "holiday_dates": holidays_df["date"].tolist(),  # <-- added array of holiday dates
        "resource_utilization": {}
    }

    for resource in ["cpu_mean", "storage_mean", "users_mean"]:
        holiday_avg = holidays_df[resource].mean() if not holidays_df.empty else 0
        weekday_avg = weekdays_df[resource].mean() if not weekdays_df.empty else 0
        change = percent_change(holiday_avg, weekday_avg)

        result["resource_utilization"][resource.replace("_mean", "")] = {
            "weekday_avg": safe_value(weekday_avg),
            "holiday_avg": safe_value(holiday_avg),
            "percent_change": change
        }

    return jsonify(result)

# ---------------------------------------------------------------

@features_bp.route("/cpu/rolling/<int:window>", methods=["GET"])
def cpu_with_rolling(window):
    """Return CPU values, dates, and rolling averages for a given window size."""
    if df is None or df.empty:
        return jsonify({"error": "No data available"}), 404
    temp_df = df.sort_values("date").copy()

    temp_df["rolling_avg"] = temp_df["cpu_mean"].rolling(window=window).mean()

    temp_df = temp_df.dropna(subset=["rolling_avg"])

    result = {
        "dates": temp_df["date"].dt.strftime("%Y-%m-%d").tolist(),
        "values": temp_df["cpu_mean"].round(2).tolist(),
        "rolling_avg": temp_df["rolling_avg"].round(2).tolist(),
    }

    return jsonify(result)


# ---------------------------------------------------------------

@features_bp.route("/storage/rolling/<int:window>", methods=["GET"])
def storage_with_rolling(window):
    """Return storage values, dates, and rolling averages for a given window size."""
    if df is None or df.empty:
        return jsonify({"error": "No data available"}), 404
    temp_df = df.sort_values("date").copy()

    temp_df["rolling_avg"] = temp_df["storage_mean"].rolling(window=window).mean()

    temp_df = temp_df.dropna(subset=["rolling_avg"])

    result = {
        "dates": temp_df["date"].dt.strftime("%Y-%m-%d").tolist(),
        "values": temp_df["storage_mean"].round(2).tolist(),
        "rolling_avg": temp_df["rolling_avg"].round(2).tolist(),
    }

    return jsonify(result)

# ---------------------------------------------------------------

@features_bp.route("/users/rolling/<int:window>", methods=["GET"])
def users_with_rolling(window):
    """Return users values, dates, and rolling averages for a given window size."""
    if df is None or df.empty:
        return jsonify({"error": "No data available"}), 404
    temp_df = df.sort_values("date").copy()

    temp_df["rolling_avg"] = temp_df["users_mean"].rolling(window=window).mean()

    temp_df = temp_df.dropna(subset=["rolling_avg"])

    result = {
        "dates": temp_df["date"].dt.strftime("%Y-%m-%d").tolist(),
        "values": temp_df["users_mean"].round(2).tolist(),
        "rolling_avg": temp_df["rolling_avg"].round(2).tolist(),
    }

    return jsonify(result)


# ---------------------------------------------------------------------------------------

def format_range_response(range_df, col_prefix):
    """Helper to return standardized response for charting."""
    return {
        "dates": range_df["date"].dt.strftime("%Y-%m-%d").tolist(),
        "mean": range_df[f"{col_prefix}_mean"].round(2).tolist(),
        "total": range_df[f"{col_prefix}_tot"].round(2).tolist(),
        "std": range_df[f"{col_prefix}_std"].round(2).tolist(),
    }

@features_bp.route("/range/<date>/<days>/insights/cpu", methods=["GET"])
def cpu_insights(date, days):
    """Return raw CPU stats (mean, total, std) for all dates in range."""
    range_df = get_range_data(date, days)
    if range_df is None or range_df.empty:
        return jsonify({"error": f"No CPU data for range starting {date} with {days} days"}), 404
    return jsonify(format_range_response(range_df, "cpu"))


@features_bp.route("/range/<date>/<days>/insights/storage", methods=["GET"])
def storage_insights(date, days):
    """Return raw Storage stats (mean, total, std) for all dates in range."""
    range_df = get_range_data(date, days)
    if range_df is None or range_df.empty:
        return jsonify({"error": f"No Storage data for range starting {date} with {days} days"}), 404
    return jsonify(format_range_response(range_df, "storage"))


@features_bp.route("/range/<date>/<days>/insights/users", methods=["GET"])
def users_insights(date, days):
    """Return raw Users stats (mean, total, std) for all dates in range."""
    range_df = get_range_data(date, days)
    if range_df is None or range_df.empty:
        return jsonify({"error": f"No Users data for range starting {date} with {days} days"}), 404
    return jsonify(format_range_response(range_df, "users"))