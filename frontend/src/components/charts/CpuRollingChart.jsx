import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const CpuRollingChart = ({ data }) => {
  if (!data || !data.dates?.length) return <div>No data available</div>;

  const chartData = {
    labels: data.dates, 
    datasets: [
      {
        label: "CPU Mean",
        data: data.values,
        borderColor: "#00C49F",
        backgroundColor: "#00C49F",
        fill: false,
        tension: 0.3,
      },
      {
        label: "Rolling Average",
        data: data.rolling_avg,
        borderColor: "#8884d8",
        backgroundColor: "#8884d8",
        fill: false,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#333" },
      },
      title: {
        display: true,
        text: "CPU Usage vs Rolling Average",
        color: "#333",
        font: {
          size: 16,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#555" },
        grid: { color: "rgba(0,0,0,0.1)" },
      },
      y: {
        ticks: { color: "#555" },
        grid: { color: "rgba(0,0,0,0.1)" },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default CpuRollingChart;
