
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
      <div className="table-container">
        <p>No complaints found.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Complaint</th>
            <th>Location</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {complaints.map((complaint) => {
            // The backend provides MongoDB ID and ticket ID separately
            const id = complaint._id || complaint.id || complaint.ticketId;
            const ticket = complaint.ticketId || id;

            const title = complaint.title || "Untitled complaint";
            const category = complaint.category || "Other";

            const location = [
              complaint.building,
              complaint.room,
            ]
              .filter(Boolean)
              .join(" - ") || "Location unavailable";

            const priority =
              complaint.priority || complaint.severity || "Medium";

            const status = complaint.status || "Pending";

            const priorityClass = String(priority)
              .toLowerCase()
              .replace(/\s+/g, "-");

            const statusClass = String(status)
              .toLowerCase()
              .replace(/\s+/g, "-");

            const isResolved = status === "Resolved";
            const isBusy = busyId === id;

            return (
              <tr key={id}>
                {/* Ticket */}
                <td>
                  <strong>{ticket}</strong>
                  <small>{formatDate(complaint.createdAt || complaint.date)}</small>
                </td>

                {/* Complaint */}
                <td>
                  {title}
                  <small>{category}</small>
                </td>

                {/* Location */}
                <td>{location}</td>

                {/* Priority */}
                <td>
                  <span className={`badge ${priorityClass}`}>
                    {priority}
                  </span>
                </td>

                {/* Status */}
                <td>
                  <span className={`badge ${statusClass}`}>
                    {status}
                  </span>
                </td>

                {/* Admin action */}
                <td>
                  {isResolved ? (
                    <span className="completed-text">
                      ✓ Completed
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="done-button"
                      disabled={isBusy || !onMarkDone}
                      onClick={() => onMarkDone(id)}
                    >
                      {isBusy ? "Updating..." : "✓ Mark as Done"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ComplaintTable;
