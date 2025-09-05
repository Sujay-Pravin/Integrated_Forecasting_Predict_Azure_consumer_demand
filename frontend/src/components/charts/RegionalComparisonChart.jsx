import React from "react";
import { Bar } from "react-chartjs-2";

const RegionalComparisonChart = ({ data, resource }) => {
  if (!data?.length) return <div>No data available</div>;

  const isEfficiency = resource === "Efficiency";

  const labels = data.map((d) => d.region);

  let chartData;

  if (isEfficiency) {
    chartData = {
      labels,
      datasets: [
        {
          label: "Storage Efficiency Mean (%)",
          data: data.map((d) => d.storage_efficiency_mean),
          backgroundColor: "#FFBB28",
        },
        {
          label: "Storage Efficiency Max (%)",
          data: data.map((d) => d.storage_efficiency_max),
          backgroundColor: "#FF8042",
        },
        {
          label: "Storage Efficiency Std",
          data: data.map((d) => d.storage_efficiency_std),
          backgroundColor: "#0088FE",
        },
      ],
    };
  } else {
    chartData = {
      labels,
      datasets: [
        {
          label: "CPU Mean",
          data: data.map((d) => d.usage_cpu_mean),
          backgroundColor: "#00C49F",
        },
        {
          label: "Storage Mean",
          data: data.map((d) => d.usage_storage_mean),
          backgroundColor: "#0088FE",
        },
        {
          label: "Users Mean",
          data: data.map((d) => d.users_active_mean),
          backgroundColor: "#FFBB28",
        },
      ],
    };
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: function (context) {
            let value = context.raw;
            if (isEfficiency && context.dataset.label.includes("Efficiency")) {
              return `${context.dataset.label}: ${value.toFixed(2)}%`;
            }
            return `${context.dataset.label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: isEfficiency ? "Efficiency (%) / Storage" : "Usage Metrics",
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default RegionalComparisonChart;
