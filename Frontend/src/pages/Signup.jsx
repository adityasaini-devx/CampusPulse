import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    department: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSignup(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await apiRequest(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            name: form.name.trim(),
            department: form.department,
            email: form.email.trim().toLowerCase(),
            password: form.password,
            role: "faculty",
          }),
        },
        "",
      );

      setSuccess(data.message || "Account created successfully.");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err.message || "Unable to create your account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      {/* Left visual panel */}
      <section className="login-visual">
        <div className="login-overlay">
          <div className="login-logo">
            <div className="logo-icon">CP</div>

            <div>
              <strong>CampusPulse</strong>
              <span>SMART CAMPUS</span>
            </div>
          </div>

          <div className="login-message">
            <span className="eyebrow">JOIN CAMPUSPULSE</span>

            <h1>
              Smarter Campus.
              <br />
              Better Experience.
            </h1>

            <p>
              Create your account and help make campus maintenance faster and
              simpler.
            </p>
          </div>
        </div>
      </section>

      {/* Right signup form */}
      <section className="login-form-area">
        <div className="login-form">
          <span className="eyebrow">CREATE ACCOUNT</span>

          <h2>Sign up for CampusPulse</h2>

          <p className="muted">Create your faculty account.</p>

          <form onSubmit={handleSignup}>
            <label htmlFor="signup-name">Full Name</label>

            <input
              id="signup-name"
              type="text"
              name="name"
              placeholder="Enter your name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />

            <label htmlFor="signup-department">Department</label>

            <select
              id="signup-department"
              name="department"
              value={form.department}
              onChange={handleChange}
              required
            >
              <option value="">Select department</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mechanical Engineering">
                Mechanical Engineering
              </option>
              <option value="Electrical Engineering">
                Electrical Engineering
              </option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Artificial Intelligence">
                Artificial Intelligence
              </option>
              <option value="Other">Other</option>
            </select>

            <label htmlFor="signup-email">Email Address</label>

            <input
              id="signup-email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />

            <label htmlFor="signup-password">Password</label>

            <input
              id="signup-password"
              type="password"
              name="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={6}
              required
            />

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            {success && (
              <p className="signup-success" role="status">
                {success}
              </p>
            )}

            <button type="submit" className="primary-button" disabled={loading}>
              {loading && (
                <span className="button-spinner" aria-hidden="true" />
              )}
              {loading ? "Creating Account..." : "Create Account →"}
            </button>
          </form>

          <div className="signup-login-link">
            <span>Already have an account?</span>{" "}
            <Link to="/login">Sign In</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Signup;
