import React, { useState, useEffect, useMemo } from "react";
import format from "date-fns/format";
import addDays from "date-fns/addDays";

export default function TrainingDetailsForm({ traineeName, startDate, endDate, onSave }) {
  const [details, setDetails] = useState({});

  useEffect(() => {
    if (!traineeName) {
      setDetails({});
      return;
    }

    const saved = localStorage.getItem(`training_details_${traineeName.toLowerCase()}`);
    if (saved) {
      try {
        setDetails(JSON.parse(saved));
      } catch (e) {
        console.warn("Failed to parse training details:", e);
        setDetails({});
      }
    } else {
      setDetails({});
    }
  }, [traineeName]);

  const dates = useMemo(() => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const datesArr = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      datesArr.push(new Date(d));
    }
    return datesArr;
  }, [startDate, endDate]);

  if (!traineeName || !startDate || !endDate) return <p>Please select a trainee and training period.</p>;

  const handleChange = (dateStr, field, value) => {
    setDetails((prev) => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    localStorage.setItem(`training_details_${traineeName.toLowerCase()}`, JSON.stringify(details));
    if (typeof onSave === "function") onSave(details);
    alert("Training details saved.");
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear all training details for this trainee?")) {
      setDetails({});
      localStorage.removeItem(`training_details_${traineeName.toLowerCase()}`);
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 15, borderRadius: 8, maxHeight: "60vh", overflowY: "auto" }}>
      <h3>Training Details for {traineeName}</h3>

      {dates.length === 0 && <p>No training dates available.</p>}

      {dates.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayDetails = details[dateStr] || {};
        return (
          <div key={dateStr} style={{ marginBottom: 15, borderBottom: "1px solid #ddd", paddingBottom: 10 }}>
            <strong>{format(date, "dd/MM/yyyy")}</strong>
            <div style={{ marginTop: 5 }}>
              <label htmlFor={`topic-${dateStr}`}>
                Topic:<br />
                <input
                  id={`topic-${dateStr}`}
                  type="text"
                  value={dayDetails.topic || ""}
                  onChange={(e) => handleChange(dateStr, "topic", e.target.value)}
                  style={{ width: "100%" }}
                  aria-label={`Topic for ${format(date, "dd/MM/yyyy")}`}
                />
              </label>
            </div>
            <div style={{ marginTop: 5 }}>
              <label htmlFor={`notes-${dateStr}`}>
                Notes:<br />
                <textarea
                  id={`notes-${dateStr}`}
                  value={dayDetails.notes || ""}
                  onChange={(e) => handleChange(dateStr, "notes", e.target.value)}
                  rows={3}
                  style={{ width: "100%" }}
                  aria-label={`Notes for ${format(date, "dd/MM/yyyy")}`}
                />
              </label>
            </div>
          </div>
        );
      })}

      <div style={{ textAlign: "right", marginTop: 10 }}>
        <button onClick={handleSave} style={{ marginRight: 10, cursor: "pointer" }}>
          Save
        </button>
        <button onClick={handleReset} style={{ cursor: "pointer" }}>
          Reset
        </button>
      </div>
    </div>
  );
}
