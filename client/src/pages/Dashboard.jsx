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
import DepotSelector from "../components/DepotSelector";
import VehicleSelector from "../components/VehicleSelector";
import TrainingDetailsModal from "../components/TrainingDetailsModal";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const API_BASE = process.env.REACT_APP_API_URL || "https://training-platform-backend-mq42.onrender.com/api";

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

    fetch(`${API_BASE}/events`)
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((e) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
        }));
        setEvents(mapped);
      });

    fetch(`${API_BASE}/trainees`)
      .then((res) => res.json())
      .then(setTrainees);
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

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("loggedInUser");
      navigate("/login");
    }
  };

  const eventStyleGetter = (event) => {
    const now = new Date();
    const start = new Date(event.start);
    const end = new Date(event.end);

    let backgroundColor = "green";
    if (end < now) backgroundColor = "red";
    else if (start <= now && now <= end) backgroundColor = "yellow";

    return {
      style: {
        backgroundColor,
        color: "black",
        borderRadius: "5px",
        border: "1px solid #666",
      },
    };
  };

  const getTraineeColor = (trainee) => {
    const event = events.find((ev) => extractName(ev.title) === trainee);
    if (!event) return "black";

    const now = new Date();
    const start = new Date(event.start);
    const end = new Date(event.end);

    if (end < now) return "red";
    else if (start <= now && now <= end) return "orange";
    else return "green";
  };

  const traineesByDepot = events.reduce((acc, ev) => {
    const name = extractName(ev.title);
    const depot = extractDepot(ev.title);
    const startDate = ev.start;
    const vehicle = extractVehicle(ev.title);

    if (!acc[depot]) acc[depot] = [];
    if (!acc[depot].some((t) => t.name === name)) {
      acc[depot].push({ name, startDate, vehicle });
    }
    return acc;
  }, {});

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
        <h2>📅 Training Calendar</h2>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: "#e74c3c",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

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
        eventPropGetter={eventStyleGetter}
        style={{ height: 500, marginBottom: 30 }}
      />

      {showDepotSelector && (
        <DepotSelector onSelect={handleDepotSelected} onCancel={() => setShowDepotSelector(false)} />
      )}
      {showVehicleSelector && (
        <VehicleSelector onSelect={handleVehicleSelected} onCancel={() => setShowVehicleSelector(false)} />
      )}

      <h3>📋 Trainees List</h3>
      {Object.keys(traineesByDepot).sort().map((depot) => (
        <div key={depot} style={{ marginBottom: 20 }}>
          <h4>{depot}</h4>
          <ul>
            {traineesByDepot[depot]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(({ name, startDate, vehicle }) => (
                <li
                  key={name}
                  style={{ cursor: "pointer", color: getTraineeColor(name) }}
                  onClick={() => navigate(`/trainee/${encodeURIComponent(name)}`)}
                >
                  {name} - Start: {format(new Date(startDate), "dd/MM/yyyy")} - Vehicle: {vehicle}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTrainee(name);
                    }}
                    style={{ marginLeft: 10 }}
                  >
                    Delete
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}

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
