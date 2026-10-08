const ML_SERVICE_URL =
    process.env.ML_SERVICE_URL || "http://localhost:8000";

const ML_ENABLED =
    String(process.env.ML_ENABLED).toLowerCase() === "true";

// Convert complaint details to the values used by the ML service
function convertAffectedUsers(value) {
    if (typeof value === "number") {
        return value;
    }

    const text = String(value || "").trim().toLowerCase();

    if (text.includes("50+")) return 50;
    if (text.includes("10-50")) return 30;
    if (text.includes("6-10")) return 8;
    if (text.includes("1-5")) return 3;

    const number = Number(text);
    return Number.isFinite(number) ? number : 0;
}

function convertDurationToHours(value) {
    if (typeof value === "number") {
        return value;
    }

    const text = String(value || "").trim().toLowerCase();

    if (text.includes("less")) return 12;
    if (text.includes("1-3")) return 48;
    if (text.includes("3-7")) return 120;
    if (text.includes("more")) return 168;

    const number = Number(text);
    return Number.isFinite(number) ? number : 0;
}

// Get the floor and room number from the room field
function getFloorAndRoom(complaint) {
    const room = String(complaint.room || "").trim();

    if (!room) {
        return {
            floor: "Unknown",
            room_lab_no: "Unknown"
        };
    }

    if (room.includes("-")) {
        const parts = room.split("-");

        if (parts.length >= 2) {
            return {
                floor: parts[0].trim(),
                room_lab_no: parts.slice(1).join("-").trim()
            };
        }
    }

    if (/^\d+$/.test(room)) {
        return {
            floor: room.length >= 3 ? room.charAt(0) : "Unknown",
            room_lab_no: room
        };
    }

    return {
        floor: "Unknown",
        room_lab_no: room
    };
}

// Send the complaint to the ML service
async function predictComplaint(complaint) {
    if (!ML_ENABLED) {
        return {
            enabled: false,
            message: "ML service is disabled"
        };
    }

    const { floor, room_lab_no } = getFloorAndRoom(complaint);

    const payload = {
        building: String(complaint.building || "Unknown"),
        floor,
        room_lab_no,
        facility_type: String(complaint.category || "Other"),
        issue_category: String(complaint.category || "Other"),
        issue_subcategory: String(complaint.title || "General issue"),
        severity: String(complaint.severity || "Medium"),
        affected_users: convertAffectedUsers(complaint.affectedUsers),
        issue_duration_hours: convertDurationToHours(complaint.issueDuration),
        description: String(complaint.description || "")
    };

    try {
        console.log("Sending complaint to ML service:", payload);

        const response = await fetch(`${ML_SERVICE_URL}/complaints`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error("ML service error:", data);
            throw new Error(
                data.detail || data.message || `ML service request failed (${response.status})`
            );
        }

        console.log("ML response:", data);

        const priorityDetails = data.priority;
        const priority =
            typeof priorityDetails === "string"
                ? priorityDetails
                : priorityDetails?.predicted_priority ||
                    priorityDetails?.value ||
                    data.predicted_priority ||
                    null;

        const model =
            typeof priorityDetails === "string"
                ? null
                : priorityDetails?.model || data.model || null;

        const probabilities =
            typeof priorityDetails === "string"
                ? {}
                : priorityDetails?.probabilities || data.probabilities || {};

        const confidence =
            typeof priorityDetails === "string"
                ? null
                : priorityDetails?.confidence ?? data.confidence ?? null;

        return {
            enabled: true,
            priority,
            confidence,
            model,
            probabilities,
            cluster: data.cluster?.cluster ?? null,
            clusterName: data.cluster?.cluster_name || null,
            clusterDescription: data.cluster?.description || null,
            clusterModel: data.cluster?.model || null,
            maintenanceScore: data.maintenance?.score ?? null,
            priorityWeight: data.maintenance?.priority_weight ?? null,
            patternWeight: data.maintenance?.pattern_weight ?? null,
            recurrenceWeight: data.maintenance?.recurrence_weight ?? null,
            impactWeight: data.maintenance?.impact_weight ?? null,
            historyMatchLevel: data.history_match_level || null,
            historyMatchCount: data.history_match_count ?? 0,
            featureSource: data.feature_source || "historical_dataset"
        };
    } catch (error) {
        console.error("ML service connection failed:", error.message);

        return {
            enabled: false,
            error: error.message,
            message: "ML service unavailable. Complaint can still be stored."
        };
    }
}

async function classifyComplaint(complaint) {
    return predictComplaint(complaint);
}

module.exports = {
    predictComplaint,
    classifyComplaint
};