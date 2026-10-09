import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api";


function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    department: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });

    setError("");
    setSuccess("");
  }

  
async function handleSignup(event) {
  event.preventDefault();
  setError("");
  setSuccess("");

  try {
    await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: form.name,
        department: form.department,
        email: form.email,
        password: form.password,
        role: "faculty",
      }),
    });

    setSuccess("Account created successfully. Please sign in.");

    setTimeout(() => {
      navigate("/login");
    }, 1200);
  } catch (error) {
    setError(error.message);
  }
}
    // Get existing users
    const users =
      JSON.parse(localStorage.getItem("campusUsers")) || [];

    // Check if email already exists
    const existingUser = users.find(
      (user) =>
        user.email.toLowerCase() ===
        form.email.toLowerCase()
    );

    if (existingUser) {
      setError("An account with this email already exists.");
      return;
    }

    // Create new user
    const newUser = {
      name: form.name,
      department: form.department,
      email: form.email,
      password: form.password,
      role: "faculty"
    };

    // Save user
    users.push(newUser);

    localStorage.setItem(
      "campusUsers",
      JSON.stringify(users)
    );

    setSuccess(
      "Account created successfully. Redirecting to login..."
    );

    // Go to login after a short delay
    setTimeout(() => {
      navigate("/login");
    }, 1200);
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
              JOIN CAMPUSPULSE
            </span>

            <h1>
              Smarter Campus.
              <br />
              Better Experience.
            </h1>

            <p>
              Create your account and help make
              campus maintenance faster and simpler.
            </p>

          </div>

        </div>

      </section>


      {/* RIGHT SIDE */}
      <section className="login-form-area">

        <div className="login-form">

          <span className="eyebrow">
            CREATE ACCOUNT
          </span>

          <h2>
            Sign up for CampusPulse
          </h2>

          <p className="muted">
            Create your faculty account.
          </p>


          <form onSubmit={handleSignup}>

            {/* NAME */}
            <label>
              Full Name
            </label>

            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={form.name}
              onChange={handleChange}
              required
            />


            {/* DEPARTMENT */}
            <label>
              Department
            </label>

            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              required
            >
              <option value="">
                Select department
              </option>

              <option value="Computer Science">
                Computer Science
              </option>

              <option value="Mechanical Engineering">
                Mechanical Engineering
              </option>

              <option value="Electrical Engineering">
                Electrical Engineering
              </option>

              <option value="Civil Engineering">
                Civil Engineering
              </option>

              <option value="Artificial Intelligence">
                Artificial Intelligence
              </option>

              <option value="Other">
                Other
              </option>
            </select>


            {/* EMAIL */}
            <label>
              Email Address
            </label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />


            {/* PASSWORD */}
            <label>
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              minLength="6"
              required
            />


            {/* ERROR */}
            {error && (
              <p className="login-error">
                {error}
              </p>
            )}


            {/* SUCCESS */}
            {success && (
              <p className="signup-success">
                {success}
              </p>
            )}


            <button
              type="submit"
              className="primary-button"
            >
              Create Account →
            </button>

          </form>


          {/* LOGIN LINK */}
          <div className="signup-login-link">

            <span>
              Already have an account?
            </span>

            <Link to="/login">
              Sign In
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Signup;