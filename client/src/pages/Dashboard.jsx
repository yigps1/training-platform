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

// ✅ Коригиран API път без /login
const API_BASE = "https://training-platform-backend-mq42.onrender.com";

function extractName(title) {
  const match = title.match(/^(.+?)\s*\(/);
  return match ? match[1] : title;
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

  const [detailsModalInfo, setDetailsModalInfo] = useState(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch(`${API_BASE}/api/progress`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        const eventsFromDB = data.map((item) => {
          const start = new Date(item.created_at);
          const end = addDays(start, 13);
          return {
            id: item.id,
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
    }
    fetchProgress();
  }, []);

  const handleSelectSlot = (slotInfo) => {
    const nameInput = prompt("Enter trainee name:");
    if (!nameInput) return;

    const trimmed = nameInput.trim();
    if (!trimmed) return;

    if (trainees.includes(trimmed)) {
      alert(`Trainee "${trimmed}" already exists!`);
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
    setShowVehicleSelector(false);

    const title = `${pendingName} (${pendingDepot}) [${vehicle}]`;

    const newEvent = {
      title,
      start: pendingSlot.start,
      end: pendingSlot.end,
      allDay: true,
    };

    console.log("⏳ Sending progress:", {
      user_id: pendingName,
      stage: title,
    });

    try {
      const res = await fetch(`${API_BASE}/api/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: pendingName, stage: title }),
      });

      const result = await res.text();
      if (!res.ok) {
        console.error("❌ API error:", res.status, result);
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      console.log("✅ Progress saved:", result);
      setEvents((prev) => [...prev, newEvent]);
      setPendingName(null);
      setPendingDepot(null);
      setPendingSlot(null);
    } catch (error) {
      console.error("🚨 Failed to save progress:", error);
      alert("Failed to save progress");
    }
  };

  const handleSelectEvent = (event) => {
    setDetailsModalInfo(event);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalInfo(null);
  };

  return (
    <div style={{ padding: 20 }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        onSelectSlot={handleSelectSlot}
        selectable
        onSelectEvent={handleSelectEvent}
        view={view}
        onView={(newView) => setView(newView)}
        date={date}
        onNavigate={(newDate) => setDate(newDate)}
      />

      {showDepotSelector && (
        <DepotSelector
          traineeName={pendingName}
          onSelect={handleDepotSelected}
          onCancel={() => setShowDepotSelector(false)}
        />
      )}

      {showVehicleSelector && (
        <VehicleSelector
          onSelect={handleVehicleSelected}
          onCancel={() => setShowVehicleSelector(false)}
        />
      )}

      {detailsModalInfo && (
        <TrainingDetailsModal event={detailsModalInfo} onClose={handleCloseDetailsModal} />
      )}
    </div>
  );
}

export default Dashboard;
