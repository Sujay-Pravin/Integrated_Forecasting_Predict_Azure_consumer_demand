import React, { useEffect, useState } from "react";
import "./Forecast.css";
import {
  model_endpoints,
  fetchData,
  BASE_METRIC_URL,
} from "../../services/model_api";
import ChartCard from "../../components/Dashboard/ChartCard";
import NextPredictedChart from "../../components/charts/NextPredictedChart";
import DemandVsCapacityChart from "../../components/charts/DemandCapacityChart";
import AdjustmentChart from "../../components/charts/AdjustmentChart ";

const Forecast = () => {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState("compute");
  const [horizon, setHorizon] = useState(7);
  const [region, setRegion] = useState(0);
  const [values, setValues] = useState({});

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        let endpointFn;
        if (resource === "compute") endpointFn = model_endpoints.forecast_cpu;
        else if (resource === "storage")
          endpointFn = model_endpoints.forecast_storage;
        else if (resource === "users")
          endpointFn = model_endpoints.forecast_users;

        const endpoint = endpointFn(region, horizon);

        const data = await fetchData(endpoint);
        setForecast(data.forecasts ?? []); 
        const summaryData = {
  previous_mean: data.previous_mean,
  previous_sum: data.previous_sum,
  forecast_mean: data.forecast_mean,
  forecast_sum: parseFloat(data.forecast_sum).toFixed(2),
  recommended_adjustment: parseFloat(data.recommended_adjustment).toFixed(2),
  percent_change:
    data.previous_sum > 0
      ? ((data.forecast_sum / data.previous_sum - 1) * 100).toFixed(2)
      : 0,
  adjustment_percent:
    data.previous_sum > 0
      ? ((data.recommended_adjustment / data.previous_sum) * 100).toFixed(2)
      : 0,
};

        setValues(summaryData);
      } catch (error) {
        console.error("Failed to load forecast data:", error);
        setForecast([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    console.log(forecast);
  }, [resource, horizon, region]);

  const handleDownload = () => {
    const down_endpoint = model_endpoints.download_forecast(
      region,
      resource,
      horizon
    );
    window.open(`${BASE_METRIC_URL}/${down_endpoint}`, "_blank");
  };

  const adjustmentPercent =
    values.previous_sum > 0
      ? ((values.recommended_adjustment / values.previous_sum) * 100).toFixed(2)
      : 0;

  let riskColor = "🟢";
  let riskLabel = "Sufficient";

  if (adjustmentPercent > 10) {
    riskColor = "🔴";
    riskLabel = "Short";
  } else if (adjustmentPercent < -10) {
    riskColor = "🟡";
    riskLabel = "Over-provisioned";
  }

  return (
    <div className="forecast-page">
      <div className="ind-model-chart-container">
        <select
          value={resource}
          onChange={(e) => setResource(e.target.value)}
          className="view-selector"
        >
          <option value="compute">Compute</option>
          <option value="storage">Storage</option>
          <option value="users">Users</option>
        </select>

        <select
          value={horizon}
          onChange={(e) => setHorizon(Number(e.target.value))}
          className="view-selector"
        >
          <option value={7}>7 Days</option>
          <option value={14}>14 Days</option>
          <option value={30}>30 Days</option>
        </select>

        <select
          value={region}
          onChange={(e) => setRegion(Number(e.target.value))}
          className="view-selector"
        >
          <option value={0}>East US</option>
          <option value={1}>North Europe</option>
          <option value={2}>Southeast Asia</option>
          <option value={3}>West US</option>
        </select>

        <button className="btn" onClick={handleDownload}>
          DOWNLOAD
        </button>
      </div>

      <div className="ind-model-chart-container">
        <div className="holiday-resource-block">
          <div className="rect-container">
            <div className="rect-triangle right">
              <h2> Insights </h2>
            </div>

            <div className="parallelogram">
              <div className="detail-nav-item">
                <h2>{values.previous_sum}</h2>
                <p className="colored-rect-text">
                  Previous {horizon} days{" "}
                  {resource === "users" ? "activity" : "usage"}
                </p>
              </div>
            </div>

            <div className="parallelogram">
              <div className="detail-nav-item">
                <h2>{values.forecast_sum}</h2>
                <p className="colored-rect-text">
                  Total forecasted {resource === "users" ? "activity" : "usage"}
                </p>
              </div>
            </div>

            {resource !== "users" && (
              <div className="parallelogram">
                <div className="detail-nav-item">
                  <h2>
                    {values.recommended_adjustment > 0 ? "+" : ""}
                    {values.recommended_adjustment}
                  </h2>
                  <p className="colored-rect-text">Recommended adjustment</p>
                </div>
              </div>
            )}

            <div
              className="rect-triangle left"
              style={{
                backgroundColor: values.percent_change < 0 ? "tomato" : "",
              }}
            >
              <div className="detail-nav-item">
                <h2>{values.percent_change}%</h2>
                <p className="colored-rect-text">
                  {values.percent_change > 0
                    ? `Increased ${resource === "users" ? "activity" : "usage"}`
                    : `Decreased ${
                        resource === "users" ? "activity" : "usage"
                      }`}
                </p>
                {resource !== "users" && (
                  <div>
                    {riskColor} - Resources are {riskLabel}
                  </div>
                )}
              </div>
            </div>
          </div>
          <br />
        </div>
      </div>

      <div className="top3-model-chart-container">
        <ChartCard title={`${resource.toUpperCase()} Forecast`}>
          {loading ? <p>Loading...</p> : <NextPredictedChart data={forecast} />}
        </ChartCard>
      </div>
      <div className="ind-model-chart-container">
        <ChartCard title={`${resource.toUpperCase()} Demand vs Capacity`}>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <DemandVsCapacityChart summary={values} />
          )}
        </ChartCard>
        <ChartCard title={`${resource.toUpperCase()} Demand vs Capacity`}>
          {loading ? <p>Loading...</p> : <AdjustmentChart summary={values} />}
        </ChartCard>
      </div>
    </div>
  );
};

export default Forecast;
