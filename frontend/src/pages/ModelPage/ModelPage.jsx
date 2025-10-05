import React, { useState, useEffect } from "react";
import "./ModelPage.css";
import {
  model_metrics_endpoints,
  fetchData,
} from "../../services/model_metrics_api";
import ModelMetricsChart from "../../components/charts/ModelMetricsChart";
import ChartCard from "../../components/Dashboard/ChartCard";
import Top3ModelsChart from "../../components/charts/Top3ModelsChart.jsx";

import {
  model_endpoints,
  fetchData as fetchModelData,
} from "../../services/model_api";
import ActualVsPredictedChart from "../../components/charts/ActualVsPredictedChart.jsx";

const ModelPage = () => {
  const [topCPU, setTopCPU] = useState([]);
  const [topStorage, setTopStorage] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [top3CPU, setTop3CPU] = useState([]);
  const [top3Storage, setTop3Storage] = useState([]);
  const [top3Users, setTop3Users] = useState([]);
  const [marchCPU, setMarchCPU] = useState([]);
  const [marchStorage, setMarchStorage] = useState([]);
  const [marchUsers, setMarchUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        const cpuData = await fetchData(model_metrics_endpoints.cpu);
        const storageData = await fetchData(model_metrics_endpoints.storage);
        const usersData = await fetchData(model_metrics_endpoints.users);

        const cpuTop3 = await fetchData(model_metrics_endpoints.cpu_top3);
        const storageTop3 = await fetchData(
          model_metrics_endpoints.storage_top3
        );
        const usersTop3 = await fetchData(model_metrics_endpoints.users_top3);
        const CPUmarch = await fetchModelData(model_endpoints.march_cpu);
        const storageMarch = await fetchModelData(
          model_endpoints.march_storage
        );
        const usersMarch = await fetchModelData(model_endpoints.march_users);

        setMarchCPU(CPUmarch);
        setMarchStorage(storageMarch);
        setMarchUsers(usersMarch);
        setTopCPU(cpuData);
        setTopStorage(storageData);
        setTopUsers(usersData);

        setTop3CPU(cpuTop3);
        setTop3Storage(storageTop3);
        setTop3Users(usersTop3);
      } catch (error) {
        console.error("Failed to load model metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="model-page">
      <h1>Selected Model Metrics</h1>
      <div className="ind-model-chart-container">
        <ChartCard title="CPU Model Metrics">
          <ModelMetricsChart data={topCPU} />
        </ChartCard>

        <ChartCard title="Storage Model Metrics">
          <ModelMetricsChart data={topStorage} />
        </ChartCard>

        <ChartCard title="Users Model Metrics">
          <ModelMetricsChart data={topUsers} />
        </ChartCard>
      </div>

      <h1>Actual vs Predicted Values for March by the selected Models</h1>
      <div className="top3-model-chart-container">
        <ChartCard title="CPU Model Metrics">
          <ActualVsPredictedChart data={marchCPU} />
        </ChartCard>

        <ChartCard title="Storage Model Metrics">
          <ActualVsPredictedChart data={marchStorage} />
        </ChartCard>

        <ChartCard title="Users Model Metrics">
          <ActualVsPredictedChart data={marchUsers} />
        </ChartCard>
      </div>

      <h1>TOP 3 Models</h1>
      <div className="top3-model-chart-container">
        <ChartCard title="TOP 3 MODELS TO PREDICT CPU USAGE" scale="1">
          <Top3ModelsChart data={top3CPU} />
        </ChartCard>

        <ChartCard title="TOP 3 MODELS TO PREDICT STORAGE USAGE" scale="1">
          <Top3ModelsChart data={top3Storage} />
        </ChartCard>

        <ChartCard title="TOP 3 MODELS TO PREDICT USERS ACTIVE" scale="1">
          <Top3ModelsChart data={top3Users} />
        </ChartCard>
      </div>
    </div>
  );
};

export default ModelPage;
