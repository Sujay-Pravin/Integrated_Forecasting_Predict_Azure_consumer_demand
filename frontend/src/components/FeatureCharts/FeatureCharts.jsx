import React, { useState } from "react";
import "./FeatureCharts.css";
import SingleDay from "./SingleDay";
import DateRange from "./DateRange";



const FeatureCharts = ({ data, dateType }) => {
  const [activeFeature, setActiveFeature] = useState("CPU");

  if (!data || Object.keys(data).length === 0) return <p>No data available</p>;


  return (
    <div className="feature-charts">
      {dateType === "date" && (
        <SingleDay data={data} activeFeature={activeFeature} setActiveFeature={setActiveFeature} />
      )}
      {(dateType === "week" || dateType === "custom") && (
        <DateRange data={data} activeFeature={activeFeature} setActiveFeature={setActiveFeature}/>
      )}
      
    </div>
  );
};

export default FeatureCharts;
