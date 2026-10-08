function ComplaintTable({ complaints, onMarkDone }) {
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

          {complaints.map((complaint) => (

            <tr key={complaint.id}>

              {/* TICKET */}
              <td>
                <strong>{complaint.id}</strong>
                <small>{complaint.date}</small>
              </td>


              {/* COMPLAINT */}
              <td>
                {complaint.title}
                <small>{complaint.category}</small>
              </td>


              {/* LOCATION */}
              <td>
                {complaint.location}
              </td>


              {/* PRIORITY */}
              <td>
                <span
                  className={`badge ${complaint.priority.toLowerCase()}`}
                >
                  {complaint.priority}
                </span>
              </td>


              {/* STATUS */}
              <td>

                <span
                  className={`badge ${complaint.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {complaint.status}
                </span>

              </td>


              {/* ACTION */}
              <td>

                {complaint.status !== "Resolved" ? (

                  <button
                    className="done-button"
                    onClick={() =>
                      onMarkDone(complaint.id)
                    }
                  >
                    ✓ Mark as Done
                  </button>

                ) : (

                  <span className="completed-text">
                    ✓ Completed
                  </span>

                )}

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default ComplaintTable;