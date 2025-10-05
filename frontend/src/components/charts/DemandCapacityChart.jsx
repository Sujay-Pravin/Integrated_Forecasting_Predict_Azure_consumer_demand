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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DemandVsCapacityChart = ({ summary }) => {
  if (!summary) return <div>No data available</div>;

  const chartData = {
    labels: ["Previous Capacity", "Forecasted Demand"],
    datasets: [
      {
        label: "Capacity vs Demand",
        data: [summary.previous_sum, summary.forecast_sum],
        backgroundColor: ["#FF6384", "#36A2EB"],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Predicted Demand vs Previous Capacity",
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default DemandVsCapacityChart;
