
function ComplaintTable({ complaints = [], onMarkDone, busyId }) {
  // Format the complaint date received from the backend
  function formatDate(date) {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString();
  }

  // Show a message when there are no complaints
  if (complaints.length === 0) {
    return (
      photo.url ||
      photo.secure_url ||
      photo.imageUrl ||
      photo.path ||
      null
    );
  }

  return null;
};

const openComplaintPhoto = (url) => {
  if (!url) return;

  const newTab = window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

  if (!newTab) {
    alert("Please allow pop-ups to view this photo.");
  }
};

const formatDate = (dateValue) => {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString();
};

function ComplaintTable({
  complaints = [],
  onMarkDone,
  busyId,
}) {
  const [groupedView, setGroupedView] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});

  const clusters = useMemo(() => {
    const grouped = new Map();

    complaints.forEach((complaint) => {
      const classification = getClassification(complaint);
      const clusterName = classification.name;

      if (!grouped.has(clusterName)) {
        grouped.set(clusterName, {
          ...classification,
          complaints: [],
        });
      }

      grouped.get(clusterName).complaints.push(complaint);
    });

    return Array.from(grouped.values()).sort(
      (a, b) => b.complaints.length - a.complaints.length
    );
  }, [complaints]);

  const toggleGroup = (groupName) => {
    setExpandedGroups((previous) => ({
      ...previous,
      [groupName]: !previous[groupName],
    }));
  };

  const renderComplaintRow = (complaint) => {
    const id = getComplaintId(complaint);
    const photoUrl = getComplaintPhoto(complaint);
    const classification = getClassification(complaint);

    const status = complaint.status || "Pending";
    const priority =
      complaint.priority || complaint.severity || "Normal";

    const isDone = normalizeText(status) === "resolved" ||
      normalizeText(status) === "completed" ||
      normalizeText(status) === "done";

    return (
      <tr key={id || `${complaint.title}-${complaint.createdAt}`}>
        <td>
          {complaint.ticketId || id || "—"}
        </td>

        <td>
          <div className="complaint-title">
            {complaint.title || "Untitled complaint"}
          </div>

          {complaint.description && (
            <div className="complaint-description">
              {complaint.description}
            </div>
          )}
        </td>

        <td>
          <span className="classification-badge">
            {classification.name}
          </span>
        </td>

        <td>
          {complaint.location ||
            [
              complaint.building,
              complaint.room && `Room ${complaint.room}`,
            ]
              .filter(Boolean)
              .join(", ") ||
            "—"}
        </td>

        <td>
          <span
            className={`priority-badge priority-${normalizeText(
              priority
            ).replace(/\s+/g, "-")}`}
          >
            {priority}
          </span>
        </td>

        <td>
          <span
            className={`status-badge status-${normalizeText(
              status
            ).replace(/\s+/g, "-")}`}
          >
            {status}
          </span>
        </td>

        <td>{formatDate(complaint.createdAt || complaint.date)}</td>

        <td>
          {photoUrl ? (
            <button
              type="button"
              className="view-photo-btn"
              onClick={() => openComplaintPhoto(photoUrl)}
              title="Open complaint photo in a new tab"
            >
              View Photo
            </button>
          ) : (
            <span className="no-photo">No photo</span>
          )}
        </td>

        <td>
          {!isDone && onMarkDone && (
            <button
              type="button"
              className="mark-done-btn"
              disabled={busyId === id}
              onClick={() => onMarkDone(id)}
            >
              {busyId === id ? "Updating..." : "Mark as Done"}
            </button>
          )}
        </td>
      </tr>
    );
  };

  const renderTable = (items) => (
    <div className="complaint-table-wrapper">
      <table className="complaint-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Complaint</th>
            <th>Classification</th>
            <th>Location</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Date</th>
            <th>Photo</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {items.map(renderComplaintRow)}
        </tbody>
      </table>
    </div>
  );

  if (!complaints.length) {
    return (
      <div className="complaints-empty">
        <h3>No complaints found</h3>
        <p>There are no complaints to display right now.</p>
      </div>
    );
  }

  return (
    <section className="complaint-clustering">
      <div className="cluster-toolbar">
        <div>
          <h2>Complaints</h2>
          <p>
            {complaints.length} total complaint
            {complaints.length !== 1 ? "s" : ""} in{" "}
            {clusters.length} group{clusters.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="cluster-view-toggle">
          <button
            type="button"
            className={!groupedView ? "active" : ""}
            onClick={() => setGroupedView(false)}
          >
            All Complaints
          </button>

          <button
            type="button"
            className={groupedView ? "active" : ""}
            onClick={() => setGroupedView(true)}
          >
            Group Similar
          </button>
        </div>
      </div>

      {!groupedView ? (
        renderTable(complaints)
      ) : (
        <div className="cluster-list">
          {clusters.map((cluster) => {
            const isExpanded = expandedGroups[cluster.name] !== false;

            return (
              <article
                className="cluster-card"
                key={cluster.name}
              >
                <button
                  type="button"
                  className="cluster-heading"
                  onClick={() => toggleGroup(cluster.name)}
                  aria-expanded={isExpanded}
                >
                  <span>
                    <strong>{cluster.name}</strong>
                    <small>{cluster.department}</small>
                  </span>

                  <span className="cluster-heading-right">
                    <span className="cluster-count">
                      {cluster.complaints.length}
                    </span>

                    <span aria-hidden="true">
                      {isExpanded ? "−" : "+"}
                    </span>
                  </span>
                </button>

                {isExpanded && renderTable(cluster.complaints)}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ComplaintTable;
