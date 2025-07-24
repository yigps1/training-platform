import React, { useEffect, useState } from "react";

const API_BASE = "https://training-platform-backend-mq42.onrender.com/api";

export default function ProgressTracker() {
  const [trainees, setTrainees] = useState([]);
  const [newTrainee, setNewTrainee] = useState("");

  // Зареждане на trainee прогрес при зареждане на компонента
  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch(`${API_BASE}/progress`);
        if (!res.ok) throw new Error("Грешка при зареждане на прогрес");
        const data = await res.json();
        setTrainees(
          data.map((entry) => ({
            name: entry.user_id,
            stage: entry.stage,
            created_at: entry.created_at,
          }))
        );
      } catch (err) {
        console.error("❌ Грешка при зареждане на прогрес:", err);
      }
    }

    fetchProgress();
  }, []);

  // Добавяне на trainee
  const handleAddTrainee = async () => {
    const trimmed = newTrainee.trim();
    if (!trimmed) return;

    try {
      const stage = `${trimmed} (New)`;
      const res = await fetch(`${API_BASE}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: trimmed, stage }),
      });

      if (!res.ok) throw new Error("Грешка при запис");

      const added = await res.json();
      setTrainees((prev) => [
        ...prev,
        {
          name: added.user_id,
          stage: added.stage,
          created_at: added.created_at,
        },
      ]);
      setNewTrainee("");
    } catch (err) {
      console.error("🚨 Неуспешно записване:", err);
      alert("Грешка при запис на прогрес");
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Add trainee..."
          className="border rounded px-2 py-1 w-full"
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

      <ul className="space-y-2">
        {trainees.map((t, i) => (
          <li
            key={i}
            className="border p-3 rounded flex justify-between items-center bg-white shadow-sm"
          >
            <div>
              <div className="font-semibold">{t.name}</div>
              <div className="text-sm text-gray-600">{t.stage}</div>
            </div>
            <div className="text-xs text-gray-500">
              {new Date(t.created_at).toLocaleDateString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

