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

const API_BASE = "postgresql://training_db_i7np_user:eV0yib2qylXq1Y3f2s4u9hfxPZD11JCm@dpg-d1soi87diees738hgig0-a.frankfurt-postgres.render.com/training_db_i7np"; // Смени с твоя бекенд URL

// Помощни функции за извличане на имена, депота, возилото
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

function Dashboard() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [trainees, setTrainees] = useState([]);

  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("month");

  const [showDepotSelector, setShowDepotSelector] = useState(false);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);

  // Данни за нов event
  const [pendingName, setPendingName] = useState(null);
  const [pendingSlot, setPendingSlot] = useState(null);
  const [pendingDepot, setPendingDepot] = useState(null);

  const [detailsModalInfo, setDetailsModalInfo] = useState(null);

  // Проверка за логнат потребител
  useEffect(() => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) navigate("/login");
  }, [navigate]);

  // Зареждане на данни от backend (progress таблицата)
  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch(`${API_BASE}/progress`);
        const data = await res.json();

        // map към събития за календара
        const eventsFromDB = data.map((item) => {
          const start = new Date(item.created_at);
          const end = addDays(start, 13); // 14-дневен период

          return {
            id: item.id,
            title: item.stage,
            start,
            end,
            allDay: true,
          };
        });

        setEvents(eventsFromDB);

        // уникални имена на обучаеми (user_id в нашия случай ползваме името, но тук - екстрактваме името от stage)
        const names = [...new Set(data.map((item) => extractName(item.stage)))];
        setTrainees(names);
      } catch (e) {
        console.error("Failed to fetch progress data", e);
      }
    }
    fetchProgress();
  }, []);

  // Когато изберем слот за ново събитие
  const handleSelectSlot = (slotInfo) => {
    const nameInput = prompt("Enter trainee name:");
    if (!nameInput) return;

    const trimmed = nameInput.trim();
    if (!trimmed) return;

    // Проверка за вече съществуващо име
    if (trainees.includes(trimmed)) {
      alert(`Trainee "${trimmed}" already exists!`);
      return;
    }

    // Запазваме данните и показваме Depot селектора
    setPendingName(trimmed);
    setPendingSlot(slotInfo);
    setShowDepotSelector(true);
  };

  // Избор на Depot
  const handleDepotSelected = (depot) => {
    setPendingDepot(depot);
    setShowDepotSelector(false);
    setShowVehicleSelector(true);
  };

  // Избор на Vehicle и запис в бекенд
  const handleVehicleSelected = async (vehicle) => {
    if (!pendingName || !pendingSlot || !pendingDepot) return;

    const startDate = pendingSlot.start;
    const endDate = addDays(startDate, 13);
    const title = `${pendingName} (${pendingDepot}) [${vehicle}]`;

    const newEvent = { title, start: startDate, end: endDate, allDay: true };

    // Оптимистично обновяване на UI
    setEvents((prev) => [...prev, newEvent]);
    setTrainees((prev) => [...prev, pendingName]);

    try {
      // Запис в backend (user_id = pendingName, stage = title)
      await fetch(`${API_BASE}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: pendingName, stage: title }),
      });
    } catch (e) {
      console.error("Error saving to backend", e);
      alert("Грешка при запис в базата.");
      // Ако искаш можеш да махнеш оптимистичното обновяване при грешка
    }

    // Нулиране и затваряне на селекторите
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

  // Стилове на event според датата (минали, текущи, бъдещи)
  const eventStyleGetter = (event) => {
    const now = new Date();
    const start = new Date(event.start);
    const end = new Date(event.end);

    let backgroundColor = "green"; // бъдещи
    if (end < now) backgroundColor = "red"; // минали
    else if (start <= now && end >= now) backgroundColor = "yellow"; // текущи

    return {
      style: {
        backgroundColor,
        color: "black",
        borderRadius: "5px",
      },
    };
  };

  // Клик на събитие -> показва подробности в модал
  const handleSelectEvent = (event) => {
    const name = extractName(event.title);
    setDetailsModalInfo({ traineeName: name, start: event.start, end: event.end });
  };

  // Logout
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
