import React, { useState, useEffect } from "react";
import "./DataPage.css";
import { fetchData, endpoints } from "../../services/api";
import { model_metrics_endpoints, fetchData as model_metrics_fetchData } from "../../services/model_metrics_api";

const DataPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState("insights");
  const [resource, setResource] = useState("CPU");

  const loadData = async () => {
    try {
      setLoading(true);
      const api =
        dataset === "insights"
          ? endpoints.insightsRawData
          : dataset === "features" ? endpoints.featuresRawData
          : resource === "FINAL_MODELS" ? model_metrics_endpoints.all
          : resource === "CPU" ? model_metrics_endpoints.cpu_all
          : resource === "STORAGE" ? model_metrics_endpoints.storage_all
          : model_metrics_endpoints.users_all;
      const results = await fetchData(api);
      setData(results);
    } catch (error) {
      console.error("Failed to load raw data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dataset,resource]); 

  if (loading) return <div className="DataPage">Loading...</div>;
  if (!data || data.length === 0)
    return <div className="DataPage">No data available</div>;

  const headers = Object.keys(data[0]);

  return (
    <div className="DataPage">
      <div className="DataPage-header">
        <h2>Raw Data</h2>
        
        <div>
          
        <select
          value={dataset}
          onChange={(e) => setDataset(e.target.value)}
          className="view-selector"
        >
          <option value="insights">Insights</option>
          <option value="features">Features</option>
          <option value="model_metrics">Model Metrics</option>
        </select>
        {dataset === "model_metrics" && <select
          value={resource}
          onChange={(e) => setResource(e.target.value)}
          className="view-selector"
        >
          <option value="FINAL_MODELS">MODELS FINALIZED</option>
          <option value="CPU">CPU</option>
          <option value="STORAGE">STORAGE</option>
          <option value="USERS">USERS</option>
        </select>}
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {headers.map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {headers.map((key) => (
                  <td key={key}>{row[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataPage;
