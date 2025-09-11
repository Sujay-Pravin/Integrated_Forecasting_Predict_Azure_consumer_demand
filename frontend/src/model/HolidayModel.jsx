import React, { useState } from "react";
import "./HolidayModel.css";

const HolidayModel = ({ holidayDates, setModalOpen }) => {

  const formattedDates = holidayDates.map((d) => {
    const date = new Date(d);
    return date.toDateString(); // "Sun Jan 01 2023"
  });

  return (
    <>
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            <h3>Holiday Dates</h3>
            <ul>
              {formattedDates.map((d, idx) => (
                <li key={idx}>{d}</li>
              ))}
            </ul>
            <button onClick={() => setModalOpen(false)}>Close</button>
          </div>
        </div>
    </>
  );
};

export default HolidayModel;
