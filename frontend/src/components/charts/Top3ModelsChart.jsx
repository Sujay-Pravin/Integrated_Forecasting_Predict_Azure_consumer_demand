import React from "react";
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

const Top3ModelsChart = ({ data }) => {
  if (!data?.length) return <div>No data available</div>;

  const normalizedData = data.map((d) => ({
    model: d.Model,
    mae: d.Val_MAE,
    rmse: d.Val_RMSE,
    mape: d.Val_MAPE,
    bias: d.Val_Bias,
  }));

  const labels = normalizedData.map((d) => d.model);

  const metrics = ["mae", "rmse", "mape", "bias"];
  const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const chartData = {
    labels,
    datasets: metrics.map((metric, index) => ({
      label: metric.toUpperCase(),
      data: normalizedData.map((d) => d[metric]),
      backgroundColor: colors[index],
    })),
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label;
            let value = context.raw;
            if (label === "MAPE") value = (value * 100).toFixed(2) + "%";
            return `${label}: ${value}`;
          },
        },
      },
      title: {
        display: true,
        text: "Top 3 Model Metrics",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Metric Value",
        },
      },
    },
  };

  return (
    <div style={{ width: "700px", height: "400px", margin: "0 auto" }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default Top3ModelsChart;
