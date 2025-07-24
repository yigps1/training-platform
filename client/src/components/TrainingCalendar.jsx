import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

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
];

const CHECKLIST_STORAGE_KEY_PREFIX = "training_platform_checklist_";

export default function TraineeDetail() {
  const { name } = useParams(); // взимаме името на trainee от URL
  const decodedName = decodeURIComponent(name);

  const [checkedItems, setCheckedItems] = useState({});

  // Зареждаме състоянието на чековете от localStorage при първоначално зареждане
  useEffect(() => {
    const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY_PREFIX + decodedName);
    if (saved) {
      setCheckedItems(JSON.parse(saved));
    }
  }, [decodedName]);

  // Записваме при всяка промяна в checkedItems
  useEffect(() => {
    localStorage.setItem(
      CHECKLIST_STORAGE_KEY_PREFIX + decodedName,
      JSON.stringify(checkedItems)
    );
  }, [checkedItems, decodedName]);

  const toggleCheck = (item) => {
    setCheckedItems((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: 8,
      }}
    >
      <header
        style={{
          marginBottom: 30,
          borderBottom: "2px solid #333",
          paddingBottom: 10,
        }}
      >
        <h1 style={{ margin: 0 }}>Training Info</h1>
        <h2 style={{ marginTop: 5, color: "#555" }}>{decodedName}</h2>
      </header>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {checklistItems.map((item) => (
          <li key={item} style={{ marginBottom: 15 }}>
            <label
              style={{
                cursor: "pointer",
                fontSize: "1.1em",
                userSelect: "none",
              }}
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
    </div>
  );
}


