const router = require("express").Router();
const {
    createComplaint,
    getComplaints,
    getComplaintById,
    updateComplaint,
    deleteComplaint,
    checkDuplicate
} = require("../controllers/complaintController");
const { auth, allowRoles } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Complaint routes
router.post("/", auth, upload.single("photo"), createComplaint);
router.get("/", auth, getComplaints);
router.get("/check-duplicate", auth, checkDuplicate);
router.post("/check-duplicate", auth, checkDuplicate);
router.get("/:id", auth, getComplaintById);

// Only admins and faculty can update complaints
router.patch(
    "/:id",
    auth,
    allowRoles("admin", "faculty"),
    updateComplaint
);

router.delete(
    "/:id",
    auth,
    allowRoles("admin"),
    deleteComplaint
);

module.exports = router;
