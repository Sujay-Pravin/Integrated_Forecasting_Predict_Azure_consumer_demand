import React from "react";
import { Bar } from "react-chartjs-2";

const HolidayImpactChart = ({ data, resource }) => {
  if (!data) return <div>No data available</div>;

  const labels = Object.keys(data).map((k) =>
    k === "1" ? "Holiday" : "Working"
  );

  let chartData;

  if (resource === "Efficiency") {
    chartData = {
      labels,
      datasets: [
        {
          label: "Storage Usage",
          data: Object.values(data).map((d) => d.usage_storage),
          backgroundColor: "#0088FE",
        },
        {
          label: "Storage Efficiency",
          data: Object.values(data).map((d) => d.storage_efficiency),
          backgroundColor: "#FFBB28",
        },
      ],
    };
  } else {
    chartData = {
      labels,
      datasets: [
        {
          label: "CPU Usage",
          data: Object.values(data).map((d) => d.usage_cpu),
          backgroundColor: "#00C49F",
        },
        {
          label: "Storage Usage",
          data: Object.values(data).map((d) => d.usage_storage),
          backgroundColor: "#0088FE",
        },
        {
          label: "Users Active",
          data: Object.values(data).map((d) => d.users_active),
          backgroundColor: "#FFBB28",
        },
      ],
    };
  }

  return <Bar data={chartData} />;
};

export default HolidayImpactChart;
