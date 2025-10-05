import React from "react";
import "./AdjustmentChart.css"; 

const AdjustmentChart = ({ summary }) => {
  if (!summary) return <div>No data available</div>;

  const adjustmentPercent = parseFloat(summary.adjustment_percent || 0);

  let barColor = "#4CAF50"; 
  if (adjustmentPercent > 10) barColor = "#FF6384"; 
  else if (adjustmentPercent < -10) barColor = "#FFC107"; 

  return (
    <div className="kpi-container">
      <h3 className="kpi-title">Adjustment KPI</h3>

      <div className="kpi-bar-background">
        <div
          className="kpi-bar-fill"
          style={{
            width: `${Math.min(Math.abs(adjustmentPercent), 100)}%`,
            background: `linear-gradient(90deg, ${barColor} 0%, ${barColor}80 100%)`,
          }}
        >
          <span className="kpi-value">{adjustmentPercent}%</span>
        </div>
      </div>

      <div className="kpi-details">
        <div className="kpi-detail">
          <span>Previous Sum:</span> {summary.previous_sum}
        </div>
        <div className="kpi-detail">
          <span>Forecast Sum:</span> {summary.forecast_sum}
        </div>
        <div className="kpi-detail">
          <span>Adjustment:</span> {summary.recommended_adjustment}
        </div>
      </div>
    </div>
  );
};

export default AdjustmentChart;
