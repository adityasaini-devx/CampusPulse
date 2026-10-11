
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("campusToken");
  const savedRole = localStorage.getItem("campusRole");

  const role =
    token && ["admin", "faculty"].includes(savedRole)
      ? savedRole
      : null;

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem("campusToken");
    localStorage.removeItem("campusRole");
    localStorage.removeItem("campusUser");

    closeMenu();
    navigate("/login", { replace: true });
  }

  const homePath =
    role === "admin"
      ? "/dashboard"
      : role === "faculty"
        ? "/analytics"
        : "/login";

  return (
    <header className="navbar">
      <div className="nav-container">

        {/* CampusPulse logo image */}
        <Link
          to={homePath}
          className="logo"
          onClick={closeMenu}
          aria-label="CampusPulse home"
        >
          <img
            src="/logo.png"
            alt="CampusPulse - Campus Analytics Dashboard"
            className="navbar-logo-image"
          />
        </Link>

        {/* Mobile menu button */}
        <button
          type="button"
          className="menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {/* Navigation links */}
        <nav
          className={`nav-links ${menuOpen ? "show" : ""}`}
          aria-label="Main navigation"
        >

          {/* Admin only */}
          {role === "admin" && (
            <NavLink to="/dashboard" onClick={closeMenu}>
              Dashboard
            </NavLink>
          )}

          {/* Admin and faculty */}
          {(role === "admin" || role === "faculty") && (
            <NavLink to="/analytics" onClick={closeMenu}>
              Analytics
            </NavLink>
          )}

          {/* Faculty only */}
          {role === "faculty" && (
            <NavLink to="/complaint" onClick={closeMenu}>
              Report an Issue
            </NavLink>
          )}

          {/* Logged-out visitors */}
          {!role && (
            <>
              <NavLink to="/login" onClick={closeMenu}>
                Login
              </NavLink>

              <Link
                to="/signup"
                className="button button-small"
                onClick={closeMenu}
              >
                Sign Up →
              </Link>
            </>
          )}

          {/* Logged-in users */}
          {role && (
            <button
              type="button"
              className="logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}

        </nav>
      </div>
    </header>
  );
}

export default Navbar;
