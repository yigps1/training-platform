import React, { useState, useEffect } from "react";

const API_BASE = "https://training-platform-backend-mq42.onrender.com/api";

export default function ProgressTracker() {
  const [trainees, setTrainees] = useState([]);
  const [newTrainee, setNewTrainee] = useState("");

  // Изтегляне на всички trainees от базата
  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch(`${API_BASE}/progress`);
        if (!res.ok) throw new Error("Грешка при зареждане на прогреса");
        const data = await res.json();

        const grouped = data.reduce((acc, item) => {
          const name = item.user_id;
          const stage = parseInt(item.stage.replace("%", "")) || 0;
          acc[name] = stage;
          return acc;
        }, {});

        const formatted = Object.entries(grouped).map(([name, progress]) => ({
          name,
          progress,
        }));

        setTrainees(formatted);
      } catch (err) {
        console.error("❌ Failed to fetch progress:", err);
      }
    }

    fetchProgress();
  }, []);

  // Добавяне на нов trainee
  const handleAddTrainee = async () => {
    const trimmed = newTrainee.trim();
    if (!trimmed) return;

    try {
      const res = await fetch(`${API_BASE}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: trimmed, stage: "0%" }),
      });

      if (!res.ok) throw new Error("❌ Неуспешно добавяне на trainee");

      setTrainees([...trainees, { name: trimmed, progress: 0 }]);
      setNewTrainee("");
    } catch (err) {
      console.error("❌ Error adding trainee:", err);
      alert("Неуспешно добавяне");
    }
  };

  // Обновяване на прогрес
  const updateProgress = async (index, newProgress) => {
    const clamped = Math.min(100, Math.max(0, parseInt(newProgress) || 0));
    const name = trainees[index].name;

    try {
      const res = await fetch(`${API_BASE}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: name, stage: `${clamped}%` }),
      });

      if (!res.ok) throw new Error("❌ Проблем при обновяване");

      const updated = [...trainees];
      updated[index].progress = clamped;
      setTrainees(updated);
    } catch (err) {
      console.error("❌ Error updating progress:", err);
      alert("Грешка при запис на прогрес");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Add trainee..."
          className="border rounded px-2 py-1"
          value={newTrainee}
          onChange={(e) => setNewTrainee(e.target.value)}
        />
        <button
          onClick={handleAddTrainee}
          className="bg-blue-600 text-white px-4 py-1 rounded"
        >
          Add
        </button>
      </div>

      <ul className="space-y-3">
        {trainees.map((trainee, index) => (
          <li
            key={index}
            className="flex justify-between items-center border p-2 rounded"
          >
            <span className="font-medium">{trainee.name}</span>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="100"
                value={trainee.progress}
                onChange={(e) => updateProgress(index, e.target.value)}
                className="w-16 border rounded px-1"
              />
              <span>%</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
