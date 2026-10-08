import { useState } from "react";
import Navbar from "../components/Navbar";

const categories = [
  "Electricity",
  "Water",
  "Internet",
  "AC",
  "Furniture",
  "Cleaning",
  "Safety",
  "Other"
];

const buildings = [
  "CSIT Building",
  "ME Block",
  "Administrative Block"
];

const severities = ["Low", "Medium", "High", "Critical"];
const affectedUsersOptions = ["1 - 5 Users", "6 - 20 Users", "21 - 50 Users", "51 - 100 Users", "100+ Users"];
const durationOptions = ["Less than 1 Hour", "1 to 8 Hours", "8 to 24 Hours", "1 to 3 Days", "More than 3 Days"];

function Complaint() {
  const [form, setForm] = useState({
    userType: "Student",
    category: "",
    building: "",
    room: "",
    severity: "",
    affectedUsers: "",
    issueDuration: "",
    description: ""
  });

  const [submitted, setSubmitted] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  function resetForm() {
    setForm({
      userType: "Student",
      category: "",
      building: "",
      room: "",
      severity: "",
      affectedUsers: "",
      issueDuration: "",
      description: ""
    });
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="success-page">
          <div className="success-card">
            <div className="success-icon">✓</div>
            <span className="eyebrow">SUCCESS</span>
            <h1>Complaint Submitted!</h1>
            <p>
              Your complaint has been successfully
              recorded for staff review.
            </p>
            <div className="ticket">
              <span>Ticket Number</span>
              <strong>CP-1048</strong>
              <small>AI analysis started</small>
            </div>
            <button
              className="primary-button"
              onClick={resetForm}
            >
              Report Another Issue
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <div className="container">
          <section className="page-heading">
            <span className="eyebrow">
              CAMPUS COMPLAINTS
            </span>
            <h1>Report an Issue</h1>
            <p>
              Tell us what needs attention.
            </p>
          </section>

          <form
            className="complaint-layout"
            onSubmit={handleSubmit}
          >
            <div className="card form-card">

              {/* User Role Toggle */}
              <div className="form-section">
                <div className="step">01</div>
                <div>
                  <h2>Who is reporting?</h2>
                  <p>Select your role on campus.</p>
                  <div className="choice-grid">
                    {["Student", "Teacher"].map((role) => (
                      <button
                        type="button"
                        key={role}
                        className={
                          form.userType === role
                            ? "choice selected"
                            : "choice"
                        }
                        onClick={() =>
                          setForm({ ...form, userType: role })
                        }
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="form-section">
                <div className="step">02</div>
                <div>
                  <h2>What is the problem?</h2>
                  <p>Select a category.</p>
                  <div className="choice-grid">
                    {categories.map((category) => (
                      <button
                        type="button"
                        key={category}
                        className={
                          form.category === category
                            ? "choice selected"
                            : "choice"
                        }
                        onClick={() =>
                          setForm({ ...form, category: category })
                        }
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="form-section">
                <div className="step">03</div>
                <div className="form-fields">
                  <h2>Where is it?</h2>
                  <p>Enter the location of the issue.</p>
                  
                  <label>
                    Building
                    <select
                      name="building"
                      value={form.building}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select building</option>
                      {buildings.map((building) => (
                        <option key={building} value={building}>
                          {building}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Room / Floor
                    <input
                      name="room"
                      value={form.room}
                      onChange={handleChange}
                      placeholder="Example: Lab 3, 2nd Floor"
                      required
                    />
                  </label>
                </div>
              </div>

              {/* Issue Details (Severity, Users, Duration) */}
              <div className="form-section">
                <div className="step">04</div>
                <div className="form-fields">
                  <h2>Issue Details</h2>
                  <p>Provide specifics to help AI routing.</p>

                  <label className="select-label">
                    Severity
                    <select
                      name="severity"
                      value={form.severity}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select severity</option>
                      {severities.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="select-label">
                    Number of Affected Users
                    <select
                      name="affectedUsers"
                      value={form.affectedUsers}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select affected users</option>
                      {affectedUsersOptions.map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="select-label">
                    Issue Duration
                    <select
                      name="issueDuration"
                      value={form.issueDuration}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select issue duration</option>
                      {durationOptions.map((duration) => (
                        <option key={duration} value={duration}>
                          {duration}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="form-section">
                <div className="step">05</div>
                <div className="form-fields">
                  <h2>Describe the issue</h2>
                  <p>Explain what happened.</p>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Example: The AC has stopped cooling..."
                    required
                  />
                </div>
              </div>

              {/* Photo */}
              <div className="form-section">
                <div className="step">06</div>
                <div>
                  <h2>
                    Add a photo
                    <small> optional</small>
                  </h2>
                  <p>Add a photo if it helps explain the issue.</p>
                  <input
                    type="file"
                    accept="image/*"
                  />
                </div>
              </div>

              <button
                className="primary-button submit-button"
                type="submit"
              >
                Submit Complaint →
              </button>
            </div>

            {/* Tips */}
            <aside className="card tips-card">
              <span className="eyebrow">QUICK GUIDE</span>
              <h2>Better reports get faster resolutions.</h2>
              <ul>
                <li>Ensure you select your correct role (Teacher/Student).</li>
                <li>Select the correct category & severity.</li>
                <li>Mention the exact location.</li>
                <li>Explain the problem clearly.</li>
                <li>Add a photo if useful.</li>
              </ul>
            </aside>
          </form>
        </div>
      </main>
    </>
  );
}

export default Complaint;