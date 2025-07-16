import React, { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function MyCalendar() {
  const [date, setDate] = useState(new Date()); // контролирана дата
  const [view, setView] = useState("month");   // контролирана визия

  const events = [
    {
      title: "Training with Ivan",
      start: new Date(2025, 6, 15, 10, 0),
      end: new Date(2025, 6, 15, 11, 0),
    },
    {
      title: "Group Session",
      start: new Date(2025, 6, 17, 15, 0),
      end: new Date(2025, 6, 17, 16, 30),
    },
  ];

  return (
    <div style={{ height: 500 }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={date}
        view={view}
        onNavigate={setDate}  // когато се навигира, обнови date
        onView={setView}      // когато се смени изглед, обнови view
        style={{ height: "100%" }}
      />
    </div>
  );
}


