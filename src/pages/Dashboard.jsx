// Dashboard.jsx (обновен да използва бекенд API вместо localStorage)

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
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const API_BASE = "https://your-render-backend.onrender.com/api"; // ЗАМЕНИ със своя URL

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

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

function Dashboard() {
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

  const [reportStart, setReportStart] = useState("");
  const [reportEnd, setReportEnd] = useState("");

  const [detailsModalInfo, setDetailsModalInfo] = useState(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/progress`);
        const data = await res.json();

        const eventsFromDB = data.map((item) => {
          const start = new Date(item.created_at);
          const end = addDays(start, 13);

          return {
            title: item.stage,
            start,
            end,
            allDay: true,
          };
        });

        setEvents(eventsFromDB);
        const names = [...new Set(data.map((item) => extractName(item.stage)))];
        setTrainees(names);
      } catch (e) {
        console.error("Failed to fetch progress data", e);
      }
    };
    fetchData();
  }, []);

  const handleSelectSlot = (slotInfo) => {
    const nameInput = prompt("Enter trainee name:");
    if (!nameInput) return;

    const trimmed = nameInput.trim();
    if (!trimmed) return;

    if (trainees.includes(trimmed)) {
      alert(`Trainee \"${trimmed}\" already exists!`);
      return;
    }

    setPendingName(trimmed);
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

    const startDate = pendingSlot.start;
    const endDate = addDays(startDate, 13);

    const title = `${pendingName} (${pendingDepot}) [${vehicle}]`;

    const newEvent = { title, start: startDate, end: endDate, allDay: true };
    setEvents((prev) => [...prev, newEvent]);
    setTrainees((prev) => [...prev, pendingName]);

    try {
      await fetch(`${API_BASE}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: pendingName, stage: title }),
      });
    } catch (e) {
      console.error("Error saving to backend", e);
    }

    setPendingName(null);
    setPendingSlot(null);
    setPendingDepot(null);
    setShowVehicleSelector(false);
  };

  const handleDepotCancel = () => {
    setPendingName(null);
    setPendingSlot(null);
    setPendingDepot(null);
    setShowDepotSelector(false);
    setShowVehicleSelector(false);
  };

  const eventStyleGetter = (event) => {
    const now = new Date();
    const start = new Date(event.start);
    const end = new Date(event.end);
    let backgroundColor = end < now ? "red" : start <= now ? "yellow" : "green";
    return { style: { backgroundColor, color: "black", borderRadius: "5px" } };
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

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>📅 Training Calendar</h2>
        <button onClick={handleLogout}>Logout</button>
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
        style={{ height: 500, marginBottom: 30 }}
        eventPropGetter={eventStyleGetter}
      />

      {showDepotSelector && (
        <DepotSelector onSelect={handleDepotSelected} onCancel={handleDepotCancel} />
      )}

      {showVehicleSelector && (
        <VehicleSelector onSelect={handleVehicleSelected} onCancel={handleDepotCancel} />
      )}

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

export default Dashboard;
