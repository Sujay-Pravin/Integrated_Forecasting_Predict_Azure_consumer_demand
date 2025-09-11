import React, { useState, useEffect } from "react";
import { fetchData, feature_endpoints } from "../../services/feature_api";
import "./FeaturePage.css";
import FeatureCharts from "../../components/FeatureCharts/FeatureCharts.jsx";

const FeaturePage = () => {
  const [dateType, setDateType] = useState("date");
  const [months, setMonths] = useState([]);
  const [dates, setDates] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [duration, setDuration] = useState(7);
  const [durationLocked, setDurationLocked] = useState(false);
  const [customLockedDuration, setCustomLockedDuration] = useState(null);

  const [featureData, setFeatureData] = useState({});

  useEffect(() => {
    setSelectedMonth("");
    setSelectedDate("");
    setDates([]);
    setFeatureData({});
    setDurationLocked(false);
    if (dateType === "week") setDuration(7);
    else if (dateType === "date") setDuration(1);
    else if (dateType === "custom") setDuration(7);
    setCustomLockedDuration(null);
  }, [dateType]);

  useEffect(() => {
    if (["date", "week", "custom"].includes(dateType)) {
      fetchData(feature_endpoints.months)
        .then((data) => setMonths(data.available_months || []))
        .catch((err) => console.error("Error fetching months:", err));
    } else {
      setMonths([]);
    }
  }, [dateType]);

  useEffect(() => {
    if (!selectedMonth) {
      setDates([]);
      return;
    }

    fetchData(feature_endpoints.datesInMonth(selectedMonth))
      .then((data) => {
        let availableDates = data.available_dates || [];
        if (
          availableDates.length &&
          (dateType === "week" || dateType === "custom")
        ) {
          const dur =
            dateType === "week" ? 7 : customLockedDuration || duration;
          availableDates = availableDates.slice(
            0,
            availableDates.length - (dur - 1)
          );
        }
        setDates(availableDates);
      })
      .catch((err) => console.error("Error fetching dates:", err));
  }, [selectedMonth, duration, customLockedDuration, dateType]);

  useEffect(() => {
    const loadFeatures = async () => {
      if (!selectedDate) return;
      if (
        dateType === "custom" &&
        (!customLockedDuration || customLockedDuration <= 0)
      )
        return;

      try {
        const results = {};
        let dur = 1;

        if (dateType === "week") dur = 7;
        else if (dateType === "custom") dur = customLockedDuration;

        if (dateType === "date") {
          // single-date endpoints
          results.cpu = await fetchData(feature_endpoints.cpu(selectedDate));
          results.storage = await fetchData(
            feature_endpoints.storage(selectedDate)
          );
          results.users = await fetchData(
            feature_endpoints.users(selectedDate)
          );
          results.economy = await fetchData(
            feature_endpoints.economy(selectedDate)
          );
          results.summary = await fetchData(
            feature_endpoints.summary(selectedDate)
          );
        } else {
          // range endpoints
          results.cpu = await fetchData(
            feature_endpoints.cpuRange(selectedDate, dur)
          );
          results.storage = await fetchData(
            feature_endpoints.storageRange(selectedDate, dur)
          );
          results.users = await fetchData(
            feature_endpoints.usersRange(selectedDate, dur)
          );
          results.economy = await fetchData(
            feature_endpoints.economyRange(selectedDate, dur)
          );
          results.summary = await fetchData(
            feature_endpoints.summaryRange(selectedDate, dur)
          );
          results.holidays = await fetchData(
            feature_endpoints.holidaysRange(selectedDate, dur)
          );
          results.cpuInsights = await fetchData(
            feature_endpoints.cpuInsights(selectedDate, dur)
          );
          results.storageInsights = await fetchData(
            feature_endpoints.storageInsights(selectedDate, dur)
          );
          results.usersInsights = await fetchData(
            feature_endpoints.usersInsights(selectedDate, dur)
          );
        }

        setFeatureData(results);
      } catch (error) {
        console.error("Error fetching feature data:", error);
      }
    };

    loadFeatures();
  }, [selectedDate, dateType, customLockedDuration]);

  return (
    <div className="feature-page">
      <h3>Timely Features</h3>

      <div className="selectors">
        {/* First dropdown - Date type */}
        <select
          value={dateType}
          onChange={(e) => setDateType(e.target.value)}
          className="view-selector"
        >
          <option value="date">Date</option>
          <option value="week">Week</option>
          <option value="custom">Custom</option>
        </select>

        {/* Custom duration input (first for custom type) */}
        {dateType === "custom" && (
          <div className="duration-wrapper">
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              placeholder="Enter duration (days)"
              className="duration-input view-selector"
              disabled={durationLocked}
              min={1}
            />
            <button
              type="button"
              onClick={() => {
                if (!durationLocked) setCustomLockedDuration(duration);
                else setCustomLockedDuration(null);
                setDurationLocked((prev) => !prev);
                setSelectedDate("");
                setFeatureData({});
              }}
              className="lock-btn"
              style={{
                borderColor: durationLocked ? "var(--accent-color)" : "tomato", 
              }}
            >
              {durationLocked ? "Unlock" : "Lock"}
            </button>
          </div>
        )}

        {/* Month selection */}
        {["date", "week", "custom"].includes(dateType) && (
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-selector view-selector"
          >
            <option value="">-- Select Month --</option>
            {months.map((month, idx) => (
              <option key={idx} value={month}>
                {month.slice(5)}
              </option>
            ))}
          </select>
        )}

        {/* Date selection */}
        {["date", "week", "custom"].includes(dateType) &&
          selectedMonth &&
          (dateType !== "custom" ||
            (dateType === "custom" && durationLocked)) && (
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-selector view-selector"
            >
              <option value="">-- Select Date --</option>
              {dates.map((date, idx) => (
                <option key={idx} value={date}>
                  {date}
                </option>
              ))}
            </select>
          )}
      </div>

      {/* Feature results */}
      {selectedDate &&
        (dateType !== "custom" ||
          (dateType === "custom" && durationLocked)) && (
          <div className="feature-results">
            <h4>
              Features for {selectedDate}
              {dateType === "week" && " (7 days)"}
              {dateType === "custom" &&
                durationLocked &&
                ` (${customLockedDuration} days)`}
            </h4>
            <FeatureCharts data={featureData} dateType={dateType} />
          </div>
        )}
    </div>
  );
};

export default FeaturePage;
