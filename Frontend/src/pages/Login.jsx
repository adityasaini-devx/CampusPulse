import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    if (loading) return;

    setError("");
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

      if (!data?.token || !data?.user?.role) {
        throw new Error(
          "Invalid login response. Token or user role is missing."
        );
      }

      const role = String(data.user.role).trim().toLowerCase();

      if (!["admin", "faculty"].includes(role)) {
        throw new Error(
          "This account cannot access the web dashboard."
        );
      }

      localStorage.setItem("campusToken", data.token);
      localStorage.setItem("campusRole", role);
      localStorage.setItem(
        "campusUser",
        JSON.stringify({
          ...data.user,
          role,
        })
      );

      if (role === "admin") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/analytics", { replace: true });
      }
    } catch (err) {
      setError(
        err.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-overlay">
          <Link to="/" className="login-logo">
            <span className="brand-mark">C</span>

            <span className="brand-text">
              <strong>CampusPulse</strong>
              <small>SMART CAMPUS</small>
            </span>
          </Link>

          <div className="login-message">
            <span className="eyebrow">CAMPUS OPERATIONS</span>

            <h1>
              Smarter Campus.
              <br />
              Faster Resolution.
            </h1>

            <p>
              One simple platform for reporting, managing, and
              tracking campus maintenance issues.
            </p>

            <div className="login-feature-list">
              <div>
                <span className="feature-check">✓</span>
                Easy complaint management
              </div>

              <div>
                <span className="feature-check">✓</span>
                Real-time complaint tracking
              </div>

              <div>
                <span className="feature-check">✓</span>
                Data-driven campus insights
              </div>
            </div>
          </div>

          <p className="login-footer-text">
            Making campus services work better.
          </p>
        </div>
      </section>

      <section className="login-form-area">
        <Link to="/signup" className="signup-top-button">
          Create Account
        </Link>

        <div className="login-form">
          <div className="login-mobile-brand">
            <span className="brand-mark">C</span>
            <strong>CampusPulse</strong>
          </div>

          <span className="eyebrow">WELCOME BACK</span>

          <h2>Log in to CampusPulse</h2>

          <p className="muted">
            Enter your account details to continue.
          </p>

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label htmlFor="login-email">
                Email Address
              </label>

              <input
                id="login-email"
                type="email"
                name="email"
                placeholder="you@campus.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <div className="password-label-row">
                <label htmlFor="login-password">
                  Password
                </label>
              </div>

              <div className="password-input-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  disabled={loading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <span aria-hidden="true">!</span>
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="primary-button login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner" />
                  Signing in...
                </>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          <div className="login-bottom-text">
            Need an account?{" "}
            <Link to="/signup">Sign up</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;