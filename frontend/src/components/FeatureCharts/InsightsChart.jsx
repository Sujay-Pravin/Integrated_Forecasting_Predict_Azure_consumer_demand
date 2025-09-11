// src/components/InsightsChart.jsx
import React from "react";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
);

const InsightsChart = ({ insights, resource = "CPU", holidays }) => {
  if (!insights || !insights.dates || !insights.dates.length) {
    return <p>No insights data available</p>;
  }

  const { dates, mean = [], total = [], std = [] } = insights;

  // Case 1: only one data point → display detail view instead of chart
  if (dates.length === 1) {
    return (
      <div className="insights-single-point">
        <h3>{resource} Insights</h3>
        <div className="detail-nav">
          <div className="detail-nav-item">
            <h4>{dates[0]}</h4>
            <p className="colored-nav-text">Date</p>
          </div>
          <div className="detail-nav-item">
            <h4>{mean[0]}</h4>
            <p className="colored-nav-text">Mean</p>
          </div>
          <div className="detail-nav-item">
            <h4>{total[0]}</h4>
            <p className="colored-nav-text">Total</p>
          </div>
          <div className="detail-nav-item">
            <h4>{std[0]}</h4>
            <p className="colored-nav-text">Std</p>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to format dates consistently
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toDateString();
  };

  // Convert holiday dates to the same format as insights dates for comparison
  const holidayDatesFormatted = holidays ? holidays.map(formatDate) : [];

  // Create holiday marker data - only show points on holiday dates
  const createHolidayData = (dataArray) => {
    return dates.map((date, index) => {
      const formattedDate = formatDate(date);
      return holidayDatesFormatted.includes(formattedDate) ? dataArray[index] : null;
    });
  };

  // Case 2: normal chart with 2+ points
  const chartData = {
  labels: dates,
  datasets: [
    {
      label: `${resource} Mean`,
      data: mean,
      borderColor: "rgba(75, 192, 192, 1)",
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      tension: 0.2,
      pointRadius: dates.map(d => holidayDatesFormatted.includes(formatDate(d)) ? 8 : 4),
      pointBorderWidth: dates.map(d => holidayDatesFormatted.includes(formatDate(d)) ? 3 : 1),
      pointBorderColor: dates.map(d => holidayDatesFormatted.includes(formatDate(d)) ? "red" : "rgba(75, 192, 192, 1)"),
      pointBackgroundColor: dates.map(d => holidayDatesFormatted.includes(formatDate(d)) ? "transparent" : "rgba(75, 192, 192, 0.2)"),
    },
    {
      label: `${resource} Total`,
      data: total,
      borderColor: "rgba(153, 102, 255, 1)",
      backgroundColor: "rgba(153, 102, 255, 0.2)",
      tension: 0.2,
      pointRadius: dates.map(d => holidayDatesFormatted.includes(formatDate(d)) ? 8 : 4),
      pointBorderWidth: dates.map(d => holidayDatesFormatted.includes(formatDate(d)) ? 3 : 1),
      pointBorderColor: dates.map(d => holidayDatesFormatted.includes(formatDate(d)) ? "red" : "rgba(153, 102, 255, 1)"),
      pointBackgroundColor: dates.map(d => holidayDatesFormatted.includes(formatDate(d)) ? "transparent" : "rgba(153, 102, 255, 0.2)"),
    },
    {
      label: `${resource} Std`,
      data: std,
      borderColor: "rgba(255, 159, 64, 1)",
      backgroundColor: "rgba(255, 159, 64, 0.2)",
      borderDash: [5,5],
      tension: 0.2,
      pointRadius: dates.map(d => holidayDatesFormatted.includes(formatDate(d)) ? 8 : 4),
      pointBorderWidth: dates.map(d => holidayDatesFormatted.includes(formatDate(d)) ? 3 : 1),
      pointBorderColor: dates.map(d => holidayDatesFormatted.includes(formatDate(d)) ? "red" : "rgba(255, 159, 64, 1)"),
      pointBackgroundColor: dates.map(d => holidayDatesFormatted.includes(formatDate(d)) ? "transparent" : "rgba(255, 159, 64, 0.2)"),
    }
  ]
};


  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `${resource} Insights`,
        font: { size: 18 },
      },
      legend: { 
        position: "top",
        labels: {
          filter: function(legendItem, chartData) {
            // Hide holiday datasets from legend to avoid clutter
            return !legendItem.text.startsWith('Holiday');
          }
        }
      },
    },
    scales: {
      y: { title: { display: true, text: `${resource} Values` } },
      x: { title: { display: true, text: "Date" } },
    },
  };

  return (
    <div className="insights-chart-container">
      <Line data={chartData} options={options} />
      {holidays && holidays.length > 0 && (
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Red circles indicate holiday dates
        </p>
      )}
    </div>
  );
};

export default InsightsChart;