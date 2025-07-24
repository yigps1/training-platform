import React from "react";

const vehicles = ["bike", "scooter30", "scooter45", "kyburz", "car"];

export default function VehicleSelector({ onSelect, onCancel }) {
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
      }}
    >
      <h3>Select Vehicle Type</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {vehicles.map((v) => (
          <li key={v} style={{ marginBottom: 10 }}>
            <button
              onClick={() => onSelect(v)} // Тук използваме onSelect!
              style={{
                padding: "8px 12px",
                border: "1px solid #666",
                borderRadius: 6,
                cursor: "pointer",
                width: "100%",
              }}
            >
              {v}
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={onCancel}
        style={{
          marginTop: 10,
          padding: "6px 12px",
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
