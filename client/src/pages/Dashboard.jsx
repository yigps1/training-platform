import "react-big-calendar/lib/css/react-big-calendar.css";
import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import { addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import DepotSelector from "../components/DepotSelector";
import VehicleSelector from "../components/VehicleSelector";
import TrainingDetailsModal from "../components/TrainingDetailsModal";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const API_BASE = process.env.REACT_APP_API_URL || "https://your-backend-url/api"; // .env

function extractName(title) {
  const match = title.match(/^(.+?)\s*\(/);
  return match ? match[1] : title;
}

function extractDepot(title) {
  const match = title.match(/\((.+?)\)/);
  return match ? match[1] : "Unknown";
}

function extractVehicle(title) {
  const match = title.match(/\[(.+?)\]$/);
  return match ? match[1] : "unknown";
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [trainees, setTrainees] = useState([]);

  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("month");

  const [showDepotSelector, setShowDepotSelector] = useState(false);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [pendingName, setPendingName] = useState(null);
  const [pendingSlot, setPendingSlot] = useState(null);
  const [pendingDepot, setPendingDepot] = useState(null);
  const [detailsModalInfo, setDetailsModalInfo] = useState(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) navigate("/login");

    fetch(`${API_BASE}/events`).then((res) => res.json()).then((data) => {
      const mapped = data.map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      }));
      setEvents(mapped);
    });

    fetch(`${API_BASE}/trainees`).then((res) => res.json()).then(setTrainees);
  }, [navigate]);

  const handleSelectSlot = (slotInfo) => {
    const name = prompt("Enter trainee name:");
    if (!name) return;
    if (trainees.includes(name)) {
      alert("Trainee already exists!");
      return;
    }
    setPendingName(name);
    setPendingSlot(slotInfo);
    setShowDepotSelector(true);
  };

  const handleDepotSelected = (depot) => {
    setPendingDepot(depot);
    setShowDepotSelector(false);
    setShowVehicleSelector(true);
  };

  const handleVehicleSelected = async (vehicle) => {
    if (!pendingName || !pendingSlot || !pendingDepot) return;

    const newTitle = `${pendingName} (${pendingDepot}) [${vehicle}]`;
    const start = pendingSlot.start;
    const end = addDays(start, 13);

    try {
      const res = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, start, end }),
      });
      const newEvent = await res.json();
      setEvents((prev) => [...prev, { ...newEvent, start: new Date(newEvent.start), end: new Date(newEvent.end) }]);

      await fetch(`${API_BASE}/trainees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: pendingName }),
      });
      setTrainees((prev) => [...prev, pendingName]);
    } catch (err) {
      alert("Error saving event");
    }

    setPendingName(null);
    setPendingSlot(null);
    setPendingDepot(null);
    setShowVehicleSelector(false);
  };

  const handleDeleteTrainee = async (name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    await fetch(`${API_BASE}/trainees/${encodeURIComponent(name)}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => extractName(e.title) !== name));
    setTrainees((prev) => prev.filter((t) => t !== name));
  };

  const handleSelectEvent = (event) => {
    const name = extractName(event.title);
    setDetailsModalInfo({ traineeName: name, start: event.start, end: event.end });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>📅 Training Calendar</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        date={date}
        view={view}
        onNavigate={setDate}
        onView={setView}
        style={{ height: 500, marginBottom: 30 }}
      />

      {showDepotSelector && (
        <DepotSelector onSelect={handleDepotSelected} onCancel={() => setShowDepotSelector(false)} />
      )}

      {showVehicleSelector && (
        <VehicleSelector onSelect={handleVehicleSelected} onCancel={() => setShowVehicleSelector(false)} />
      )}

      <h3>📋 Trainees</h3>
      <ul>
        {trainees.map((name) => (
          <li key={name}>
            {name}
            <button onClick={() => handleDeleteTrainee(name)}>Delete</button>
          </li>
        ))}
      </ul>

      {detailsModalInfo && (
        <TrainingDetailsModal
          traineeName={detailsModalInfo.traineeName}
          startDate={detailsModalInfo.start}
          endDate={detailsModalInfo.end}
          onClose={() => setDetailsModalInfo(null)}
        />
      )}
    </div>
  );
}

