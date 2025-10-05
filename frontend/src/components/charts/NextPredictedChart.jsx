import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const NextPredictedChart = ({ data }) => {
  if (!data?.length) return <div>No data available</div>;

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Upper 95%',
        data: data.map(d => d.upper_95),
        borderColor: 'rgba(255,99,132,1)',
        backgroundColor: 'rgba(255,99,132,0.1)',
        fill: '-1', 
        tension: 0.2
      },
      {
        label: 'Predicted',
        data: data.map(d => d.predicted),
        borderColor: '#0088FE',
        backgroundColor: 'rgba(0,136,254,0.2)',
        fill: '+1', 
        tension: 0.2
      },
      {
        label: 'Lower 95%',
        data: data.map(d => d.lower_95),
        borderColor: 'rgba(0,200,0,1)',
        backgroundColor: 'rgba(0,200,0,0.1)',
        fill: '-1', 
        tension: 0.2
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Predicted Values with 95% Confidence Interval'
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return <Line data={chartData} options={options} />;
};

export default NextPredictedChart;
