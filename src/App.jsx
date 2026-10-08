import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Complaint from "./pages/Complaint";

function AdminRoute({ children }) {
  const role = localStorage.getItem("campusRole");

  if (role !== "admin") {
    return <Navigate to="/analytics" replace />;
  }

  return children;
}

function FacultyRoute({ children }) {
  const role = localStorage.getItem("campusRole");

  if (role !== "faculty") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AuthRoute({ children }) {
  const role = localStorage.getItem("campusRole");

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      {/* ADMIN ONLY */}
      <Route
        path="/dashboard"
        element={
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        }
      />

      {/* ADMIN + FACULTY */}
      <Route
        path="/analytics"
        element={
          <AuthRoute>
            <Analytics />
          </AuthRoute>
        }
      />

      {/* FACULTY ONLY */}
      <Route
        path="/complaint"
        element={
          <FacultyRoute>
            <Complaint />
          </FacultyRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />

    </Routes>
  );
}

export default App;