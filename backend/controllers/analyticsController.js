const Complaint = require("../models/Complaint");
const User = require("../models/User");

// Get the main complaint stats
async function overview(req, res, next) {
    try {
        const [
            total,
            active,
            critical,
            resolved,
            recent
        ] = await Promise.all([
            Complaint.countDocuments(),
            Complaint.countDocuments({
                status: { $in: ["Pending", "Assigned", "In Progress"] }
            }),
            Complaint.countDocuments({ priority: "Critical", status: { $ne: "Resolved" } }),
            Complaint.countDocuments({ status: "Resolved" }),
            Complaint.find().sort({ createdAt: -1 }).limit(5)
        ]);

        const resolutionRate = total
            ? Number(((resolved / total) * 100).toFixed(1))
            : 0;

        res.json({
            success: true,
            stats: {
                total,
                active,
                critical,
                resolved,
                resolutionRate
            },
            recent
        });
    } catch (error) {
        next(error);
    }
}

// Count complaints in each category
async function categoryDistribution(req, res, next) {
    try {
        const data = await Complaint.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const total = data.reduce((sum, item) => sum + item.count, 0);

        res.json({
            success: true,
            categories: data.map(item => ({
                name: item._id,
                count: item.count,
                percent: total ? Number(((item.count / total) * 100).toFixed(1)) : 0
            }))
        });
    } catch (error) {
        next(error);
    }
}

// Get complaint counts for the last seven days
async function weekly(req, res, next) {
    try {
        const start = new Date();
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);

        const rows = await Complaint.aggregate([
            { $match: { createdAt: { $gte: start } } },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const map = Object.fromEntries(rows.map(row => [row._id, row.count]));

        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const key = date.toISOString().slice(0, 10);

            days.push({
                date: key,
                day: date.toLocaleDateString("en-US", { weekday: "short" }),
                count: map[key] || 0
            });
        }

        res.json({
            success: true,
            weekly: days
        });
    } catch (error) {
        next(error);
    }
}

// Get activity from faculty members
async function facultyActivity(req, res, next) {
    try {
        const data = await Complaint.aggregate([
            {
                $match: {
                    userType: "Teacher",
                    createdBy: { $ne: null }
                }
            },
            {
                $group: {
                    _id: "$createdBy",
                    issues: { $sum: 1 }
                }
            },
            { $sort: { issues: -1 } },
            { $limit: 20 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 0,
                    name: "$user.name",
                    department: "$user.department",
                    issues: 1
                }
            }
        ]);

        res.json({
            success: true,
            faculty: data
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    overview,
    categoryDistribution,
    weekly,
    facultyActivity
};
