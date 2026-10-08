import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const role = localStorage.getItem("campusRole");

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem("campusRole");
    closeMenu();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="nav-container">

        <Link
          to={role === "admin" ? "/dashboard" : "/analytics"}
          className="logo"
          onClick={closeMenu}
        >
          <div className="logo-icon">CP</div>

          <div>
            <strong>CampusPulse</strong>
            <span>SMART CAMPUS</span>
          </div>
        </Link>

        <button
          className="menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        <nav
          className={
            menuOpen
              ? "nav-links show"
              : "nav-links"
          }
        >

          {/* ADMIN ONLY */}
          {role === "admin" && (
            <NavLink
              to="/dashboard"
              onClick={closeMenu}
            >
              Dashboard
            </NavLink>
          )}

          {/* BOTH ADMIN + FACULTY */}
          <NavLink
            to="/analytics"
            onClick={closeMenu}
          >
            Analytics
          </NavLink>

          {/* FACULTY ONLY */}
          {role === "faculty" && (
            <NavLink
              to="/complaint"
              onClick={closeMenu}
            >
              Complaint
            </NavLink>
          )}

          <button
            className="logout"
            onClick={handleLogout}
          >
            Logout
          </button>

        </nav>
      </div>
    </header>
  );
}

export default Navbar;