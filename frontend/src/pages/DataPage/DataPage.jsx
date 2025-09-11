import React, { useState, useEffect } from "react";
import "./DataPage.css";
import { fetchData, endpoints } from "../../services/api";

const DataPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState("insights");

  const loadData = async () => {
    try {
      setLoading(true);
      const api =
        dataset === "insights"
          ? endpoints.insightsRawData
          : endpoints.featuresRawData;
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
  }, [dataset]); 

  if (loading) return <div className="DataPage">Loading...</div>;
  if (!data || data.length === 0)
    return <div className="DataPage">No data available</div>;

  const headers = Object.keys(data[0]);

  return (
    <div className="DataPage">
      <div className="DataPage-header">
        <h2>Raw Data</h2>
        <select
          value={dataset}
          onChange={(e) => setDataset(e.target.value)}
          className="view-selector"
        >
          <option value="insights">Insights</option>
          <option value="features">Features</option>
        </select>
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
