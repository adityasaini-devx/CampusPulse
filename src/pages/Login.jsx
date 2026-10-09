import React from "react";
import { useState } from "react";
//import { useNavigate } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  
async function handleLogin(event) {
  event.preventDefault();
  setError("");

  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem("campusToken", data.token);
    localStorage.setItem("campusRole", data.user.role);
    localStorage.setItem("campusUser", JSON.stringify(data.user));

    if (data.user.role === "admin") {
      navigate("/dashboard");
    } else {
      navigate("/analytics");
    }
  } catch (error) {
    setError(error.message);
  }
}
  // ADMIN LOGIN
  if (
    email === "admin@campus.edu" &&
    password === "admin123"
  ) {
    localStorage.setItem("campusRole", "admin");

    navigate("/dashboard");
    return;
  }

  // DEFAULT FACULTY LOGIN
  if (
    email === "faculty@campus.edu" &&
    password === "faculty123"
  ) {
    localStorage.setItem("campusRole", "faculty");

    navigate("/analytics");
    return;
  }

  // REGISTERED USERS
  const users =
    JSON.parse(localStorage.getItem("campusUsers")) || [];

  const user = users.find(
    (item) =>
      item.email.toLowerCase() ===
        email.toLowerCase() &&
      item.password === password
  );

  if (user) {
    localStorage.setItem("campusRole", "faculty");
    localStorage.setItem(
      "campusUser",
      JSON.stringify(user)
    );

    navigate("/analytics");
    return;
  }

  // WRONG LOGIN
  setError("Invalid email or password.");
}

  return (
    <main className="login-page">

      {/* LEFT SIDE */}
      <section className="login-visual">

        <div className="login-overlay">

          <div className="login-logo">

            <div className="logo-icon">
              CP
            </div>

            <div>
              <strong>CampusPulse</strong>
              <span>SMART CAMPUS</span>
            </div>

          </div>

          <div className="login-message">

            <span className="eyebrow">
              CAMPUS OPERATIONS
            </span>

            <h1>
              Smarter Campus.
              <br />
              Faster Resolution.
            </h1>

            <p>
              One simple platform for reporting,
              managing and understanding campus
              maintenance.
            </p>

          </div>

        </div>

      </section>


      {/* RIGHT SIDE */}
      <section className="login-form-area">
        <Link
          to="/signup"
          className="signup-top-button"
        >
          Sign Up
        </Link>

        <div className="login-form">

          <span className="eyebrow">
            WELCOME BACK
          </span>

          <h2>
            Sign in to CampusPulse
          </h2>

          <p className="muted">
            Access your campus services.
          </p>


          <form onSubmit={handleLogin}>

            {/* EMAIL */}
            <label>
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />


            {/* PASSWORD */}
            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />


            {/* ERROR MESSAGE */}
            {error && (
              <p className="login-error">
                {error}
              </p>
            )}


            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="primary-button"
            >
              Sign In →
            </button>

          </form>


          {/* DEMO LOGIN */}
          <div className="demo-box">

            <strong>
              Demo Accounts
            </strong>

            <p>
              <b>Admin:</b>
              <br />
              admin@campus.edu
              <br />
              Password: admin@123
            </p>

            <p>
              <b>Faculty:</b>
              <br />
              faculty@campus.edu
              <br />
              Password: faculty@123
            </p>

          </div>

        </div>

      </section>

    </main>
  );


export default Login;