
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { apiRequest } from "../api";

function Analytics() {
  const [overview, setOverview] = useState({});
  const [categories, setCategories] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      setLoading(true);
      setError("");

      try {
        const [
          overviewData,
          categoryData,
          weeklyData,
          facultyData,
        ] = await Promise.all([
          apiRequest("/analytics/overview"),
          apiRequest("/analytics/category-distribution"),
          apiRequest("/analytics/weekly"),
          apiRequest("/analytics/faculty"),
        ]);

        if (cancelled) return;

        setOverview(overviewData.stats || {});
        setCategories(categoryData.categories || []);
        setWeekly(weeklyData.weekly || []);
        setFaculty(facultyData.faculty || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load analytics.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  const maxWeekly = Math.max(
    1,
    ...weekly.map((item) => Number(item.count) || 0)
  );

  const facultyReports = faculty.reduce(
    (total, person) => total + (Number(person.issues) || 0),
    0
  );

  const averageHours = Number(
    overview.averageResolutionTimeHours
  ) || 0;

  const averageResolution =
    averageHours >= 1
      ? `${averageHours.toFixed(1)} hrs`
      : `${Math.round(averageHours * 60)} min`;

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="container">
          <section className="page-heading">
            <div>
              <span className="eyebrow">FACULTY OVERVIEW</span>
              <h1>Campus Analytics</h1>
              <p>
                Insights calculated from actual campus complaints.
              </p>
            </div>

            <div className="date-pill">Last 7 Days</div>
          </section>

          {loading && (
            <div className="card" role="status">
              Loading analytics from the server...
            </div>
          )}

          {error && (
            <div className="card" role="alert">
              <h3>Unable to load analytics</h3>
              <p>{error}</p>
              <button
                type="button"
                className="primary-button"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Live summary cards */}
              <section className="analytics-stats">
                <div className="card analytics-stat">
                  <span>Total Complaints</span>
                  <strong>{overview.total ?? 0}</strong>
                  <small>All recorded complaints</small>
                </div>

                <div className="card analytics-stat">
                  <span>Resolution Rate</span>
                  <strong>
                    {overview.resolutionRate ?? 0}%
                  </strong>
                  <small>
                    {overview.resolved ?? 0} resolved
                  </small>
                </div>

                <div className="card analytics-stat">
                  <span>Active Complaints</span>
                  <strong>{overview.active ?? 0}</strong>
                  <small>
                    {overview.critical ?? 0} critical unresolved
                  </small>
                </div>

                <div className="card analytics-stat">
                  <span>Average Resolution</span>
                  <strong>{averageResolution}</strong>
                  <small>For resolved complaints with valid dates</small>
                </div>

                <div className="card analytics-stat">
                  <span>Faculty Reports</span>
                  <strong>{facultyReports}</strong>
                  <small>Reports from listed faculty members</small>
                </div>
              </section>

              {/* Charts */}
              <section className="analytics-grid">
                {/* Weekly complaint chart */}
                <div className="card">
                  <div className="section-header">
                    <div>
                      <h2>Complaints This Week</h2>
                      <p>Actual complaints received each day.</p>
                    </div>
                  </div>

                  {weekly.length === 0 ? (
                    <p>No weekly data available.</p>
                  ) : (
                    <div className="chart">
                      {weekly.map((item) => {
                        const count = Number(item.count) || 0;

                        return (
                          <div
                            className="bar-column"
                            key={item.date}
                          >
                            <div
                              className="bar"
                              style={{
                                height: `${
                                  (count / maxWeekly) * 100
                                }%`,
                                minHeight: count > 0 ? "4px" : "0",
                              }}
                            >
                              <span>{count}</span>
                            </div>

                            <small>{item.day}</small>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Category distribution */}
                <div className="card">
                  <div className="section-header">
                    <div>
                      <h2>Complaint Categories</h2>
                      <p>Distribution by actual category.</p>
                    </div>
                  </div>

                  {categories.length === 0 ? (
                    <p>No category data available.</p>
                  ) : (
                    categories.map((item) => (
                      <div
                        className="category"
                        key={item.name}
                      >
                        <div>
                          <span>{item.name || "Other"}</span>
                          <strong>
                            {item.percent ?? 0}%
                            {" "}({item.count ?? 0})
                          </strong>
                        </div>

                        <div className="progress">
                          <span
                            style={{
                              width: `${Math.min(
                                100,
                                Number(item.percent) || 0
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Faculty activity */}
              <section className="card">
                <div className="section-header">
                  <div>
                    <h2>Faculty Activity</h2>
                    <p>
                      Complaint reports grouped by faculty member.
                    </p>
                  </div>
                </div>

                {faculty.length === 0 ? (
                  <p>No faculty complaint activity found.</p>
                ) : (
                  <div className="faculty-grid">
                    {faculty.map((person) => (
                      <div
                        className="faculty-card"
                        key={person.name}
                      >
                        <div className="avatar">
                          {(person.name || "F")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>{person.name}</strong>
                          <span>
                            {person.department || "No department"}
                          </span>
                        </div>

                        <b>
                          {person.issues}
                          <small> reports</small>
                        </b>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default Analytics;
