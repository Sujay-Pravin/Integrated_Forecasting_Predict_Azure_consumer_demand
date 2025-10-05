import React, { useState, useEffect } from "react";
import { fetchData, endpoints } from "../../services/api";
import ChartCard from "./ChartCard";

import UsageTrendsChart from "../charts/UsageTrendsChart";
import TopRegionsChart from "../charts/TopRegionsChart";
import PeakDemandChart from "../charts/PeakDemandChart";
import RegionalComparisonChart from "../charts/RegionalComparisonChart";
import MonthlyTrendsChart from "../charts/MonthlyTrendsChart";
import HolidayImpactChart from "../charts/HolidayImpactChart";
import InsightsSummaryChart from "../charts/InsightsSummaryChart";

import CpuRollingChart from "../charts/CpuRollingChart"; // import your new rolling chart

import "./DashboardLayout.css";
import { feature_endpoints, fetchData as feature_fetchData } from "../../services/feature_api";

const viewApiMap = {
  overview: [
    endpoints.usageTrends,
    endpoints.insights,
    endpoints.topRegions,
    endpoints.peakDemand,
    endpoints.peakDemandStorage,
    endpoints.topRegionsStorage,
    endpoints.insightsStorage,
    endpoints.usageTrendsStorage,
    endpoints.peakEfficiency,
    endpoints.topRegionsEfficiency,
    (window) => feature_endpoints.cpuRoll(window),
    (window) => feature_endpoints.storageRoll(window),
    (window) => feature_endpoints.usersRoll(window),
  ],
  resources: [
    endpoints.monthlyTrends,
    endpoints.holidayImpact,
    endpoints.holidayEfficiencyImpact,
  ],
  regions: [
    endpoints.regionalComparison,
    endpoints.topRegions,
    endpoints.topRegionsStorage,
    endpoints.regionalComparisonEfficiency,
    endpoints.topRegionsEfficiency,
  ],
};

const DashboardLayout = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("overview");
  const [activeResource, setActiveResource] = useState("CPU");
  const [rollingWindow, setRollingWindow] = useState(7);
  const [locked, setLocked] = useState(true);

  const loadData = async (view) => {
    try {
      setLoading(true);
      const apis = viewApiMap[view];

      const results = await Promise.all(
        apis.map((api) =>
          typeof api === "function" ? feature_fetchData(api(rollingWindow)) : fetchData(api)
        )
      );

      const payload = {};
      apis.forEach((api, i) => {
        let key;
        if (typeof api === "function") {
          if (api.toString().includes("cpuRoll")) key = "cpuRoll";
          else if (api.toString().includes("storageRoll")) key = "storageRoll";
          else if (api.toString().includes("usersRoll")) key = "usersRoll";
        } else {
          key = Object.keys(endpoints).find((k) => endpoints[k] === api);
        }
        payload[key] = results[i];
      });

      setData(payload);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeView);
  }, [activeView, locked]); 

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header-container">
        <div className="dashboard-header">
          <select
            value={activeView}
            onChange={(e) => setActiveView(e.target.value)}
            className="view-selector"
          >
            <option value="overview">Overview</option>
            <option value="resources">Resources</option>
            <option value="regions">Regions</option>
          </select>
        </div>

        {activeView === "overview" && (
          <>
            <div className="dashboard-header">
              <select
                value={activeResource}
                onChange={(e) => setActiveResource(e.target.value)}
                className="view-selector"
              >
                <option value="CPU">CPU</option>
                <option value="Storage">Storage</option>
              </select>
            </div>

            <div className="dashboard-header rolling-control">
              <input
                type="text"
                value={rollingWindow}
                disabled={locked}
                onChange={(e) => setRollingWindow(Number(e.target.value))}
                className="rolling-input"
              />
              <button
                onClick={() => setLocked(!locked)}
                className="lock-btn"
                style={{
                borderColor: locked ? "var(--accent-color)" : "tomato", 
              }}
              >
                {!locked ? "🔒 Lock" : "🔓 Unlock"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Overview - CPU */}
      {activeView === "overview" && activeResource === "CPU" && (
        <div className="dashboard-grid">
          <ChartCard title="Insights Summary">
            <InsightsSummaryChart
              data={data.insights}
              resource={activeResource}
            />
          </ChartCard>

          <ChartCard title="CPU Usage Trends">
            <UsageTrendsChart
              data={data.usageTrends}
              resource={activeResource}
            />
          </ChartCard>

          <ChartCard title={`CPU Rolling (Last ${rollingWindow} Days)`}  >
            <CpuRollingChart data={data.cpuRoll} />
          </ChartCard>

          <ChartCard title={`USERS Rolling (Last ${rollingWindow} Days)`}  >
            <CpuRollingChart data={data.usersRoll} />
          </ChartCard>

          <ChartCard title="Top Regions">
            <TopRegionsChart data={data.topRegions} resource={activeResource} />
          </ChartCard>

          <ChartCard title="Peak Demand (Monthly)">
            <PeakDemandChart data={data.peakDemand} resource={activeResource} />
          </ChartCard>
        </div>
      )}

      {/* Overview - Storage */}
      {activeView === "overview" && activeResource === "Storage" && (
        <div className="dashboard-grid">
          <ChartCard title="Storage Insights Summary">
            <InsightsSummaryChart
              data={data.insightsStorage}
              resource={activeResource}
            />
          </ChartCard>

          <ChartCard title="Storage Usage Trends">
            <UsageTrendsChart
              data={data.usageTrendsStorage}
              resource={activeResource}
            />
          </ChartCard>

          <ChartCard title={`Storage Rolling (Last ${rollingWindow} Days)`}  >
            <CpuRollingChart data={data.storageRoll} />
          </ChartCard>

          <ChartCard title="Top Regions by Storage">
            <TopRegionsChart
              data={data.topRegionsStorage}
              resource={activeResource}
            />
          </ChartCard>

          <ChartCard title="Peak Demand (Monthly)">
            <PeakDemandChart
              data={data.peakDemandStorage}
              resource={activeResource}
            />
          </ChartCard>

          <ChartCard title="Peak Efficiency"  >
            <PeakDemandChart data={data.peakEfficiency} resource="Efficiency" />
          </ChartCard>

          <ChartCard title="Top Regions by Efficiency"  >
            <TopRegionsChart
              data={data.topRegionsEfficiency}
              resource="Efficiency"
            />
          </ChartCard>
        </div>
      )}
      {activeView === "resources" && (
        <div className="dashboard-grid">
          <ChartCard title="Monthly Trends">
            <MonthlyTrendsChart data={data.monthlyTrends} />
          </ChartCard>

          <ChartCard title="Holiday Impact">
            <HolidayImpactChart data={data.holidayImpact} />
          </ChartCard>

          <ChartCard title="Holiday Efficiency Impact"  >
            <HolidayImpactChart
              data={data.holidayEfficiencyImpact}
              resource="Efficiency"
            />
          </ChartCard>
        </div>
      )}

      {activeView === "regions" && (
        <div className="dashboard-grid">
          <ChartCard title="Regional Comparison">
            <RegionalComparisonChart data={data.regionalComparison} />
          </ChartCard>

          <ChartCard title="Top Regions">
            <div className="dashboard-header">
              <select
                value={activeResource}
                onChange={(e) => setActiveResource(e.target.value)}
                className="view-selector"
              >
                <option value="CPU">CPU</option>
                <option value="Storage">Storage</option>
              </select>
            </div>
            <TopRegionsChart
              data={
                activeResource === "CPU"
                  ? data.topRegions
                  : data.topRegionsStorage
              }
              resource={activeResource}
            />
          </ChartCard>

          <ChartCard title="Top Regions by Efficiency"  >
            <TopRegionsChart
              data={data.topRegionsEfficiency}
              resource="Efficiency"
            />
          </ChartCard>

          <ChartCard title="Regional Comparison Efficiency"  >
            <RegionalComparisonChart
              data={data.regionalComparisonEfficiency}
              resource="Efficiency"
            />
          </ChartCard>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
