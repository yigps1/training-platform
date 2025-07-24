import React from "react";

const vehicles = ["bike", "scooter30", "scooter45", "kyburz", "car"];

export default function VehicleSelector({ onSelect, onCancel }) {
  const handleSelect = (vehicle) => {
    console.log("✅ Vehicle selected:", vehicle); // Дебъг
    if (typeof onSelect === "function") {
      onSelect(vehicle);
    } else {
      console.warn("⚠️ onSelect не е подадена като функция.");
    }
  };

  const handleCancel = () => {
    console.log("❌ Vehicle selection cancelled");
    if (typeof onCancel === "function") {
      onCancel();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "30%",
        left: "50%",
        transform: "translate(-50%, -30%)",
        background: "#fff",
        padding: 24,
        border: "1px solid #ccc",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        zIndex: 1000,
        width: 300,
        textAlign: "center",
      }}
    >
      <h3 style={{ marginBottom: 16 }}>Select Vehicle Type</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {vehicles.map((v) => (
          <li key={v} style={{ marginBottom: 10 }}>
            <button
              onClick={() => handleSelect(v)}
              style={{
                padding: "10px 16px",
                border: "1px solid #666",
                borderRadius: 6,
                cursor: "pointer",
                width: "100%",
                backgroundColor: "#f7f7f7",
              }}
            >
              {v}
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={handleCancel}
        style={{
          marginTop: 12,
          padding: "8px 16px",
          backgroundColor: "#e74c3c",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Cancel
      </button>
    </div>
  );
}
