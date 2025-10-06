import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const MonitoringChart = ({ modelName, baselineAccuracy, currentAccuracy, errorDrift }) => {
  const data = {
    labels: ["Baseline Accuracy", "Current Accuracy", "Error Drift"],
    datasets: [
      {
        data: [
          baselineAccuracy ?? 0,
          currentAccuracy ?? 0,
          Math.abs(errorDrift) ?? 0,
        ],
        backgroundColor: ["#36A2EB", "#FFCE56", errorDrift >= 0 ? "#FF6384" : "#4CAF50"],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            const value = data.datasets[0].data[tooltipItem.dataIndex];
            return `${data.labels[tooltipItem.dataIndex]}: ${value.toFixed(2)}%`;
          },
        },
      },
      title: {
        display: true,
        text: `Monitoring Metrics: ${modelName}`,
      },
    },
  };

  return <Doughnut data={data} options={options} />;
};

export default MonitoringChart;
