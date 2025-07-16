import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const checklistItems = [
  "Introducing in company",
  "How to log into eliga",
  "How to count products",
  "How to scan packages",
  "Magazines - to count and check",
  "Clean, trashes plastic and paper",
  "Understand AFLO",
  "How to find/use key",
  "How to deliver to shops",
  "How to take pictures on packages",
  "How to register parcel when code is not readable",
  "How to undo swipe",
  "How to mark a problem",
  "How to report issues",
  "Is the distribution start time clear",
  "Pick up packages",
  "What detail to send to manager in case of accident",
];

function parseTitle(title) {
  const match = title.match(/^(.+?)\s*\((.+?)\s*\|\s*(.+)\)$/);
  if (match) {
    return {
      name: match[1],
      depot: match[2],
      vehicle: match[3],
    };
  }

  const oldMatch = title.match(/^(.+?)\s*\((.+)\)$/);
  if (oldMatch) {
    return {
      name: oldMatch[1],
      depot: oldMatch[2],
      vehicle: null,
    };
  }

  return { name: title, depot: null, vehicle: null };
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

export default function TraineeDetail() {
  const { name } = useParams();
  const decodedName = decodeURIComponent(name);

  const [checkedItems, setCheckedItems] = useState({});
  const [trainingDetails, setTrainingDetails] = useState({});
  const [depot, setDepot] = useState(null);
  const [vehicle, setVehicle] = useState(null);

  useEffect(() => {
    // Зареждаме checklist състоянието
    const savedAll = JSON.parse(localStorage.getItem("trainee_checklists")) || {};
    const traineeData = savedAll[decodedName] || {};
    setCheckedItems(traineeData.checkedItems || {});

    // Зареждаме training_details по trainee
    const key = `training_details_${decodedName.toLowerCase()}`;
    const savedDetails = JSON.parse(localStorage.getItem(key)) || {};
    setTrainingDetails(savedDetails);

    // Търсим event за depot и vehicle
    const savedEvents = JSON.parse(localStorage.getItem("training_events")) || [];
    const foundEvent = savedEvents.find((ev) => {
      const parsed = parseTitle(ev.title);
      return toTitleCase(parsed.name) === toTitleCase(decodedName);
    });

    if (foundEvent) {
      const parsed = parseTitle(foundEvent.title);
      setDepot(parsed.depot);
      setVehicle(parsed.vehicle);
    } else {
      setDepot(null);
      setVehicle(null);
    }
  }, [decodedName]);

  const saveCheckedItems = (updatedChecked) => {
    setCheckedItems(updatedChecked);
    const savedAll = JSON.parse(localStorage.getItem("trainee_checklists")) || {};
    savedAll[decodedName] = {
      ...savedAll[decodedName],
      checkedItems: updatedChecked,
    };
    localStorage.setItem("trainee_checklists", JSON.stringify(savedAll));
  };

  const toggleCheck = (item) => {
    const updatedChecked = {
      ...checkedItems,
      [item]: !checkedItems[item],
    };
    saveCheckedItems(updatedChecked);
  };

  // Обновява trainingDetails по ключ "dayX"
  const updateTrainingDetail = (dayKey, field, value) => {
    const updated = {
      ...trainingDetails,
      [dayKey]: {
        ...trainingDetails[dayKey],
        [field]: value,
      },
    };
    setTrainingDetails(updated);
    localStorage.setItem(
      `training_details_${decodedName.toLowerCase()}`,
      JSON.stringify(updated)
    );
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: 8,
      }}
    >
      <Link to="/" style={{ display: "inline-block", marginBottom: 20 }}>
        ← Back to Dashboard
      </Link>

      <header
        style={{
          marginBottom: 30,
          borderBottom: "2px solid #333",
          paddingBottom: 10,
        }}
      >
        <h1 style={{ margin: 0 }}>Training Checklist</h1>
        <h2 style={{ marginTop: 5, color: "#555" }}>{toTitleCase(decodedName)}</h2>
        {(depot || vehicle) && (
          <p style={{ fontStyle: "italic", color: "#777", marginTop: 4 }}>
            {depot && <>Depot: <strong>{depot}</strong></>}
            {depot && vehicle && " | "}
            {vehicle && <>Vehicle: <strong>{vehicle}</strong></>}
          </p>
        )}
      </header>

      <ul style={{ listStyle: "none", padding: 0, marginBottom: 40 }}>
        {checklistItems.map((item) => (
          <li key={item} style={{ marginBottom: 15 }}>
            <label
              style={{ cursor: "pointer", fontSize: "1.1em", userSelect: "none" }}
            >
              <input
                type="checkbox"
                checked={!!checkedItems[item]}
                onChange={() => toggleCheck(item)}
                style={{ marginRight: 12, transform: "scale(1.3)" }}
              />
              {item}
            </label>
          </li>
        ))}
      </ul>

      <div>
        <h3>Daily Description and Comments / Feedback</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
        >
          {[...Array(14)].map((_, i) => {
            const dayKey = `day${i + 1}`;
            const dayData = trainingDetails[dayKey] || { topic: "", notes: "" };

            return (
              <React.Fragment key={dayKey}>
                <div>
                  <label
                    htmlFor={`topic-${dayKey}`}
                    style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}
                  >
                    Day {i + 1} - Topic
                  </label>
                  <textarea
                    id={`topic-${dayKey}`}
                    rows={3}
                    style={{ width: "100%", padding: 8, fontSize: "1em" }}
                    value={dayData.topic}
                    onChange={(e) => updateTrainingDetail(dayKey, "topic", e.target.value)}
                    placeholder={`Topic for Day ${i + 1}...`}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`notes-${dayKey}`}
                    style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}
                  >
                    Day {i + 1} - Notes
                  </label>
                  <textarea
                    id={`notes-${dayKey}`}
                    rows={3}
                    style={{ width: "100%", padding: 8, fontSize: "1em" }}
                    value={dayData.notes}
                    onChange={(e) => updateTrainingDetail(dayKey, "notes", e.target.value)}
                    placeholder={`Notes for Day ${i + 1}...`}
                  />
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
