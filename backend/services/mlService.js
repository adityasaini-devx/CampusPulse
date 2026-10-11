const configuredMLServiceUrl = process.env.ML_SERVICE_URL?.trim();
const ML_SERVICE_URL = (
    configuredMLServiceUrl || "http://localhost:8000"
).replace(/\/+$/, "");

const ML_ENABLED =
    String(process.env.ML_ENABLED).toLowerCase() === "true";
const ML_REQUEST_TIMEOUT_MS = 5000;
const VALID_PRIORITIES = new Set(["Low", "Medium", "High", "Critical"]);

// Convert complaint details to the values used by the ML service
function convertAffectedUsers(value) {
    if (typeof value === "number") {
        return value;
    }

    const text = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");

    if (text.includes("51-100")) return 75;
    if (text.includes("21-50")) return 35;
    if (text.includes("6-20")) return 13;
    if (text.includes("1-5")) return 3;

    const number = Number(text);
    return Number.isFinite(number) ? number : 0;
}

function convertDurationToHours(value) {
    if (typeof value === "number") {
        return value;
    }

    const text = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");

    if (text.includes("lessthan1hour")) return 0.5;
    if (text.includes("1-8hours") || text.includes("1to8hours")) return 4;
    if (text.includes("8-24hours") || text.includes("8to24hours")) return 16;
    if (text.includes("1-3days") || text.includes("1to3days")) return 48;
    if (text.includes("3-7days") || text.includes("3to7days")) return 120;
    if (text.includes("morethan7days")) return 168;

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

    const controller = new AbortController();
    const timeout = setTimeout(
        () => controller.abort(),
        ML_REQUEST_TIMEOUT_MS
    );

    try {
        console.log("Sending complaint to ML service:", payload);

        const response = await fetch(`${ML_SERVICE_URL}/complaints`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        let data;
        try {
            data = await response.json();
        } catch (error) {
            throw new Error(
                `ML service returned invalid JSON (${response.status})`,
                { cause: error }
            );
        }

        if (!response.ok) {
            console.error("ML service error:", data);
            const detail = data && typeof data === "object" && !Array.isArray(data)
                ? data.detail || data.message
                : null;
            throw new Error(
                detail || `ML service request failed (${response.status})`
            );
        }

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            throw new Error("ML service returned an invalid response object");
        }

        console.log("ML response:", data);

        const priorityDetails = data.priority;
        const priorityCandidate =
            typeof priorityDetails === "string"
                ? priorityDetails
                : priorityDetails?.predicted_priority ||
                    priorityDetails?.value ||
                    data.predicted_priority;

        if (
            typeof priorityCandidate !== "string" ||
            !VALID_PRIORITIES.has(priorityCandidate.trim())
        ) {
            throw new Error("ML service response is missing a valid priority");
        }
        const priority = priorityCandidate.trim();

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
        const message = controller.signal.aborted
            ? `ML service request timed out after ${ML_REQUEST_TIMEOUT_MS} ms`
            : error.message;
        console.error("ML service request failed:", message);

        return {
            enabled: false,
            error: message,
            message: "ML service unavailable. Complaint can still be stored."
        };
    } finally {
        clearTimeout(timeout);
    }
}

async function classifyComplaint(complaint) {
    return predictComplaint(complaint);
}

module.exports = {
    predictComplaint,
    classifyComplaint
};