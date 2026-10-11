import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import ComplaintTable from "../components/ComplaintTable";

import { apiRequest } from "../api";

function Dashboard() {
  // Store complaints received from the backend
  const [complaints, setComplaints] = useState([]);

  // Store live dashboard statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    critical: 0,
    resolved: 0,
    resolutionRate: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  // Get the login token
  const token = localStorage.getItem("campusToken") || "";

  // Fetch complaints and statistics from the backend
  const loadDashboard = useCallback(
    async ({ showLoading = true } = {}) => {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

      if (!token) {
        setError("Your session has expired. Please log in again.");

        if (showLoading) {
          setLoading(false);
        }

        return;
      }

      try {
        const [complaintData, overviewData] = await Promise.all([
          apiRequest(
            "/complaints?limit=100",
            {},
            token
          ),

          apiRequest(
            "/analytics/overview",
            {},
            token
          ),
        ]);

        // Save the complaint list
        setComplaints(
          Array.isArray(complaintData.complaints)
            ? complaintData.complaints
            : []
        );

        // Save the statistics returned by the backend
        setStats((previousStats) => ({
          ...previousStats,
          ...(overviewData.stats || {}),
        }));
      } catch (err) {
        setError(
          err.message || "Could not load dashboard data."
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [token]
  );

  // Load dashboard data when the page opens
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Mark a complaint as resolved in the backend
  async function handleMarkDone(id) {
    if (!id) {
      setError("Complaint ID is missing.");
      return;
    }

    setBusyId(id);
    setError("");

    try {
      await apiRequest(
        `/complaints/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: "Resolved",
          }),
        },
        token
      );

      // Refresh complaints and statistics after updating
      await loadDashboard({ showLoading: false });
    } catch (err) {
      setError(
        err.message || "Could not update the complaint."
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="container">

          {/* PAGE HEADING */}

          <section className="page-heading">
            <div>
              <span className="eyebrow">
                ADMINISTRATION
              </span>

              <h1>Campus Dashboard</h1>

              <p>
                Monitor complaints and campus maintenance activity.
              </p>
            </div>

            <div className="system-status">
              <span></span>
              All systems operational
            </div>
          </section>

          {/* ERROR MESSAGE */}

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          {/* STATISTICS */}

          <section className="stats-grid">
            <StatCard
              title="Total Complaints"
              value={stats.total}
              description="All recorded complaints"
              icon="▣"
            />

            <StatCard
              title="Active Issues"
              value={stats.active}
              description="Not yet resolved"
              icon="◷"
            />

            <StatCard
              title="Critical Issues"
              value={stats.critical}
              description="Unresolved critical complaints"
              icon="!"
            />

            <StatCard
              title="Resolved"
              value={stats.resolved}
              description={`${stats.resolutionRate}% resolution rate`}
              icon="✓"
            />
          </section>

          {/* MAIN DASHBOARD */}

          <section className="dashboard-grid">

            {/* RECENT COMPLAINTS */}

            <div className="card">
              <div className="section-header">
                <div>
                  <h2>Recent Complaints</h2>

                  <p>
                    Latest maintenance requests.
                  </p>
                </div>

                <Link to="/analytics">
                  View analytics
                </Link>
              </div>

              {loading ? (
                <p>Loading complaints...</p>
              ) : (
                <ComplaintTable
                  complaints={complaints}
                  onMarkDone={handleMarkDone}
                  busyId={busyId}
                />
              )}
            </div>

            {/* DEMO AI INSIGHT */}

            <div className="card ai-card">
              <span className="ai-label">
                ✦ DEMO AI INSIGHT
              </span>

              <h2>
                Electrical complaints are rising.
              </h2>

              <p>
                CSE Block has received 32% more
                electrical complaints this week.
              </p>

              <div className="recommendation">
                <small>
                  RECOMMENDED ACTION
                </small>

                <strong>
                  Schedule an electrical inspection.
                </strong>
              </div>

              <span className="priority">
                HIGH PRIORITY · 91/100
              </span>
            </div>

          </section>

          {/* BOTTOM SECTION */}

          <section className="dashboard-grid">

            {/* CAMPUS HEALTH */}

            <div className="card">
              <div className="section-header">
                <div>
                  <h2>Campus Health</h2>

                  <p>
                    Overall campus condition.
                  </p>
                </div>

                <strong className="health-score">
                  87
                </strong>
              </div>

              {[
                ["Electricity", 92],
                ["Water", 81],
                ["Internet", 90],
                ["Cleanliness", 88],
                ["Safety", 95],
              ].map(([name, value]) => (
                <div
                  className="health-row"
                  key={name}
                >
                  <div>
                    <span>{name}</span>

                    <strong>{value}%</strong>
                  </div>

                  <div className="progress">
                    <span
                      style={{
                        width: `${value}%`,
                      }}
                    ></span>
                  </div>
                </div>
              ))}
            </div>

            {/* RECENT ACTIVITY — DEMO DATA */}

            <div className="card">
              <div className="section-header">
                <div>
                  <h2>Today's Activity</h2>

                  <p>
                    Recent campus actions.
                  </p>
                </div>
              </div>

              <div className="activity">
                <div>
                  <span className="dot green"></span>

                  <p>
                    <strong>Complaint resolved</strong>

                    <small>
                      Recent maintenance update
                    </small>
                  </p>
                </div>

                <div>
                  <span className="dot orange"></span>

                  <p>
                    <strong>Complaint assigned</strong>

                    <small>
                      Maintenance team activity
                    </small>
                  </p>
                </div>

                <div>
                  <span className="dot blue"></span>

                  <p>
                    <strong>Complaint received</strong>

                    <small>
                      New campus maintenance request
                    </small>
                  </p>
                </div>
              </div>
            </div>

          </section>

        </div>
      </main>
    </>
  );
}

export default Dashboard;