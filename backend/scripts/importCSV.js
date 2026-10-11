require("dotenv").config();

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const connectDB = require("../config/db");
const Complaint = require("../models/Complaint");
const generateTicketId = require("../utils/generateTicket");

const csvPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(__dirname, "../../campuspulse_akgec_cleaned.csv");

const CATEGORY_MAP = {
    electricity: "Electricity",
    water: "Water",
    internet: "Internet",
    ac: "AC",
    furniture: "Furniture",
    cleaning: "Cleaning",
    safety: "Safety"
};

// Get a value from one of the possible CSV column names
function pick(row, names, fallback = "") {
    const key = Object.keys(row).find(k =>
        names.some(name => k.toLowerCase().trim() === name.toLowerCase())
    );

    return key ? String(row[key] ?? "").trim() : fallback;
}

// Convert CSV categories and priorities to the expected values
function normalizeCategory(value) {
    const raw = value.toLowerCase().trim();

    if (CATEGORY_MAP[raw]) return CATEGORY_MAP[raw];

    for (const key of Object.keys(CATEGORY_MAP)) {
        if (raw.includes(key)) return CATEGORY_MAP[key];
    }

    return "Other";
}

function normalizePriority(value) {
    const raw = value.toLowerCase();

    if (raw.includes("critical")) return "Critical";
    if (raw.includes("high")) return "High";
    if (raw.includes("medium")) return "Medium";
    return "Low";
}

// Import complaints from the CSV file
async function importCSV() {
    if (!fs.existsSync(csvPath)) {
        throw new Error(`CSV not found: ${csvPath}`);
    }

    await connectDB();

    let count = 0;
    let skipped = 0;
    const batch = [];

    const stream = fs.createReadStream(csvPath).pipe(csv());

    for await (const row of stream) {
        const title =
            pick(row, ["title", "complaint_title", "issue", "subject"], "Campus complaint");

        const description =
            pick(row, ["description", "complaint", "details", "text"], title);

        const category = normalizeCategory(
            pick(row, ["category", "complaint_category"], "Other")
        );

        const priority = normalizePriority(
            pick(row, ["priority", "severity"], "Medium")
        );

        const document = {
            ticketId: `CSV-${Date.now()}-${count}`,
            title,
            userType: pick(row, ["userType", "user_type", "role"], "Student") === "Teacher"
                ? "Teacher"
                : "Student",
            category,
            building: pick(row, ["building", "block", "location"], "Unknown"),
            room: pick(row, ["room", "floor"], "Unknown"),
            severity: ["Low", "Medium", "High", "Critical"].includes(priority)
                ? priority
                : "Medium",
            affectedUsers: pick(row, ["affectedUsers", "affected_users"], "1 - 5 Users"),
            issueDuration: pick(row, ["issueDuration", "duration"], "Less than 1 Hour"),
            description,
            priority,
            status: "Resolved",
            createdBy: null
        };

        batch.push(document);

        if (batch.length === 500) {
            await Complaint.insertMany(batch, { ordered: false });
            count += batch.length;
            batch.length = 0;
            console.log(`Imported ${count} rows...`);
        }
    }

    if (batch.length) {
        try {
            await Complaint.insertMany(batch, { ordered: false });
            count += batch.length;
        } catch (error) {
            skipped += error.writeErrors?.length || 0;
        }
    }

    console.log(`CSV import completed. Imported: ${count}, skipped: ${skipped}`);
    process.exit(0);
}

importCSV().catch(error => {
    console.error("CSV import failed:", error.message);
    process.exit(1);
});
