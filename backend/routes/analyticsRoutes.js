const router = require("express").Router();
const {
    overview,
    monthlyTrend,
    categoryDistribution,
    weekly,
    facultyActivity
} = require("../controllers/analyticsController");
const { auth, allowRoles } = require("../middleware/auth");

// Only admins and faculty can access analytics
router.use(auth);
router.use(allowRoles("admin", "faculty"));

// Analytics routes
router.get("/overview", overview);
router.get("/monthly", monthlyTrend);
router.get("/category-distribution", categoryDistribution);
router.get("/weekly", weekly);
router.get("/faculty", facultyActivity);

module.exports = router;
