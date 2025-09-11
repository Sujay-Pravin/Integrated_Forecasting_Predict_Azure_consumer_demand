import { React, useState } from "react";
import HolidayModel from "../../model/HolidayModel";
import InsightsChart from "./InsightsChart";

const DateRange = ({ data, activeFeature, setActiveFeature }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [insightResource, setInsightsResource] = useState("cpu");


  return (
    <>
      <div className="feature-charts-container">
        <div className="feature-charts-grid">
          {["CPU", "STORAGE", "USERS", "OTHERS", "HOLIDAY", "Insights"].map(
            (item) => (
              <div
                key={item}
                className={`summary-card ${
                  activeFeature === item ? "active" : ""
                }`}
                onClick={() => setActiveFeature(item)}
              >
                <span className="summary-value">{item}</span>
              </div>
            )
          )}
        </div>
        <div className="feature-main-body">
          {activeFeature ? (
            <div className="feature-details">
              {activeFeature === "CPU" && (
                <>
                  <p>CPU Features</p>
                  <div className="detail-nav">
                    <div className="detail-nav-item">
                      <h4>{data.cpu.mean}</h4>
                      <p className="colored-nav-text">Mean</p>
                    </div>
                    <div className="detail-nav-item">
                      <h4>{data.cpu.std}</h4>
                      <p className="colored-nav-text">Std. deviation</p>
                    </div>
                    <div className="detail-nav-item">
                      <h4>{data.cpu.total}</h4>
                      <p className="colored-nav-text">Total usage</p>
                    </div>
                  </div>

                  <div className="rect-container">
                    <div className="rect-triangle right">
                      <h2>CPU Max</h2>
                    </div>
                    <div className="parallelogram">
                      <div className="detail-nav-item">
                        <h2>{data.cpu.max_resource.value}</h2>
                        <p className="colored-rect-text">Max value</p>
                      </div>
                    </div>
                    <div className="parallelogram">
                      <div className="detail-nav-item">
                        <h2>{data.cpu.max_resource.resource}</h2>
                        <p className="colored-rect-text">Resource</p>
                      </div>
                    </div>
                    <div className="rect-triangle left">
                      <div className="detail-nav-item">
                        <h2>{data.cpu.max_resource.region}</h2>
                        <p className="colored-rect-text">Region</p>
                      </div>
                    </div>
                  </div>

                  <br></br>

                  <div className="rect-container">
                    <div className="rect-triangle right">
                      <h2>CPU Min</h2>
                    </div>
                    <div className="parallelogram">
                      <div className="detail-nav-item">
                        <h2>{data.cpu.min_resource.value}</h2>
                        <p className="colored-rect-text">Min value</p>
                      </div>
                    </div>
                    <div className="parallelogram">
                      <div className="detail-nav-item">
                        <h2>{data.cpu.min_resource.resource}</h2>
                        <p className="colored-rect-text">Resource</p>
                      </div>
                    </div>
                    <div className="rect-triangle left">
                      <div className="detail-nav-item">
                        <h2>{data.cpu.min_resource.region}</h2>
                        <p className="colored-rect-text">Region</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {activeFeature === "STORAGE" && (
                <>
                  <p>Storage Features</p>
                  <div className="detail-nav">
                    <div className="detail-nav-item">
                      <h4>{data.storage.mean}</h4>
                      <p className="colored-nav-text">Mean</p>
                    </div>
                    <div className="detail-nav-item">
                      <h4>{data.storage.std}</h4>
                      <p className="colored-nav-text">Std. deviation</p>
                    </div>
                    <div className="detail-nav-item">
                      <h4>{data.storage.total}</h4>
                      <p className="colored-nav-text">Total usage</p>
                    </div>
                  </div>

                  <div className="rect-container">
                    <div className="rect-triangle right">
                      <h2>Storage Max</h2>
                    </div>
                    <div className="parallelogram">
                      <div className="detail-nav-item">
                        <h2>{data.storage.max_resource.value}</h2>
                        <p className="colored-rect-text">Max value</p>
                      </div>
                    </div>
                    <div className="parallelogram">
                      <div className="detail-nav-item">
                        <h2>{data.storage.max_resource.resource}</h2>
                        <p className="colored-rect-text">Resource</p>
                      </div>
                    </div>
                    <div className="rect-triangle left">
                      <div className="detail-nav-item">
                        <h2>{data.storage.max_resource.region}</h2>
                        <p className="colored-rect-text">Region</p>
                      </div>
                    </div>
                  </div>

                  <br></br>

                  <div className="rect-container">
                    <div className="rect-triangle right">
                      <h2>Storage Min</h2>
                    </div>
                    <div className="parallelogram">
                      <div className="detail-nav-item">
                        <h2>{data.storage.min_resource.value}</h2>
                        <p className="colored-rect-text">Min value</p>
                      </div>
                    </div>
                    <div className="parallelogram">
                      <div className="detail-nav-item">
                        <h2>{data.storage.min_resource.resource}</h2>
                        <p className="colored-rect-text">Resource</p>
                      </div>
                    </div>
                    <div className="rect-triangle left">
                      <div className="detail-nav-item">
                        <h2>{data.storage.min_resource.region}</h2>
                        <p className="colored-rect-text">Region</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {activeFeature === "USERS" && (
                <>
                  <p>User Features</p>
                  <div className="detail-nav">
                    <div className="detail-nav-item">
                      <h4>{data.users.mean}</h4>
                      <p className="colored-nav-text">Avg users</p>
                    </div>
                    <div className="detail-nav-item">
                      <h4>{data.users.std}</h4>
                      <p className="colored-nav-text">Std. deviation</p>
                    </div>
                    <div className="detail-nav-item">
                      <h4>{data.users.total}</h4>
                      <p className="colored-nav-text">Total users</p>
                    </div>
                  </div>
                  <div className="rect-container">
                    <div className="rect-triangle right">
                      <h2>Max Users</h2>
                    </div>
                    <div className="parallelogram">
                      <div className="detail-nav-item">
                        <h2>{data.users.max_resource.value}</h2>
                        <p className="colored-rect-text">Max Users</p>
                      </div>
                    </div>
                    <div className="parallelogram">
                      <div className="detail-nav-item">
                        <h2>{data.users.max_resource.resource}</h2>
                        <p className="colored-rect-text">Resource</p>
                      </div>
                    </div>
                    <div className="rect-triangle left">
                      <div className="detail-nav-item">
                        <h2>{data.users.max_resource.region}</h2>
                        <p className="colored-rect-text">Region</p>
                      </div>
                    </div>
                  </div>

                  <br></br>

                  <div className="rect-container">
                    <div className="rect-triangle right">
                      <h2>Min Users</h2>
                    </div>
                    <div className="parallelogram">
                      <div className="detail-nav-item">
                        <h2>{data.users.min_resource.value}</h2>
                        <p className="colored-rect-text">Min Users</p>
                      </div>
                    </div>
                    <div className="parallelogram">
                      <div className="detail-nav-item">
                        <h2>{data.users.min_resource.resource}</h2>
                        <p className="colored-rect-text">Resource</p>
                      </div>
                    </div>
                    <div className="rect-triangle left">
                      <div className="detail-nav-item">
                        <h2>{data.users.min_resource.region}</h2>
                        <p className="colored-rect-text">Region</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {activeFeature === "OTHERS" && (
                <>
                  <p>Other Features</p>
                  <div className="detail-nav">
                    <div className="detail-nav-item">
                      <h4>{data.economy.cloud_market_demand_mean}</h4>
                      <p className="colored-nav-text">Market Demand</p>
                    </div>
                    {/* <div className="detail-nav-item">
                      <h4>{data.economy.holiday == 1 ? "Yes" : "No"}</h4>
                      <p className="colored-nav-text">Holiday</p>
                    </div> */}
                    <div className="detail-nav-item">
                      <h4>{data.economy.economic_index_mean}</h4>
                      <p className="colored-nav-text">Economic Index</p>
                    </div>
                  </div>

                  <br />

                  {/* Records summary */}
                  <div className="detail-nav">
                    <div className="detail-nav-item">
                      <h4>{data.summary.total_records}</h4>
                      <p className="colored-nav-text">Total Records</p>
                    </div>
                    <div className="detail-nav-item">
                      <h4>{data.summary.unique_regions}</h4>
                      <p className="colored-nav-text">Unique Regions</p>
                    </div>
                  </div>

                  <br />

                  {/* Resources per region */}
                  <div className="region-resource-list">
                    <h3 className="colored-nav-text">Resources per Region</h3>
                    <div className="region-list">
                      {data.summary.resources_per_region.map(
                        (dayObj, dayIdx) => (
                          <div key={dayIdx} className="day-block">
                            <h3 style={{ color: "yellow" }}>
                              Day {dayIdx + 1}
                            </h3>
                            {Object.entries(dayObj).map(
                              ([region, resources]) => (
                                <div key={region} className="region-block">
                                  <h4>{region}</h4>
                                  <ul>
                                    {resources.map((r, idx) => (
                                      <li key={idx}>{r}</li>
                                    ))}
                                  </ul>
                                </div>
                              )
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ------------------------------------------------------------------------------------------------------------------------- */}

              {activeFeature === "HOLIDAY" && (
                <>
                  <p>Holiday Features</p>

                  <div className="detail-nav">
                    <div className="detail-nav-item">
                      <h4>{data.holidays.num_holidays}</h4>
                      <p className="colored-nav-text">Num. Holidays</p>
                    </div>
                    {data.holidays.num_holidays > 0 && (
                      <div className="detail-nav-item">
                        <button
                          onClick={() => setModalOpen(true)}
                          className="open-btn"
                        >
                          Expand
                        </button>
                        <p className="colored-nav-text">Holiday Dates</p>
                      </div>
                    )}
                  </div>

                  <br />

                  {Object.entries(data.holidays.resource_utilization).map(
                    ([resource, values]) => (
                      <div key={resource} className="holiday-resource-block">
                        <div className="rect-container">
                          <div className="rect-triangle right">
                            <h2>{resource.toUpperCase()} Holiday Avg</h2>
                          </div>

                          <div className="parallelogram">
                            <div className="detail-nav-item">
                              <h2>{values.holiday_avg.toFixed(2)}</h2>
                              <p className="colored-rect-text">
                                Avg on Holidays
                              </p>
                            </div>
                          </div>

                          <div className="parallelogram">
                            <div className="detail-nav-item">
                              <h2>{values.weekday_avg.toFixed(2)}</h2>
                              <p className="colored-rect-text">
                                Avg on Weekdays
                              </p>
                            </div>
                          </div>

                          <div
                            className="rect-triangle left"
                            style={{
                              backgroundColor:
                                values.percent_change < 0 ? "tomato" : "",
                            }}
                          >
                            <div className="detail-nav-item">
                              <h2>{values.percent_change.toFixed(2)}%</h2>
                              <p className="colored-rect-text">Change (%)</p>
                            </div>
                          </div>
                        </div>
                        <br />
                      </div>
                    )
                  )}
                </>
              )}
              {activeFeature === "Insights" && (
                <>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <p>CPU Insights Overview</p>
                  <select
                    value={insightResource}
                    onChange={(e) => setInsightsResource(e.target.value)}
                    className="view-selector"
                  >
                    <option value="cpu">CPU</option>
                    <option value="users">Users</option>
                    <option value="storage">Storage</option>
                  </select>
                </div>

                  { insightResource === "cpu" && <InsightsChart insights={data.cpuInsights} resource = "CPU" holidays = {data.holidays.holiday_dates}/>}
                  { insightResource === "users" && <InsightsChart insights={data.usersInsights} resource = "Users"/>}
                  { insightResource === "storage" && <InsightsChart insights={data.storageInsights} resource = "Storage"/>}
                </>
              )}
            </div>
          ) : (
            <p>Click a feature to see details</p>
          )}
        </div>
      </div>

      <div>
        {modalOpen && (
          <HolidayModel
            holidayDates={data.holidays.holiday_dates}
            setModalOpen={setModalOpen}
          />
        )}
      </div>
    </>
  );
};

export default DateRange;
