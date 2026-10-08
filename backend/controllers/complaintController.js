const Complaint = require("../models/Complaint");
const User = require("../models/User");
const generateTicketId = require("../utils/generateTicket");
const { calculatePriority } = require("../utils/priority");
const { classifyComplaint } = require("../services/mlService");

// Find a complaint by its ID or ticket number
function getComplaintLookupQuery(id) {
    if (typeof id !== "string") {
        return { ticketId: id };
    }

    const normalized = id.trim();
    const isObjectId = /^([0-9a-fA-F]{24})$/.test(normalized);

    return isObjectId ? { _id: normalized } : { ticketId: normalized };
}

// Create a complaint
async function createComplaint(req, res, next) {
    try {
        const {
            title,
            userType = "Student",
            category,
            building,
            room,
            severity,
            affectedUsers,
            issueDuration,
            description
        } = req.body;

        const photoUrl = req.file ? `/uploads/${req.file.filename}` : "";

        if (
            !title || !category || !building || !room ||
            !severity || !affectedUsers || !issueDuration || !description
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required complaint fields"
            });
        }

        const priority = calculatePriority({
            severity,
            affectedUsers,
            issueDuration
        });

        const ticketId = await generateTicketId();

        const complaint = await Complaint.create({
            ticketId,
            title,
            userType,
            category,
            building,
            room,
            severity,
            affectedUsers,
            issueDuration,
            description,
            photoUrl,
            priority,
            createdBy: req.user?._id || null
        });

        const ml = await classifyComplaint(complaint);
        complaint.ml = ml || { enabled: false, message: "ML result unavailable" };

        if (ml?.enabled && ml.priority) {
            complaint.priority = ml.priority;
        }

        if (ml?.enabled && ml.category) {
            complaint.category = ml.category;
        }

        await complaint.save();

        res.status(201).json({
            success: true,
            message: "Complaint submitted successfully",
            complaint
        });
    } catch (error) {
        next(error);
    }
}

// Get complaints with optional filters
async function getComplaints(req, res, next) {
    try {
        const {
            status,
            category,
            priority,
            page = 1,
            limit = 20,
            mine
        } = req.query;

        const filter = {};

        if (status) filter.status = status;
        if (category) filter.category = category;
        if (priority) filter.priority = priority;

        if (mine === "true" && req.user?._id) {
            filter.createdBy = req.user._id;
        }

        const pageNumber = Math.max(Number(page), 1);
        const pageLimit = Math.min(Math.max(Number(limit), 1), 100);

        const [complaints, total] = await Promise.all([
            Complaint.find(filter)
                .populate("createdBy", "name email role")
                .populate("assignedTo", "name email role department")
                .sort({ createdAt: -1 })
                .skip((pageNumber - 1) * pageLimit)
                .limit(pageLimit),
            Complaint.countDocuments(filter)
        ]);

        res.json({
            success: true,
            complaints,
            pagination: {
                page: pageNumber,
                limit: pageLimit,
                total,
                pages: Math.ceil(total / pageLimit)
            }
        });
    } catch (error) {
        next(error);
    }
}

// Get one complaint
async function getComplaintById(req, res, next) {
    try {
        const complaint = await Complaint.findOne(getComplaintLookupQuery(req.params.id))
            .populate("createdBy", "name email role")
            .populate("assignedTo", "name email role department");

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        res.json({ success: true, complaint });
    } catch (error) {
        next(error);
    }
}

// Update a complaint
async function updateComplaint(req, res, next) {
    try {
        const allowed = [
            "status",
            "priority",
            "assignedTo",
            "resolutionNote"
        ];

        const updates = {};

        for (const field of allowed) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (updates.assignedTo) {
            const faculty = await User.findOne({
                _id: updates.assignedTo,
                role: { $in: ["faculty", "admin"] }
            });

            if (!faculty) {
                return res.status(400).json({
                    success: false,
                    message: "assignedTo must be a valid faculty/admin user"
                });
            }
        }

        if (updates.status === "Resolved") {
            updates.resolvedAt = new Date();
        }

        const complaint = await Complaint.findOneAndUpdate(
            getComplaintLookupQuery(req.params.id),
            updates,
            { new: true, runValidators: true }
        );

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        res.json({
            success: true,
            message: "Complaint updated successfully",
            complaint
        });
    } catch (error) {
        next(error);
    }
}

// Delete a complaint
async function deleteComplaint(req, res, next) {
    try {
        const complaint = await Complaint.findOneAndDelete(
            getComplaintLookupQuery(req.params.id)
        );

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        res.json({
            success: true,
            message: "Complaint deleted successfully"
        });
    } catch (error) {
        next(error);
    }
}

// Check for similar complaints
async function checkDuplicate(req, res, next) {
    try {
        const { title = "", description = "" } = req.body;
        const text = `${title} ${description}`.toLowerCase().trim();

        if (!text) {
            return res.json({ success: true, duplicate: false, matches: [] });
        }

        const words = text
            .split(/\W+/)
            .filter(word => word.length > 3)
            .slice(0, 8);

        if (!words.length) {
            return res.json({ success: true, duplicate: false, matches: [] });
        }

        const regex = new RegExp(words.join("|"), "i");

        const matches = await Complaint.find({
            status: { $ne: "Resolved" },
            $or: [
                { title: regex },
                { description: regex }
            ]
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("ticketId title category building room status priority");

        res.json({
            success: true,
            duplicate: matches.length > 0,
            matches
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createComplaint,
    getComplaints,
    getComplaintById,
    updateComplaint,
    deleteComplaint,
    checkDuplicate
};
