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
    onSelect(selectedDepot);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
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
          background: "white",
          padding: 20,
          borderRadius: 8,
          minWidth: 300,
          boxShadow: "0 0 10px rgba(0,0,0,0.3)",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 15 }}>
          Select depot for <strong>{traineeName}</strong>
        </h3>

        <select
          value={selectedDepot}
          onChange={(e) => setSelectedDepot(e.target.value)}
          style={{ width: "100%", fontSize: 16, padding: 8, marginBottom: 20 }}
        >
          {DEPOTS.map((depot) => (
            <option key={depot} value={depot}>
              {depot}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" onClick={onCancel} style={{ padding: "6px 12px" }}>
            Cancel
          </button>
          <button type="submit" style={{ padding: "6px 12px" }}>
            Confirm
          </button>
        </div>
      </form>
    </div>
  );
}
