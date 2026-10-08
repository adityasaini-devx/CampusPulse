// Calculate priority from the complaint details
function calculatePriority({ severity, affectedUsers, issueDuration }) {
    const severityScore = {
        Low: 1,
        Medium: 2,
        High: 3,
        Critical: 4
    };

    let score = severityScore[severity] || 2;

    if (["51 - 100 Users", "100+ Users"].includes(affectedUsers)) {
        score += 1;
    }

    if (["1 to 3 Days", "More than 3 Days"].includes(issueDuration)) {
        score += 1;
    }

    if (score >= 5) return "Critical";
    if (score === 4) return "High";
    if (score === 3) return "Medium";
    return "Low";
}

module.exports = { calculatePriority };
