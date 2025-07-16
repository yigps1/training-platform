import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import TraineeDetail from "./pages/TraineeDetail";
import Login from "./pages/Login";

function PrivateRoute({ children }) {
  const loggedInUser = localStorage.getItem("loggedInUser");

  // Ако искаш, можеш да парсваш JSON и да проверяваш, но за пример - само проверяваме съществуване:
  if (!loggedInUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const loggedInUser = localStorage.getItem("loggedInUser");

  return (
    <Router>
      <Routes>
        <Route path="/login" element={loggedInUser ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/trainee/:name"
          element={
            <PrivateRoute>
              <TraineeDetail />
            </PrivateRoute>
          }
        />
        {/* Пренасочване на "/" към "/dashboard" ако си логнат, иначе към login */}
        <Route path="/" element={loggedInUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        {/* Ако URL не съвпада с никой път, пренасочи към login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
