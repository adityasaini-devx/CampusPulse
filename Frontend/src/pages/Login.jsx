import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");

    if (loading) return;

    setLoading(true);

    try {
      const data = await apiRequest(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        },
        ""
      );

      // Validate the login response before saving anything.
      if (!data?.token || !data?.user?.role) {
        throw new Error(
          "Login response is missing the token or user role."
        );
      }

      // Normalize the role in case the backend returns uppercase.
      const role = String(data.user.role).trim().toLowerCase();

      // Only allow roles supported by the web dashboard.
      if (!["admin", "faculty"].includes(role)) {
        throw new Error(
          "This account cannot access the web dashboard."
        );
      }

      // Save the session only after validation succeeds.
      localStorage.setItem("campusToken", data.token);
      localStorage.setItem("campusRole", role);
      localStorage.setItem(
        "campusUser",
        JSON.stringify({
          ...data.user,
          role,
        })
      );

      // Redirect according to the user's role.
      if (role === "admin") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/analytics", { replace: true });
      }
    } catch (err) {
      setError(
        err.message || "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-overlay">
          <div className="login-logo">
            <img
              src="/logo.png"
              alt="CampusPulse"
              className="brand-logo"
            />

            <div>
              <strong>CampusPulse</strong>
              <span>SMART CAMPUS</span>
            </div>
          </div>

          <div className="login-message">
            <span className="eyebrow">CAMPUS OPERATIONS</span>

            <h1>
              Smarter Campus.
              <br />
              Faster Resolution.
            </h1>

            <p>
              One simple platform for reporting, managing and
              understanding campus maintenance.
            </p>
          </div>
        </div>
      </section>

      <section className="login-form-area">
        <Link to="/signup" className="signup-top-button">
          Sign Up
        </Link>

        <div className="login-form">
          <span className="eyebrow">WELCOME BACK</span>

          <h2>Log in to CampusPulse</h2>

          <p className="muted">
            Access your campus services.
          </p>

          <form onSubmit={handleLogin}>
            <label htmlFor="login-email">
              Email Address
            </label>

            <input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />

            <label htmlFor="login-password">
              Password
            </label>

            <input
              id="login-password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading && (
                <span
                  className="button-spinner"
                  aria-hidden="true"
                />
              )}

              {loading ? "Signing In..." : "Sign In →"}
            </button>
          </form>

          <div className="demo-box">
            <strong>Demo Accounts</strong>

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
