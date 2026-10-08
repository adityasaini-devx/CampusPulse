const mongoose = require("mongoose");

// Complaint data
const complaintSchema = new mongoose.Schema(
    {
        ticketId: {
            type: String,
            unique: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },
        userType: {
            type: String,
            enum: ["Student", "Teacher"],
            required: true
        },
        category: {
            type: String,
            enum: [
                "Electricity",
                "Water",
                "Internet",
                "AC",
                "Furniture",
                "Cleaning",
                "Safety",
                "Other"
            ],
            required: true
        },
        building: {
            type: String,
            required: true,
            trim: true
        },
        room: {
            type: String,
            required: true,
            trim: true
        },
        severity: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            required: true
        },
        affectedUsers: {
            type: String,
            required: true
        },
        issueDuration: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000
        },
        photoUrl: {
            type: String,
            default: ""
        },
        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            default: "Medium"
        },
        status: {
            type: String,
            enum: ["Pending", "Assigned", "In Progress", "Resolved", "Rejected"],
            default: "Pending"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        resolutionNote: {
            type: String,
            default: ""
        },
        resolvedAt: {
            type: Date,
            default: null
        },
        ml: {
            enabled: {
                type: Boolean,
                default: false
            },
            priority: {
                type: String,
                default: null
            },
            confidence: {
                type: Number,
                default: null
            },
            model: {
                type: String,
                default: null
            },
            probabilities: {
                type: mongoose.Schema.Types.Mixed,
                default: {}
            },
            cluster: {
                type: Number,
                default: null
            },
            clusterName: {
                type: String,
                default: null
            },
            clusterDescription: {
                type: String,
                default: null
            },
            clusterModel: {
                type: String,
                default: null
            },
            maintenanceScore: {
                type: Number,
                default: null
            },
            priorityWeight: {
                type: Number,
                default: null
            },
            patternWeight: {
                type: Number,
                default: null
            },
            recurrenceWeight: {
                type: Number,
                default: null
            },
            impactWeight: {
                type: Number,
                default: null
            },
            historyMatchLevel: {
                type: String,
                default: null
            },
            historyMatchCount: {
                type: Number,
                default: 0
            },
            featureSource: {
                type: String,
                default: null
            }
        }
    },
    { timestamps: true }
);

complaintSchema.index({ category: 1, createdAt: -1 });
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ priority: 1, status: 1 });
complaintSchema.index({ building: 1, room: 1 });

module.exports = mongoose.model("Complaint", complaintSchema);
