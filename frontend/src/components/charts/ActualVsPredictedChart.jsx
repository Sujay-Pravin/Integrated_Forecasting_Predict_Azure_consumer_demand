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
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ActualVsPredictedChart = ({ data }) => {
  if (!data?.length) return <div>No data available</div>;

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Actual',
        data: data.map(d => d.actual),
        borderColor: '#00C49F',
        fill: false,
        tension: 0.2
      },
      {
        label: 'Predicted',
        data: data.map(d => d.predicted),
        borderColor: '#FF5733',
        fill: false,
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
        text: 'Actual vs Predicted Values'
      }
    }
  };

  return <Line data={chartData} options={options} />;
};

export default ActualVsPredictedChart;
