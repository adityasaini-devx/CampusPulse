import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Complaint from "./pages/Complaint";

// Check whether a valid-looking login session exists
function getRole() {
  const token = localStorage.getItem("campusToken");
  const role = localStorage.getItem("campusRole");

  if (!token || !["admin", "faculty"].includes(role)) {
    return null;
  }

  return role;
}

// Redirect users according to their role
function HomeRedirect() {
  const role = getRole();

  if (role === "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (role === "faculty") {
    return <Navigate to="/analytics" replace />;
  }

  return <Navigate to="/login" replace />;
}

// Protect pages according to allowed roles
function ProtectedRoute({ allowedRoles, children }) {
  const role = getRole();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return (
      <Navigate
        to={role === "admin" ? "/dashboard" : "/analytics"}
        replace
      />
    );
  }

  return children;
}

// Prevent logged-in users from returning to login/signup
function PublicOnlyRoute({ children }) {
  const role = getRole();

  if (role === "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (role === "faculty") {
    return <Navigate to="/analytics" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Home */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Public pages */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <Signup />
          </PublicOnlyRoute>
        }
      />

      {/* Admin only */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin and faculty */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute allowedRoles={["admin", "faculty"]}>
            <Analytics />
          </ProtectedRoute>
        }
      />

      {/* Faculty only */}
      <Route
        path="/complaint"
        element={
          <ProtectedRoute allowedRoles={["faculty"]}>
            <Complaint />
          </ProtectedRoute>
        }
      />

      {/* Unknown routes */}
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}