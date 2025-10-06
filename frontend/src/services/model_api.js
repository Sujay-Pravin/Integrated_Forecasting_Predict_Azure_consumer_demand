export const BASE_METRIC_URL = 'http://localhost:5000/api';

export const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${BASE_METRIC_URL}/${endpoint}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const model_endpoints = {
  march_cpu: "models/predict/march/cpu",
  march_storage: "models/predict/march/storage",
  march_users: "models/predict/march/users",
  forecast_cpu: 'models/forecast/cpu',
  forecast_storage: 'models/forecast/storage',
  forecast_users: 'models/forecast/users',
  model_monitoring: 'models/monitoring',

  forecast_cpu: (region, horizon = 30) =>
    `models/forecast?region=${region}&service=compute&horizon=${horizon}`,

  forecast_storage: (region, horizon = 30) =>
    `models/forecast?region=${region}&service=storage&horizon=${horizon}`,

  forecast_users: (region, horizon = 30) =>
    `models/forecast?region=${region}&service=users&horizon=${horizon}`,

  download_forecast: (region, service, horizon = 30) =>
    `models/forecast/download?region=${region}&service=${service}&horizon=${horizon}`,
};
