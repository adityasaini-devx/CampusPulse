// Generate a unique ticket ID
async function generateTicketId() {
    const Complaint = require("../models/Complaint");

    for (let i = 0; i < 10; i++) {
        const number = Math.floor(1000 + Math.random() * 9000);
        const ticketId = `CP-${number}`;
        const exists = await Complaint.exists({ ticketId });

        if (!exists) return ticketId;
    }

    return `CP-${Date.now().toString().slice(-8)}`;
}

module.exports = generateTicketId;
