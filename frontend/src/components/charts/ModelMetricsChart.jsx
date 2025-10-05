import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ModelMetricsChart = ({ data, modelName }) => {
  if (!data) return <div>No data available</div>;

  const allMetrics = ["mae", "rmse", "mape", "bias"];
  const [visibleMetrics, setVisibleMetrics] = useState([...allMetrics]);

  const toggleMetric = (metric) => {
    setVisibleMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  };

  const labels = visibleMetrics.map((m) => m.toUpperCase());

  const chartData = {
    labels,
    datasets: [
      {
        label: modelName || data.model,
        data: visibleMetrics.map((m) => data[m]),
        backgroundColor: visibleMetrics.map((m) => {
          switch (m) {
            case "mae":
              return "#0088FE";
            case "rmse":
              return "#00C49F";
            case "mape":
              return "#FFBB28";
            case "bias":
              return "#FF8042";
            default:
              return "#888888";
          }
        }),
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: `Metrics for ${modelName || data.model}` },
    },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        {allMetrics.map((metric) => (
          <label key={metric} style={{ marginRight: "10px" }}>
            <input
              type="checkbox"
              checked={visibleMetrics.includes(metric)}
              onChange={() => toggleMetric(metric)}
            />
            {metric.toUpperCase()}
          </label>
        ))}
      </div>

      <Bar data={chartData} options={options} />
    </div>
  );
};

export default ModelMetricsChart;
