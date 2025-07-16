import React, { useState } from "react";

export default function ProgressTracker() {
  const [trainees, setTrainees] = useState([
    { name: "John Doe", progress: 60 },
    { name: "Jane Smith", progress: 80 },
  ]);
  const [newTrainee, setNewTrainee] = useState("");

  const handleAddTrainee = () => {
    if (newTrainee.trim()) {
      setTrainees([...trainees, { name: newTrainee, progress: 0 }]);
      setNewTrainee("");
    }
  };

  const updateProgress = (index, newProgress) => {
    const updated = [...trainees];
    updated[index].progress = parseInt(newProgress);
    setTrainees(updated);
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
          <li key={index} className="flex justify-between items-center border p-2 rounded">
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

