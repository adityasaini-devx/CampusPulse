import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { apiRequest } from "../api";

function getNumber(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return null;
}

function formatDuration(minutes) {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) {
    return "N/A";
  }

  if (minutes < 0) {
    return "N/A";
  }

  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (hours < 24) {
    return remainingMinutes
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours
    ? `${days}d ${remainingHours}h`
    : `${days}d`;
}

function getPayload(response) {
  return response?.data ?? response;
}

function Analytics() {
  const [overview, setOverview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [faculty, setFaculty] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      setLoading(true);
      setErrors([]);

      const endpoints = [
        {
          name: "Overview",
          path: "/analytics/overview",
        },
        {
          name: "Category distribution",
          path: "/analytics/category-distribution",
        },
        {
          name: "Weekly analytics",
          path: "/analytics/weekly",
        },
        {
          name: "Faculty analytics",
          path: "/analytics/faculty",
        },
      ];

      const results = await Promise.allSettled(
        endpoints.map((endpoint) => apiRequest(endpoint.path))
      );

      if (cancelled) return;

      const nextErrors = [];

      results.forEach((result, index) => {
        const endpoint = endpoints[index];

        if (result.status === "rejected") {
          nextErrors.push(
            `${endpoint.name}: ${result.reason?.message || "Unable to load data"}`
          );
          return;
        }

        const payload = getPayload(result.value);

        if (index === 0) {
          setOverview(payload?.overview ?? payload?.stats ?? payload);
        }

        if (index === 1) {
          const list = Array.isArray(payload)
            ? payload
            : payload?.categories ??
              payload?.categoryDistribution ??
              payload?.distribution ??
              [];

          setCategories(Array.isArray(list) ? list : []);
        }

        if (index === 2) {
          const list = Array.isArray(payload)
            ? payload
            : payload?.weekly ??
              payload?.data ??
              payload?.results ??
              [];

          setWeekly(Array.isArray(list) ? list : []);
        }

        if (index === 3) {
          const list = Array.isArray(payload)
            ? payload
            : payload?.faculty ??
              payload?.staff ??
              payload?.data ??
              [];

          setFaculty(Array.isArray(list) ? list : []);
        }
      });

      setErrors(nextErrors);
      setLoading(false);
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalComplaints = getNumber(
    overview?.totalComplaints,
    overview?.total,
    overview?.complaintsCount
  );

  const resolvedComplaints = getNumber(
    overview?.resolvedComplaints,
    overview?.resolved,
    overview?.resolvedCount
  );

  const pendingComplaints = getNumber(
    overview?.pendingComplaints,
    overview?.pending,
    overview?.pendingCount
  );

  const resolutionRate =
    getNumber(
      overview?.resolutionRate,
      overview?.resolvedPercentage
    ) ??
    (totalComplaints > 0 && resolvedComplaints !== null
      ? (resolvedComplaints / totalComplaints) * 100
      : null);

  // The backend's averageResolutionTimeHours field is in hours.
  const averageResolutionHours = getNumber(
    overview?.averageResolutionTimeHours
  );

  const averageResolutionMinutes = getNumber(
    overview?.averageResolutionMinutes,
    overview?.avgResolutionMinutes
  );

  const averageResolution =
    averageResolutionHours !== null
      ? averageResolutionHours * 60
      : averageResolutionMinutes;

  const normalizedCategories = categories.map((item, index) => ({
    name:
      item.name ||
      item.category ||
      item._id ||
      `Category ${index + 1}`,
    value:
      getNumber(
        item.percent,
        item.percentage,
        item.value,
        item.count,
        item.total
      ) ?? 0,
    count: getNumber(item.count, item.total, item.complaints),
  }));

  const categoryTotal = normalizedCategories.reduce(
    (sum, item) => sum + (item.count ?? item.value),
    0
  );

  const normalizedWeekly = weekly.map((item, index) => ({
    label:
      item.day ||
      item.date ||
      item.week ||
      item.label ||
      `Day ${index + 1}`,
    complaints: getNumber(
      item.complaints,
      item.count,
      item.total
    ) ?? 0,
    resolved: getNumber(
      item.resolved,
      item.resolvedCount
    ) ?? 0,
  }));

  const normalizedFaculty = faculty.map((item, index) => ({
    name:
      item.name ||
      item.facultyName ||
      item.email ||
      `Faculty ${index + 1}`,
    resolved: getNumber(
      item.resolved,
      item.resolvedCount,
      item.totalResolved
    ) ?? 0,
    pending: getNumber(
      item.pending,
      item.pendingCount
    ) ?? 0,
  }));

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page">
          <div className="container">
            <section className="page-heading">
              <span className="eyebrow">CAMPUS INSIGHTS</span>
              <h1>Analytics Dashboard</h1>
              <p>Loading the latest campus data...</p>
            </section>
            <div className="card">
              <p role="status">Fetching analytics...</p>
            </div>
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
            <span className="eyebrow">CAMPUS INSIGHTS</span>
            <h1>Analytics Dashboard</h1>
            <p>
              Track complaint trends, resolution performance, and
              campus service quality.
            </p>
          </section>

          {errors.length > 0 && (
            <div
              role="alert"
              className="complaint-error"
              style={{
                padding: "12px 16px",
                marginBottom: "20px",
                borderRadius: "8px",
                background: "#fee2e2",
                color: "#991b1b",
              }}
            >
              <strong>Some analytics could not be loaded.</strong>
              <ul>
                {errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          <section className="stats-grid">
            <div className="card stat-card">
              <span className="eyebrow">TOTAL COMPLAINTS</span>
              <h2>{totalComplaints ?? "N/A"}</h2>
              <p>All recorded complaints</p>
            </div>

            <div className="card stat-card">
              <span className="eyebrow">RESOLVED</span>
              <h2>{resolvedComplaints ?? "N/A"}</h2>
              <p>Complaints marked resolved</p>
            </div>

            <div className="card stat-card">
              <span className="eyebrow">PENDING</span>
              <h2>{pendingComplaints ?? "N/A"}</h2>
              <p>Awaiting resolution</p>
            </div>

            <div className="card stat-card">
              <span className="eyebrow">RESOLUTION RATE</span>
              <h2>
                {resolutionRate === null
                  ? "N/A"
                  : `${resolutionRate.toFixed(1)}%`}
              </h2>
              <p>Share of complaints resolved</p>
            </div>
          </section>

          <section className="analytics-grid">
            <div className="card analytics-card">
              <span className="eyebrow">CATEGORY BREAKDOWN</span>
              <h2>Complaints by Category</h2>

              {normalizedCategories.length === 0 ? (
                <p>No category data available.</p>
              ) : (
                <div className="analytics-list">
                  {normalizedCategories.map((item) => {
                    const percentage = Math.min(
                      100,
                      Math.max(
                        0,
                        item.value <= 100
                          ? item.value
                          : categoryTotal > 0
                            ? (item.value / categoryTotal) * 100
                            : 0
                      )
                    );

                    return (
                      <div
                        className="analytics-list-item"
                        key={item.name}
                      >
                        <div className="analytics-item-heading">
                          <span>{item.name}</span>
                          <strong>
                            {item.count ?? item.value}
                          </strong>
                        </div>

                        <div
                          className="progress-track"
                          role="progressbar"
                          aria-label={`${item.name} percentage`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(percentage)}
                        >
                          <div
                            className="progress-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        <small>{percentage.toFixed(1)}%</small>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="card analytics-card">
              <span className="eyebrow">RESOLUTION PERFORMANCE</span>
              <h2>Average Resolution Time</h2>

              <div className="analytics-highlight">
                <strong>
                  {formatDuration(averageResolution)}
                </strong>
                <p>Average time to resolve a complaint</p>
              </div>
            </div>
          </section>

          <section className="analytics-grid">
            <div className="card analytics-card">
              <span className="eyebrow">RECENT TREND</span>
              <h2>Weekly Complaints</h2>

              {normalizedWeekly.length === 0 ? (
                <p>No weekly data available.</p>
              ) : (
                <div className="analytics-list">
                  {normalizedWeekly.map((item) => (
                    <div
                      className="analytics-list-item"
                      key={item.label}
                    >
                      <div className="analytics-item-heading">
                        <span>{item.label}</span>
                        <strong>{item.complaints}</strong>
                      </div>

                      <div
                        className="progress-track"
                        role="progressbar"
                        aria-label={`${item.label} complaints`}
                        aria-valuemin={0}
                        aria-valuemax={Math.max(
                          1,
                          ...normalizedWeekly.map(
                            (entry) => entry.complaints
                          )
                        )}
                        aria-valuenow={item.complaints}
                      >
                        <div
                          className="progress-fill"
                          style={{
                            width: `${
                              (item.complaints /
                                Math.max(
                                  1,
                                  ...normalizedWeekly.map(
                                    (entry) => entry.complaints
                                  )
                                )) *
                              100
                            }%`,
                          }}
                        />
                      </div>

                      <small>
                        {item.resolved} resolved
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card analytics-card">
              <span className="eyebrow">FACULTY PERFORMANCE</span>
              <h2>Resolution by Faculty</h2>

              {normalizedFaculty.length === 0 ? (
                <p>No faculty data available.</p>
              ) : (
                <div className="analytics-list">
                  {normalizedFaculty.map((item) => (
                    <div
                      className="analytics-list-item"
                      key={item.name}
                    >
                      <div className="analytics-item-heading">
                        <span>{item.name}</span>
                        <strong>{item.resolved} resolved</strong>
                      </div>

                      <small>
                        {item.pending} pending
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default Analytics;
