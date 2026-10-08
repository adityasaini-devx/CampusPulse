import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(event) {
    event.preventDefault();

    setError("");

    // =========================
    // ADMIN LOGIN
    // =========================
    if (
      email === "admin@campus.edu" &&
      password === "admin@123"
    ) {
      localStorage.setItem("campusRole", "admin");

      navigate("/dashboard");
      return;
    }

    // =========================
    // FACULTY LOGIN
    // =========================
    if (
      email === "faculty@campus.edu" &&
      password === "faculty@123"
    ) {
      localStorage.setItem("campusRole", "faculty");

      navigate("/analytics");
      return;
    }

    // =========================
    // WRONG LOGIN
    // =========================
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
}

export default Login;