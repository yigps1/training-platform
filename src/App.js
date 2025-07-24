import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import TraineeDetail from "./pages/TraineeDetail";
import Login from "./pages/Login";

// Компонент за защита на рутове (private routes)
function PrivateRoute({ children }) {
  const loggedInUser = localStorage.getItem("loggedInUser");

  if (!loggedInUser) {
    // Ако не е логнат, пренасочи към логин
    return <Navigate to="/login" replace />;
  }

  // Ако е логнат, рендерирай децата (компонента)
  return children;
}

function App() {
  const loggedInUser = localStorage.getItem("loggedInUser");

  return (
    <Router>
      <Routes>
        {/* Логин страница - ако е логнат, пренасочи към dashboard */}
        <Route
          path="/login"
          element={loggedInUser ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* Dashboard - достъпен само ако си логнат */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Страница за детайли на обучаемия - само ако си логнат */}
        <Route
          path="/trainee/:name"
          element={
            <PrivateRoute>
              <TraineeDetail />
            </PrivateRoute>
          }
        />

        {/* Основен рут "/" - пренасочва към dashboard или login */}
        <Route
          path="/"
          element={
            loggedInUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          }
        />

        {/* Всички други пътища пренасочват към login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
