import { useMemo, useState } from "react";

const CLASSIFICATIONS = [
  {
    name: "Network & Wi-Fi",
    department: "IT & Networking",
    keywords: [
      "wifi",
      "wi-fi",
      "internet",
      "network",
      "router",
      "connection",
      "lan",
      "ethernet",
      "slow internet",
    ],
  },
  {
    name: "Electricity & Power",
    department: "Electrical",
    keywords: [
      "electricity",
      "power",
      "electric",
      "light",
      "lights",
      "fan",
      "switch",
      "socket",
      "voltage",
      "outage",
    ],
  },
  {
    name: "Water Supply",
    department: "Plumbing",
    keywords: [
      "water",
      "tap",
      "leak",
      "leakage",
      "pipeline",
      "pipe",
      "drinking water",
      "water cooler",
      "faucet",
    ],
  },
  {
    name: "Air Conditioning",
    department: "HVAC & Maintenance",
    keywords: [
      "ac",
      "air conditioner",
      "air conditioning",
      "cooling",
      "ventilation",
      "temperature",
    ],
  },
  {
    name: "Furniture & Classrooms",
    department: "Facilities",
    keywords: [
      "chair",
      "desk",
      "bench",
      "table",
      "furniture",
      "classroom",
      "projector",
      "whiteboard",
      "blackboard",
    ],
  },
  {
    name: "Cleaning & Sanitation",
    department: "Housekeeping",
    keywords: [
      "cleaning",
      "dirty",
      "garbage",
      "dustbin",
      "dust",
      "toilet",
      "washroom",
      "restroom",
      "hygiene",
      "sanitation",
      "smell",
    ],
  },
  {
    name: "Safety & Security",
    department: "Security",
    keywords: [
      "security",
      "unsafe",
      "theft",
      "safety",
      "broken lock",
      "camera",
      "cctv",
      "emergency",
    ],
  },
];

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getComplaintText = (complaint) =>
  normalizeText(
    [
      complaint.title,
      complaint.description,
      complaint.category,
      complaint.location,
      complaint.building,
      complaint.room,
    ]
      .filter(Boolean)
      .join(" ")
  );

const getClassification = (complaint) => {
  const category = normalizeText(complaint.category || "");
  const text = getComplaintText(complaint);

  // Prefer a recognized category from the complaint data.
  const categoryMap = {
    internet: "Network & Wi-Fi",
    networking: "Network & Wi-Fi",
    network: "Network & Wi-Fi",
    wifi: "Network & Wi-Fi",
    electricity: "Electricity & Power",
    electrical: "Electricity & Power",
    water: "Water Supply",
    plumbing: "Water Supply",
    ac: "Air Conditioning",
    hvac: "Air Conditioning",
    furniture: "Furniture & Classrooms",
    classroom: "Furniture & Classrooms",
    cleaning: "Cleaning & Sanitation",
    sanitation: "Cleaning & Sanitation",
    security: "Safety & Security",
    safety: "Safety & Security",
  };

  const categoryMatch = CLASSIFICATIONS.find(
    (item) => item.name === categoryMap[category]
  );

  if (categoryMatch) return categoryMatch;

  // Otherwise classify using complaint title and description.
  for (const classification of CLASSIFICATIONS) {
    const matched = classification.keywords.some((keyword) => {
      const normalizedKeyword = normalizeText(keyword);

      return ` ${text} `.includes(` ${normalizedKeyword} `);
    });

    if (matched) return classification;
  }

  return {
    name: complaint.category || "Other Issues",
    department: "General Maintenance",
    keywords: [],
  };
};

const getComplaintId = (complaint) =>
  complaint._id || complaint.id || complaint.ticketId;

const getComplaintPhoto = (complaint) => {
  const photo =
    complaint.photoUrl ||
    complaint.imageUrl ||
    complaint.photo ||
    complaint.image ||
    complaint.attachment ||
    complaint.picture ||
    complaint.image?.url;

  if (typeof photo === "string" && photo.trim()) {
    return photo;
  }

  if (photo && typeof photo === "object") {
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