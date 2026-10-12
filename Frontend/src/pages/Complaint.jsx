import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { apiRequest } from "../api";

const categories = [
  "Electricity",
  "Water",
  "Internet",
  "AC",
  "Furniture",
  "Cleaning",
  "Safety",
  "Other",
];

const buildings = [
  "CSIT Building",
  "ME Block",
  "Administrative Block",
];

const severities = ["Low", "Medium", "High", "Critical"];

const affectedUsersOptions = [
  "1 - 5 Users",
  "6 - 20 Users",
  "21 - 50 Users",
  "51 - 100 Users",
  "100+ Users",
];

const durationOptions = [
  "Less than 1 Hour",
  "1 to 8 Hours",
  "8 to 24 Hours",
  "1 to 3 Days",
  "More than 3 Days",
];

const initialForm = {
  title: "",
  userType: "Teacher",
  category: "",
  building: "",
  room: "",
  severity: "",
  affectedUsers: "",
  issueDuration: "",
  description: "",
};

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function Complaint() {
  const [form, setForm] = useState({ ...initialForm });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(null);

  const fileInputRef = useRef(null);
  const previewRef = useRef("");

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  function clearPhotoPreview() {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = "";
    }

    setPhotoPreview("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    setError("");
    clearPhotoPreview();
    setPhoto(null);

    if (!file) {
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("The photo must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    previewRef.current = previewUrl;
    setPhoto(file);
    setPhotoPreview(previewUrl);
  }

  function removePhoto() {
    clearPhotoPreview();
    setPhoto(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function resetForm() {
    clearPhotoPreview();
    setForm({ ...initialForm });
    setPhoto(null);
    setError("");
    setLoading(false);
    setSubmitted(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");

    if (!form.category) {
      setError("Please select a complaint category.");
      return;
    }

    if (!form.building) {
      setError("Please select a building.");
      return;
    }

    if (!form.severity) {
      setError("Please select the issue severity.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please describe the issue.");
      return;
    }

    setLoading(true);

    try {
      const title =
        form.title.trim() ||
        `${form.category} issue in ${form.room.trim() || form.building}`;

      let result;

      if (photo) {
        const body = new FormData();

        Object.entries({
          ...form,
          title,
          description: form.description.trim(),
        }).forEach(([key, value]) => {
          body.append(key, value);
        });

        body.append("photo", photo);

        result = await apiRequest("/complaints", {
          method: "POST",
          body,
        });
      } else {
        result = await apiRequest("/complaints", {
          method: "POST",
          body: JSON.stringify({
            ...form,
            title,
            description: form.description.trim(),
          }),
        });
      }

      const complaint =
        result?.complaint ||
        result?.data?.complaint ||
        result?.data ||
        result;

      setSubmitted(complaint || {});
    } catch (err) {
      setError(
        err.message || "Could not submit the complaint. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    const ticketNumber =
      submitted.ticketId ||
      submitted.ticketNumber ||
      submitted.complaintId ||
      submitted._id ||
      submitted.id;

    return (
      <>
        <Navbar />

        <main className="success-page">
          <div className="success-card">
            <div className="success-icon">✓</div>

            <span className="eyebrow">SUCCESS</span>

            <h1>Complaint Submitted!</h1>

            <p>
              Your complaint has been successfully recorded for staff review.
            </p>

            <div className="ticket">
              <span>Ticket Number</span>

              <strong>
                {ticketNumber || "Submitted successfully"}
              </strong>

              <small>Complaint received for review</small>
            </div>

            <button
              type="button"
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
            <span className="eyebrow">CAMPUS COMPLAINTS</span>
            <h1>Report an Issue</h1>
            <p>Tell us what needs attention.</p>
          </section>

          {error && (
            <div
              role="alert"
              className="complaint-error"
              style={{
                marginBottom: "16px",
                padding: "12px 16px",
                borderRadius: "8px",
                background: "#fee2e2",
                color: "#991b1b",
              }}
            >
              {error}
            </div>
          )}

          <form
            className="complaint-layout"
            onSubmit={handleSubmit}
          >
            <div className="card form-card">
              <div className="form-section">
                <span className="step">01</span>

                <div className="section-content">
                  <h2>Complaint Title</h2>
                  <p>A short title helps staff understand the issue.</p>

                  <label htmlFor="complaint-title">
                    Title <span>(optional)</span>
                  </label>

                  <input
                    id="complaint-title"
                    name="title"
                    type="text"
                    placeholder="e.g. Projector not working"
                    value={form.title}
                    onChange={handleChange}
                    maxLength={150}
                  />
                </div>
              </div>

              <div className="form-section">
                <span className="step">02</span>

                <div className="section-content">
                  <h2>Your Role</h2>

                  <div className="radio-group">
                    {["Student", "Teacher"].map((role) => (
                      <label key={role} className="radio-option">
                        <input
                          type="radio"
                          name="userType"
                          value={role}
                          checked={form.userType === role}
                          onChange={handleChange}
                        />

                        <span>{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <span className="step">03</span>

                <div className="section-content">
                  <h2>Issue Category</h2>

                  <label htmlFor="complaint-category">
                    Category *
                  </label>

                  <select
                    id="complaint-category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select category</option>

                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <label htmlFor="complaint-severity">
                    Severity *
                  </label>

                  <select
                    id="complaint-severity"
                    name="severity"
                    value={form.severity}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select severity</option>

                    {severities.map((severity) => (
                      <option key={severity} value={severity}>
                        {severity}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <span className="step">04</span>

                <div className="section-content">
                  <h2>Issue Location</h2>

                  <label htmlFor="complaint-building">
                    Building *
                  </label>

                  <select
                    id="complaint-building"
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

                  <label htmlFor="complaint-room">
                    Room / Location
                  </label>

                  <input
                    id="complaint-room"
                    name="room"
                    type="text"
                    placeholder="e.g. Room 204"
                    value={form.room}
                    onChange={handleChange}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="form-section">
                <span className="step">05</span>

                <div className="section-content">
                  <h2>Issue Impact</h2>

                  <label htmlFor="complaint-affected">
                    People Affected
                  </label>

                  <select
                    id="complaint-affected"
                    name="affectedUsers"
                    value={form.affectedUsers}
                    onChange={handleChange}
                  >
                    <option value="">Select number of people</option>

                    {affectedUsersOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <label htmlFor="complaint-duration">
                    How long has this issue existed?
                  </label>

                  <select
                    id="complaint-duration"
                    name="issueDuration"
                    value={form.issueDuration}
                    onChange={handleChange}
                  >
                    <option value="">Select duration</option>

                    {durationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <span className="step">06</span>

                <div className="section-content">
                  <h2>Describe the Issue</h2>

                  <label htmlFor="complaint-description">
                    Description *
                  </label>

                  <textarea
                    id="complaint-description"
                    name="description"
                    rows={5}
                    placeholder="Explain what happened, where it happened, and what needs to be fixed..."
                    value={form.description}
                    onChange={handleChange}
                    required
                    maxLength={3000}
                  />

                  <small>
                    {form.description.length}/3000 characters
                  </small>
                </div>
              </div>

              <div className="form-section">
                <span className="step">07</span>

                <div className="section-content">
                  <h2>Attach a Photo</h2>

                  <p>
                    Upload a JPG, PNG, or WebP image (maximum 5 MB).
                  </p>

                  <label htmlFor="complaint-photo">
                    Select Photo
                  </label>

                  <input
                    id="complaint-photo"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                  />

                  {photo && (
                    <div className="photo-preview">
                      {photoPreview && (
                        <img
                          src={photoPreview}
                          alt="Complaint preview"
                          style={{
                            display: "block",
                            maxWidth: "100%",
                            maxHeight: "240px",
                            objectFit: "contain",
                            marginTop: "12px",
                          }}
                        />
                      )}

                      <p>{photo.name}</p>

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={removePhoto}
                      >
                        Remove Photo
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Submitting Complaint..."
                    : "Submit Complaint →"}
                </button>
              </div>
            </div>

            <aside className="card tips-card">
              <span className="eyebrow">QUICK GUIDE</span>

              <h2>Better reports get faster resolutions.</h2>

              <ul>
                <li>Give the issue a clear and specific title.</li>
                <li>Select the correct category and severity.</li>
                <li>Include the building and room number.</li>
                <li>Explain when the problem started.</li>
                <li>Attach a photo if it helps show the issue.</li>
              </ul>
            </aside>
          </form>
        </div>
      </main>
    </>
  );
}

export default Complaint;
