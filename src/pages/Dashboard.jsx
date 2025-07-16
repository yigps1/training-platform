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

function findDetailsKey(name) {
  const variants = [
    name.toLowerCase(),
    name,
    encodeURIComponent(name),
    encodeURIComponent(name.toLowerCase()),
  ];

  for (const variant of variants) {
    const key = `training_details_${variant}`;
    if (localStorage.getItem(key)) {
      return key;
    }
  }
  return `training_details_${name.toLowerCase()}`;
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Проверка за логнат потребител при зареждане
  useEffect(() => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (!loggedInUser) {
      navigate("/login");
    }
  }, [navigate]);

  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem("training_events");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((ev) => ({
        ...ev,
        start: new Date(ev.start),
        end: new Date(ev.end),
      }));
    } catch {
      return [];
    }
  });

  const [trainees, setTrainees] = useState(() => {
    const saved = localStorage.getItem("training_trainees");
    return saved ? JSON.parse(saved) : [];
  });

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
    localStorage.setItem("training_events", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem("training_trainees", JSON.stringify(trainees));
  }, [trainees]);

  const handleSelectSlot = (slotInfo) => {
    const nameInput = prompt("Enter trainee name:");
    if (!nameInput) return;

    const trimmedName = nameInput.trim();
    if (trimmedName === "") return;

    const nameExists = trainees.some(
      (t) => t.toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameExists) {
      alert(`Trainee with name "${trimmedName}" already exists!`);
      return;
    }

    setPendingName(trimmedName);
    setPendingSlot(slotInfo);
    setShowDepotSelector(true);
  };

  const handleDepotSelected = (depot) => {
    setPendingDepot(depot);
    setShowDepotSelector(false);
    setShowVehicleSelector(true);
  };

  const handleVehicleSelected = (vehicle) => {
    if (!pendingName || !pendingSlot || !pendingDepot) return;

    const startDate = pendingSlot.start;
    const endDate = addDays(startDate, 13);

    const newTitle = `${pendingName} (${pendingDepot}) [${vehicle}]`;

    const newEvent = {
      title: newTitle,
      start: startDate,
      end: endDate,
      allDay: true,
    };

    setEvents((prev) => [...prev, newEvent]);
    setTrainees((prev) => [...prev, pendingName]);

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

    let backgroundColor = "green";

    if (end < now) {
      backgroundColor = "red";
    } else if (start <= now && now <= end) {
      backgroundColor = "yellow";
    }

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
    else if (start > now) return "green";

    return "black";
  };

  const generateReport = () => {
    if (!reportStart || !reportEnd) {
      alert("Please select both start and end dates for the report.");
      return;
    }

    const startFilter = new Date(reportStart);
    const endFilter = new Date(reportEnd);
    endFilter.setHours(23, 59, 59, 999);

    const rows = [
      ["Trainee", "Depot", "Vehicle", "Training Date", "Topic", "Notes"],
    ];

    let hasData = false;

    events.forEach((ev) => {
      const name = toTitleCase(extractName(ev.title));
      const depot = extractDepot(ev.title);
      const vehicle = extractVehicle(ev.title);

      const detailsKey = findDetailsKey(name);
      const detailsRaw = localStorage.getItem(detailsKey);
      let details = {};

      if (detailsRaw) {
        try {
          details = JSON.parse(detailsRaw);
        } catch (e) {
          console.warn(`Could not parse training details for ${name}:`, e);
        }
      }

      for (let day = 1; day <= 14; day++) {
        const currentDate = addDays(new Date(ev.start), day - 1);

        if (currentDate >= startFilter && currentDate <= endFilter) {
          const dayKey = `day${day}`;
          const dayDetails = details[dayKey] || {};

          rows.push([
            name,
            depot,
            vehicle,
            format(currentDate, "dd/MM/yyyy"),
            dayDetails.topic || "",
            dayDetails.notes || "",
          ]);

          hasData = true;
        }
      }
    });

    if (!hasData) {
      alert("No trainings found in selected date range.");
      return;
    }

    const csvContent = rows
      .map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `training_report_${format(new Date(), "yyyyMMdd")}.csv`);
  };

  const traineesByDepot = events.reduce((acc, ev) => {
    const name = extractName(ev.title);
    const depot = extractDepot(ev.title);
    const startDate = ev.start;
    const vehicle = extractVehicle(ev.title);

    if (trainees.includes(name)) {
      if (!acc[depot]) acc[depot] = [];
      if (!acc[depot].some((t) => t.name === name)) {
        acc[depot].push({ name, startDate, vehicle });
      }
    }
    return acc;
  }, {});

  const sortedDepots = Object.keys(traineesByDepot).sort();

  const handleDeleteTrainee = (traineeToDelete) => {
    if (!window.confirm(`Are you sure you want to delete ${traineeToDelete}?`))
      return;

    const updatedTrainees = trainees.filter(
      (t) => t.toLowerCase() !== traineeToDelete.toLowerCase()
    );
    const updatedEvents = events.filter(
      (ev) =>
        extractName(ev.title).toLowerCase() !== traineeToDelete.toLowerCase()
    );

    const variantsToRemove = [
      traineeToDelete.toLowerCase(),
      traineeToDelete,
      encodeURIComponent(traineeToDelete),
      encodeURIComponent(traineeToDelete.toLowerCase()),
    ];
    variantsToRemove.forEach((variant) => {
      localStorage.removeItem(`training_details_${variant}`);
    });

    setTrainees(updatedTrainees);
    setEvents(updatedEvents);
  };

  const handleSelectEvent = (event) => {
    const name = extractName(event.title);
    setDetailsModalInfo({ traineeName: name, start: event.start, end: event.end });
  };

  const closeDetailsModal = () => {
    setDetailsModalInfo(null);
  };

  // Логика за logout бутон
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("loggedInUser");
      navigate("/login");
    }
  };

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
          type="button"
          title="Logout"
        >
          Logout
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ marginRight: 10 }}>
          From:{" "}
          <input
            type="date"
            value={reportStart}
            onChange={(e) => setReportStart(e.target.value)}
          />
        </label>
        <label style={{ marginRight: 10 }}>
          To:{" "}
          <input
            type="date"
            value={reportEnd}
            onChange={(e) => setReportEnd(e.target.value)}
          />
        </label>
        <button onClick={generateReport}>Export Report</button>
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
        <DepotSelector
          onSelect={handleDepotSelected}
          onCancel={handleDepotCancel}
        />
      )}

      {showVehicleSelector && (
        <VehicleSelector
          onSelect={handleVehicleSelected}
          onCancel={handleDepotCancel}
        />
      )}

      <h3>📋 Trainees List</h3>
      {sortedDepots.map((depot) => (
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
                  {name} - Start: {format(startDate, "dd/MM/yyyy")} - Vehicle: {vehicle}{" "}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTrainee(name);
                    }}
                    style={{ marginLeft: 10, cursor: "pointer" }}
                    type="button"
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
          onClose={closeDetailsModal}
        />
      )}
    </div>
  );
}
