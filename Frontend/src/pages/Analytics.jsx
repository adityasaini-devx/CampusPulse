import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import { categoryData, weeklyData, faculty } from "../data";

function Analytics() {
  const maxValue = Math.max(...weeklyData);
  const [overview, setOverview] = useState({});
  const [categories, setCategories] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      setError("");

      try {
        const [overviewData, categoryData, weeklyData, facultyData] =
          await Promise.all([
            apiRequest("/analytics/overview"),
            apiRequest("/analytics/category-distribution"),
            apiRequest("/analytics/weekly"),
            apiRequest("/analytics/faculty"),
          ]);

        setOverview(overviewData.stats || {});
        setCategories(categoryData.categories || []);
        setWeekly(weeklyData.weekly || []);
        setFaculty(facultyData.faculty || []);
      } catch (err) {
        setError(err.message || "Could not load analytics.");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="container">
          <section className="page-heading">
            <div>
              <span className="eyebrow">FACULTY OVERVIEW</span>

              <h1>Campus Analytics</h1>

              <p>Complaint insights across all faculty members.</p>
            </div>

            <div className="date-pill">Last 7 Days</div>
          </section>

          {/* Analytics cards */}

          <section className="analytics-stats">
            <div className="card analytics-stat">
              <span>Resolution Rate</span>
              <strong>94.2%</strong>
              <small>+4.8% this month</small>
            </div>

            <div className="card analytics-stat">
              <span>Average Resolution</span>
              <strong>38 min</strong>
              <small>12 min faster</small>
            </div>

            <div className="card analytics-stat">
              <span>Faculty Reports</span>
              <strong>76</strong>
              <small>Across 8 departments</small>
            </div>
          </section>

          {/* Charts */}

          <section className="analytics-grid">
            {/* Weekly chart */}

            <div className="card">
              <div className="section-header">
                <div>
                  <h2>Complaints This Week</h2>

                  <p>Complaints received each day.</p>
                </div>
              </div>

              <div className="chart">
                {weeklyData.map((value, index) => (
                  <div className="bar-column" key={index}>
                    <div
                      className="bar"
                      style={{
                        height: `${(value / maxValue) * 100}%`,
                      }}
                    >
                      <span>{value}</span>
                    </div>

                    <small>
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                    </small>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}

            <div className="card">
              <div className="section-header">
                <div>
                  <h2>Complaint Categories</h2>

                  <p>Most common faculty complaints.</p>
                </div>
              </div>

              {categoryData.map((item) => (
                <div className="category" key={item.name}>
                  <div>
                    <span>{item.name}</span>

                    <strong>{item.value}%</strong>
                  </div>

                  <div className="progress">
                    <span
                      style={{
                        width: `${item.value * 2}%`,
                      }}
                    ></span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Faculty */}

          <section className="card">
            <div className="section-header">
              <div>
                <h2>Faculty Activity</h2>

                <p>Complaints reported by faculty members.</p>
              </div>
            </div>

            <div className="faculty-grid">
              {faculty.map((person) => (
                <div className="faculty-card" key={person.name}>
                  <div className="avatar">{person.name.charAt(4)}</div>

                  <div>
                    <strong>{person.name}</strong>

                    <span>{person.department}</span>
                  </div>

                  <b>
                    {person.issues}
                    <small>reports</small>
                  </b>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default Analytics;
