const BASE_METRIC_URL = 'http://localhost:5000/api';

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

export const model_metrics_endpoints = {
  all: "model_metrics/all/top",
  cpu: "model_metrics/usage_cpu",
  cpu_all: "model_metrics/usage_cpu/all",
  cpu_top3: "model_metrics/usage_cpu/top3",
  storage: "model_metrics/usage_storage",
  storage_all: "model_metrics/usage_storage/all",
  storage_top3: "model_metrics/usage_storage/top3",
  users: "model_metrics/users_active",
  users_all: "model_metrics/users_active/all",
  users_top3: "model_metrics/users_active/top3",
};
