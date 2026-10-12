import Navbar from "../components/Navbar";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getArray = (data, keys = []) => {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
};

const getNumber = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      const number = Number(value);
      if (Number.isFinite(number)) return number;
    }
  }

  return null;
};

const formatNumber = (value) => {
  const number = getNumber(value);
  return number === null ? "—" : number.toLocaleString();
};

const formatPercent = (value) => {
  const number = getNumber(value);
  return number === null ? "—" : `${number.toFixed(1)}%`;
};

const formatDuration = (value) => {
  const number = getNumber(value);

  if (number === null) return "—";
  if (number < 60) return `${number} min`;

  const hours = Math.floor(number / 60);
  const minutes = Math.round(number % 60);

  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
};

const normalizeOverview = (response) =>
  response?.stats || response?.overview || response?.data || response || {};

function Analytics() {
  const [overview, setOverview] = useState({});
  const [categories, setCategories] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [faculty, setFaculty] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        apiRequest("/analytics/overview"),
        apiRequest("/analytics/category-distribution"),
        apiRequest("/analytics/weekly"),
        apiRequest("/analytics/faculty"),
      ]);

      const [overviewResult, categoryResult, weeklyResult, facultyResult] =
        results;

      const failedRequests = [];

      if (overviewResult.status === "fulfilled") {
        setOverview(normalizeOverview(overviewResult.value));
      } else {
        setOverview({});
        failedRequests.push("overview");
      }

      if (categoryResult.status === "fulfilled") {
        setCategories(
          getArray(categoryResult.value, [
            "categories",
            "categoryData",
            "data",
          ]),
        );
      } else {
        setCategories([]);
        failedRequests.push("categories");
      }

      if (weeklyResult.status === "fulfilled") {
        setWeekly(
          getArray(weeklyResult.value, ["weekly", "weeklyData", "data"]),
        );
      } else {
        setWeekly([]);
        failedRequests.push("weekly complaints");
      }

      if (facultyResult.status === "fulfilled") {
        setFaculty(
          getArray(facultyResult.value, ["faculty", "facultyData", "data"]),
        );
      } else {
        setFaculty([]);
        failedRequests.push("faculty activity");
      }

      if (failedRequests.length > 0) {
        setError(
          `Some analytics could not be loaded: ${failedRequests.join(
            ", ",
          )}. Please check the backend and try again.`,
        );
      }
    } catch (err) {
      setError(err.message || "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Overview statistics
  const totalComplaints = getNumber(
    overview.totalComplaints,
    overview.total,
    overview.totalIssues,
    overview.totalReports,
  );

  const resolvedComplaints = getNumber(
    overview.resolvedComplaints,
    overview.resolved,
    overview.completedComplaints,
  );

  const resolutionRate = getNumber(
    overview.resolutionRate,
    overview.resolvedPercentage,
    totalComplaints > 0 && resolvedComplaints !== null
      ? (resolvedComplaints / totalComplaints) * 100
      : null,
  );

  const averageResolutionHours = getNumber(overview.averageResolutionTimeHours);

  const averageResolutionMinutes = getNumber(
    overview.averageResolutionMinutes,
    overview.avgResolutionMinutes,
    overview.averageResolutionTime,
    overview.avgResolutionTime,
  );

  const averageResolution =
    averageResolutionHours !== null
      ? averageResolutionHours * 60
      : averageResolutionMinutes;

  const facultyCount = getNumber(
    overview.totalFaculty,
    overview.facultyCount,
    overview.totalFacultyMembers,
  );

  const normalizedWeekly = weekly.map((item, index) => {
    if (typeof item === "number") {
      return {
        label: DAYS[index] || `Day ${index + 1}`,
        value: item,
      };
    }

    return {
      label:
        item.day ||
        item.label ||
        item.dateLabel ||
        DAYS[index] ||
        `Day ${index + 1}`,
      value:
        getNumber(
          item.count,
          item.total,
          item.complaints,
          item.value,
          item.complaintCount,
        ) ?? 0,
    };
  });

  const maxWeeklyValue = Math.max(
    1,
    ...normalizedWeekly.map((item) => item.value),
  );

  const normalizedCategories = categories.map((item, index) => ({
    name: item.name || item.category || item._id || `Category ${index + 1}`,
    value:
      getNumber(
        item.percent,
        item.percentage,
        item.value,
        item.count,
        item.total,
      ) ?? 0,
    count: getNumber(item.count, item.total, item.complaints),
  }));

  const categoryTotal = normalizedCategories.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  const normalizedFaculty = faculty.map((person, index) => ({
    name:
      person.name ||
      person.fullName ||
      person.facultyName ||
      person.email ||
      `Faculty ${index + 1}`,
    department: person.department || person.dept || "Department not available",
    issues:
      getNumber(
        person.issues,
        person.complaints,
        person.totalComplaints,
        person.reportCount,
        person.count,
      ) ?? 0,
  }));

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="container">
          <section className="page-heading">
            <div>
              <span className="eyebrow">FACULTY OVERVIEW</span>
              <h1>Campus Analytics</h1>
              <p>Complaint insights across faculty members.</p>
            </div>

            <div className="date-pill">Last 7 Days</div>
          </section>

          {error && (
            <div className="analytics-error" role="alert">
              <p>{error}</p>

              <button type="button" onClick={loadAnalytics} disabled={loading}>
                {loading ? "Retrying..." : "Retry"}
              </button>
            </div>
          )}

          {loading && (
            <div className="analytics-loading" role="status">
              Loading analytics...
            </div>
          )}

          {/* Statistics cards */}
          <section className="analytics-stats">
            <div className="card analytics-stat">
              <span>Resolution Rate</span>
              <strong>
                {resolutionRate === null ? "—" : formatPercent(resolutionRate)}
              </strong>
              <small>Based on available backend data</small>
            </div>

            <div className="card analytics-stat">
              <span>Average Resolution</span>
              <strong>{formatDuration(averageResolution)}</strong>
              <small>Average time to resolve complaints</small>
            </div>

            <div className="card analytics-stat">
              <span>Faculty Reports</span>
              <strong>
                {formatNumber(
                  totalComplaints ??
                    normalizedFaculty.reduce(
                      (sum, person) => sum + person.issues,
                      0,
                    ),
                )}
              </strong>
              <small>
                {facultyCount !== null
                  ? `${formatNumber(facultyCount)} faculty members`
                  : "Total complaints reported"}
              </small>
            </div>
          </section>

          {/* Charts */}
          <section className="analytics-grid">
            {/* Weekly complaints */}
            <div className="card">
              <div className="section-header">
                <div>
                  <h2>Complaints This Week</h2>
                  <p>Complaints received each day.</p>
                </div>
              </div>

              {normalizedWeekly.length > 0 ? (
                <div className="chart">
                  {normalizedWeekly.map((item, index) => (
                    <div className="bar-column" key={`${item.label}-${index}`}>
                      <div
                        className="bar"
                        style={{
                          height: `${(item.value / maxWeeklyValue) * 100}%`,
                          minHeight: item.value > 0 ? "6px" : "0",
                        }}
                        title={`${item.label}: ${item.value} complaints`}
                      >
                        <span>{item.value}</span>
                      </div>

                      <small>{item.label}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="analytics-empty">
                  {loading
                    ? "Loading weekly complaints..."
                    : "No weekly complaint data available."}
                </p>
              )}
            </div>

            {/* Complaint categories */}
            <div className="card">
              <div className="section-header">
                <div>
                  <h2>Complaint Categories</h2>
                  <p>Distribution of reported complaints.</p>
                </div>
              </div>

              {normalizedCategories.length > 0 ? (
                normalizedCategories.map((item) => {
                  const percentage = Math.min(
                    100,
                    Math.max(
                      0,
                      item.value <= 100
                        ? item.value
                        : categoryTotal > 0
                          ? (item.value / categoryTotal) * 100
                          : 0,
                    ),
                  );

                  return (
                    <div className="category" key={item.name}>
                      <div>
                        <span>{item.name}</span>

                        <strong>
                          {item.count !== null
                            ? `${formatNumber(item.count)} reports`
                            : formatPercent(percentage)}
                        </strong>
                      </div>

                      <div
                        className="progress"
                        role="progressbar"
                        aria-label={item.name}
                        aria-valuenow={Math.min(100, percentage)}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        <span
                          style={{
                            width: `${Math.min(100, Math.max(0, percentage))}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="analytics-empty">
                  {loading
                    ? "Loading categories..."
                    : "No category data available."}
                </p>
              )}
            </div>
          </section>

          {/* Faculty activity */}
          <section className="card">
            <div className="section-header">
              <div>
                <h2>Faculty Activity</h2>
                <p>Complaints reported by faculty members.</p>
              </div>
            </div>

            {normalizedFaculty.length > 0 ? (
              <div className="faculty-grid">
                {normalizedFaculty.map((person, index) => (
                  <div className="faculty-card" key={`${person.name}-${index}`}>
                    <div className="avatar">
                      {person.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <strong>{person.name}</strong>
                      <span>{person.department}</span>
                    </div>

                    <b>
                      {formatNumber(person.issues)}
                      <small> reports</small>
                    </b>
                  </div>
                ))}
              </div>
            ) : (
              <p className="analytics-empty">
                {loading
                  ? "Loading faculty activity..."
                  : "No faculty activity data available."}
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

export default Analytics;
