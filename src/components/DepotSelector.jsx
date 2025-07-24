import React, { useState } from "react";

const DEPOTS = [
  "Horsens",
  "Skanderbord",
  "Viby J",
  "Aarhus C",
  "Riskov",
  "Randers",
  "Folle",
  "Ebeltoft",
  "Grena",
];

export default function DepotSelector({ traineeName, onSelect, onCancel }) {
  const [selectedDepot, setSelectedDepot] = useState(DEPOTS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("✅ Depot selected:", selectedDepot);
    if (typeof onSelect === "function") {
      onSelect(selectedDepot);
    } else {
      console.warn("⚠️ onSelect не е дефинирана като функция.");
    }
  };

  const handleCancel = () => {
    console.log("❌ Depot selection cancelled");
    if (typeof onCancel === "function") {
      onCancel();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 8,
          minWidth: 320,
          boxShadow: "0 0 12px rgba(0,0,0,0.2)",
          textAlign: "center",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 20 }}>
          Select depot for <strong>{traineeName}</strong>
        </h3>

        <select
          value={selectedDepot}
          onChange={(e) => setSelectedDepot(e.target.value)}
          style={{
            width: "100%",
            fontSize: 16,
            padding: 10,
            borderRadius: 6,
            marginBottom: 20,
            border: "1px solid #ccc",
          }}
        >
          {DEPOTS.map((depot) => (
            <option key={depot} value={depot}>
              {depot}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            onClick={handleCancel}
            style={{
              padding: "8px 14px",
              backgroundColor: "#ccc",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: "8px 14px",
              backgroundColor: "#2ecc71",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Confirm
          </button>
        </div>
      </form>
    </div>
  );
}
