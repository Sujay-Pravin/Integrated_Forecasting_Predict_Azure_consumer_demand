import os
import pandas as pd
from flask import Blueprint, jsonify, request
import joblib
from datetime import timedelta, datetime
import numpy as np
import requests
from flask import request, jsonify
import pickle
from sklearn.base import clone
from sklearn.metrics import mean_absolute_error, mean_squared_error
import shutil

model_bp = Blueprint("models", __name__)

# ---------- Load dataset ----------
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
file_path_cpu = os.path.join(BASE_DIR, "Data", "models", "enhanced_features.csv")

model_cpu_path = os.path.join(BASE_DIR, "backend", "models","backtested_models", "usage_cpu_best_model.pkl")
model_storage_path = os.path.join(BASE_DIR, "backend", "models", "backtested_models", "usage_storage_best_model.pkl")
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

LAST_TRAINING_DATES = {
    "usage_cpu": datetime(2023, 5, 30),     # Models were trained with data up to March 30
    "usage_storage": datetime(2023, 5, 30),  # Setting last training to May 30 as discussed  
    "users_active": datetime(2023, 5, 30)
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



@model_bp.route("/monitoring", methods=["GET"])
def monitoring():
    try:
        metrics_csv_path = os.path.join(BASE_DIR, "Model", "results", "top_models_summary.csv")

        if os.path.exists(metrics_csv_path):
            df_metrics = pd.read_csv(metrics_csv_path)

        df_metrics = df_metrics.dropna(subset=["Target", "Best_Model"], how="any")
        df_metrics = df_metrics[df_metrics["Target"].notnull() & (df_metrics["Target"] != "")]
        df_metrics = df_metrics.reset_index(drop=True)

        num_cols = [
            "Val_MAE", "Val_RMSE", "Val_MAPE", "Val_Bias",
            "Test_MAE", "Test_RMSE", "Test_MAPE", "Test_Bias"
        ]
        for c in num_cols:
            if c in df_metrics.columns:
                df_metrics[c] = pd.to_numeric(df_metrics[c], errors="coerce")

        monitoring = {}

        for _, row in df_metrics.iterrows():
            target = str(row["Target"]).strip()
            model_name = str(row["Best_Model"]).strip()

            val_mape = row.get("Val_MAPE")
            test_mape = row.get("Test_MAPE")

            val_mape = float(val_mape) if pd.notnull(val_mape) else None
            test_mape = float(test_mape) if pd.notnull(test_mape) else None

            baseline_accuracy = round(100.0 - val_mape, 3) if val_mape is not None else None
            current_accuracy = round(100.0 - test_mape, 3) if test_mape is not None else None
            error_drift = None
            if baseline_accuracy is not None and current_accuracy is not None:
                error_drift = round(baseline_accuracy - current_accuracy, 3)

            monitoring[target] = {
                "model_name": model_name,
                "validation": {
                    "MAE": float(row["Val_MAE"]) if pd.notnull(row["Val_MAE"]) else None,
                    "RMSE": float(row["Val_RMSE"]) if pd.notnull(row["Val_RMSE"]) else None,
                    "MAPE": val_mape,
                    "Bias": float(row["Val_Bias"]) if pd.notnull(row["Val_Bias"]) else None,
                },
                "test": {
                    "MAE": float(row["Test_MAE"]) if pd.notnull(row["Test_MAE"]) else None,
                    "RMSE": float(row["Test_RMSE"]) if pd.notnull(row["Test_RMSE"]) else None,
                    "MAPE": test_mape,
                    "Bias": float(row["Test_Bias"]) if pd.notnull(row["Test_Bias"]) else None,
                },
                "baseline_accuracy": baseline_accuracy,
                "current_accuracy": current_accuracy,
                "error_drift": error_drift,
            }

        try:
            data_mtime = os.path.getmtime(file_path_cpu)
            last_data_date = datetime.fromtimestamp(data_mtime).isoformat()
            days_since_last = (datetime.now() - datetime.fromtimestamp(data_mtime)).days
        except Exception:
            last_data_date = None
            days_since_last = None

        response = {
            "models": monitoring
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def mean_absolute_percentage_error(y_true, y_pred):
    """Helper function for MAPE calculation"""
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    return np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1e-8))) * 100

retrained_model_path = os.path.join(BASE_DIR, "backend", "models", "retrained_models")
retrained_results_path = os.path.join(BASE_DIR, "Model", "retrained_results")
retrained_csv_path = os.path.join(BASE_DIR, "Model", "retrained_results", "csv")

os.makedirs(retrained_model_path, exist_ok=True) 
os.makedirs(retrained_results_path, exist_ok=True)
os.makedirs(retrained_csv_path, exist_ok=True)

def save_retrain_results_csv(retrain_results, timestamp):
    """Save retrain results to CSV"""
    results_list = []
    for target, data in retrain_results.items():
        metrics = data["metrics"]
        results_list.append({
            "target": target,
            "service": data["service"],
            "retrain_date": data["retrain_date"],
            "model_path": data["model_path"],
            "MAE": metrics["MAE"],
            "RMSE": metrics["RMSE"],
            "MAPE": metrics["MAPE"],
            "Bias": metrics["Bias"]
        })
    
    df = pd.DataFrame(results_list)
    csv_filename = f"retrain_results.csv"
    csv_path = os.path.join(retrained_csv_path, csv_filename)
    df.to_csv(csv_path, index=False)
    return csv_path

def retrain_model(model, target_col, df, test_size=0.2):
    try:
        df = df.copy()
        df["date"] = pd.to_datetime(df["date"])
        
        df = df.sort_values("date")
        split_idx = int(len(df) * (1 - test_size))
        train_df = df.iloc[:split_idx]
        test_df = df.iloc[split_idx:]
        
        feature_cols = [col for col in df.columns if col not in ["date", "usage_cpu", "usage_storage", "users_active", "unique_id"]]
        
        X_train = train_df[feature_cols].fillna(0)
        y_train = train_df[target_col].fillna(train_df[target_col].mean())
        
        X_test = test_df[feature_cols].fillna(0)
        y_test = test_df[target_col].fillna(test_df[target_col].mean())
        
        new_model = clone(model)
        new_model.fit(X_train, y_train)
        
        test_pred = new_model.predict(X_test)
        
        metrics = {
            "MAE": mean_absolute_error(y_test, test_pred),
            "RMSE": np.sqrt(mean_squared_error(y_test, test_pred)),
            "MAPE": mean_absolute_percentage_error(y_test, test_pred),
            "Bias": np.mean(test_pred - y_test)
        }
        
        return new_model, metrics
    except Exception as e:
        print(f"Error in retrain_model: {str(e)}")
        raise

@model_bp.route("/retrain", methods=["POST"])
def retrain_models():
    try:
        # cleanup_retrain_folders()
        
        current_date = datetime.now()
        last_data_date = pd.to_datetime(encoded_insights["date"]).max()
        force = request.args.get('force', 'false').lower() == 'true'
        
        response = {
            "last_data_date": last_data_date.strftime("%Y-%m-%d"),
            "models_status": []
        }
        
        retrain_results = {}
        
        for service, config in SERVICE_MAP.items():
            target = config["target"]
            last_trained = LAST_TRAINING_DATES.get(target)
            
            if last_trained:
                days_since_data = (last_data_date - last_trained).days
                model_needs_retrain = days_since_data > 30 and last_data_date > last_trained
            else:
                model_needs_retrain = True
                
            if not force and not model_needs_retrain:
                response["models_status"].append({
                    "service": service,
                    "target": target,
                    "message": f"Model is current (last trained: {last_trained.strftime('%Y-%m-%d')}, last data: {last_data_date.strftime('%Y-%m-%d')})",
                    "needs_retrain": False
                })
                continue

            try:
                model = config["model"]
                new_model, metrics = retrain_model(model, target, encoded_insights)
                
                timestamp = current_date.strftime("%Y%m%d_%H%M%S")
                model_filename = f"{target}_retrained_model.pkl"
                model_path = os.path.join(retrained_model_path, model_filename)
                joblib.dump(new_model, model_path)
                
                LAST_TRAINING_DATES[target] = current_date
                
                retrain_results[target] = {
                    "service": service,
                    "metrics": metrics,
                    "model_path": model_path,
                    "retrain_date": timestamp
                }
                
                response["models_status"].append({
                    "service": service,
                    "target": target,
                    "message": "Model retrained successfully",
                    "metrics": metrics,
                    "model_file": model_filename,
                    "needs_retrain": False
                })
            except Exception as e:
                response["models_status"].append({
                    "service": service,
                    "target": target,
                    "error": str(e),
                    "needs_retrain": True
                })
        
        if retrain_results:
            timestamp = current_date.strftime("%Y%m%d_%H%M%S")
            results_filename = f"retrain_results.pkl"
            results_path = os.path.join(retrained_results_path, results_filename)
            with open(results_path, 'wb') as f:
                pickle.dump(retrain_results, f)
            
            csv_path = save_retrain_results_csv(retrain_results, timestamp)
            
            response["results_saved"] = {
                "pickle": results_path,
                "csv": csv_path
            }

        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@model_bp.route("/retrain/status", methods=["GET"])
def check_retrain_status():
    try:
        current_date = datetime.now()
        last_data_date = pd.to_datetime(encoded_insights["date"]).max()
        
        status = []
        for service, config in SERVICE_MAP.items():
            target = config["target"]
            last_trained = LAST_TRAINING_DATES.get(target)
            
            if last_trained:
                # Compare with last data date instead of current date
                days_since_data = (last_data_date - last_trained).days
                needs_retrain = days_since_data > 30 and last_data_date > last_trained
            else:
                needs_retrain = True
            
            status.append({
                "service": service,
                "target": target,
                "last_trained_date": last_trained.strftime("%Y-%m-%d") if last_trained else None,
                "last_data_date": last_data_date.strftime("%Y-%m-%d"),
                "days_since_new_data": days_since_data if last_trained else None,
                "needs_retrain": needs_retrain,
                "retrain_reason": "Up to date with current data" if not needs_retrain else 
                                "New data available" if last_data_date > last_trained else
                                "Never trained"
            })
        
        return jsonify({
            "last_data_date": last_data_date.strftime("%Y-%m-%d"),
            "models_status": status
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@model_bp.route("/retrain/compare", methods=["GET"])
def compare_models():
    try:
        retrain_files = sorted(os.listdir(retrained_results_path))
        if not retrain_files:
            return jsonify({"error": "No retrained models found"}), 404
            
        latest_retrain_file = os.path.join(retrained_results_path, retrain_files[-1])
        with open(latest_retrain_file, 'rb') as f:
            retrain_results = pickle.load(f)
            
        metrics_csv_path = os.path.join(BASE_DIR, "Model", "results", "top_models_summary.csv")
        if not os.path.exists(metrics_csv_path):
            return jsonify({"error": "Original model metrics not found"}), 404
            
        df_metrics = pd.read_csv(metrics_csv_path)
        
        comparison = []
        for target, results in retrain_results.items():
            original = df_metrics[df_metrics["Target"] == target].iloc[0]
            retrained = results["metrics"]
            
            better_mae = float(retrained["MAE"]) < float(original["Test_MAE"])
            better_rmse = float(retrained["RMSE"]) < float(original["Test_RMSE"])
            better_mape = float(retrained["MAPE"]) < float(original["Test_MAPE"])
            
            is_better = {
                "MAE": "improved" if better_mae else "not improved",
                "RMSE": "improved" if better_rmse else "not improved",
                "MAPE": "improved" if better_mape else "not improved"
            }
            
            improvements_count = sum([better_mae, better_rmse, better_mape])
            is_better["Overall"] = "improved" if improvements_count > 1 else "not improved"
            
            comparison.append({
                "target": target,
                "service": results["service"],
                "original_metrics": {
                    "MAE": float(original["Test_MAE"]),
                    "RMSE": float(original["Test_RMSE"]),
                    "MAPE": float(original["Test_MAPE"])
                },
                "retrained_metrics": {
                    "MAE": float(retrained["MAE"]),
                    "RMSE": float(retrained["RMSE"]),
                    "MAPE": float(retrained["MAPE"])
                },
                "improvements": is_better,
                "improvement_summary": {
                    "metrics_improved": improvements_count,
                    "total_metrics": 3,
                    "percent_improved": round((improvements_count / 3) * 100, 2)
                },
                "retrained_model_path": results["model_path"],
                "retrain_date": results["retrain_date"]
            })
            
        return jsonify({
            "comparisons": comparison,
            "retrain_results_file": latest_retrain_file
        })
        
    except Exception as e:
        print(f"Error in compare_models: {str(e)}")  
        return jsonify({"error": str(e)}), 500

@model_bp.route("/retrain/switch", methods=["POST"])
def switch_models():
    try:
        force = request.args.get('force', 'false').lower() == 'true'
        
        try:
            retrain_files = sorted(os.listdir(retrained_results_path))
            if not retrain_files:
                return jsonify({"error": "No retrained models found"}), 404

            latest_retrain_file = os.path.join(retrained_results_path, retrain_files[-1])
            with open(latest_retrain_file, 'rb') as f:
                retrain_results = pickle.load(f)

            metrics_csv_path = os.path.join(BASE_DIR, "Model", "results", "top_models_summary.csv")
            if not os.path.exists(metrics_csv_path):
                return jsonify({"error": "Original model metrics not found"}), 404

            df_metrics = pd.read_csv(metrics_csv_path)
            switched_models = []

            for target, results in retrain_results.items():
                original = df_metrics[df_metrics["Target"] == target].iloc[0]
                retrained = results["metrics"]

                better_mae = float(retrained["MAE"]) < float(original["Test_MAE"])
                better_rmse = float(retrained["RMSE"]) < float(original["Test_RMSE"])
                better_mape = float(retrained["MAPE"]) < float(original["Test_MAPE"])
                improvements_count = sum([better_mae, better_rmse, better_mape])
                
                if force or improvements_count > 1:
                    service = results["service"]
                    
                    # Backup original model
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    backup_dir = os.path.join(BASE_DIR, "backend", "models", "backup_models", timestamp)
                    os.makedirs(backup_dir, exist_ok=True)

                    # Get original model path
                    original_model_path = None
                    for svc, config in SERVICE_MAP.items():
                        if config["target"] == target:
                            original_model_path = os.path.join(BASE_DIR, "backend", "models", "backtested_models", f"{target}_best_model.pkl")
                            break

                    if original_model_path and os.path.exists(original_model_path):
                        # Backup original
                        backup_path = os.path.join(backup_dir, os.path.basename(original_model_path))
                        shutil.copy2(original_model_path, backup_path)  # Use copy2 instead of rename

                        # Move retrained to original location
                        retrained_path = results["model_path"]
                        if os.path.exists(retrained_path):
                            shutil.copy2(retrained_path, original_model_path)

                            # Update SERVICE_MAP model
                            new_model = joblib.load(original_model_path)
                            for svc, config in SERVICE_MAP.items():
                                if config["target"] == target:
                                    config["model"] = new_model
                                    break

                            switched_models.append({
                                "target": target,
                                "service": service,
                                "backup_path": backup_path,
                                "new_model_path": original_model_path,
                                "improvements": {
                                    "MAE": float(original["Test_MAE"]) - float(retrained["MAE"]),
                                    "RMSE": float(original["Test_RMSE"]) - float(retrained["RMSE"]),
                                    "MAPE": float(original["Test_MAPE"]) - float(retrained["MAPE"])
                                }
                            })

            if switched_models:
                return jsonify({
                    "message": "Models switched successfully",
                    "switched_models": switched_models
                })
            else:
                return jsonify({
                    "message": "No models were switched - retrained models did not show improvement"
                })

        except Exception as e:
            print(f"Error during model switching: {str(e)}")
            return jsonify({"error": f"Model switching failed: {str(e)}"}), 500

    except Exception as e:
        print(f"Error in switch_models: {str(e)}")
        return jsonify({"error": str(e)}), 500

def cleanup_retrain_folders():
    """Clean up retrain folders while ensuring they exist"""
    folders = [
        retrained_model_path,
        retrained_results_path,
        retrained_csv_path
    ]
    
    for folder in folders:
        try:
            os.makedirs(folder, exist_ok=True)
            
            for filename in os.listdir(folder):
                file_path = os.path.join(folder, filename)
                try:
                    if os.path.isfile(file_path):
                        os.unlink(file_path)
                except Exception as e:
                    print(f'Failed to delete {file_path}. Reason: {e}')
                    
        except Exception as e:
            print(f'Error handling folder {folder}: {e}')
