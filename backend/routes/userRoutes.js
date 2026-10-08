const router = require("express").Router();
const { listUsers } = require("../controllers/userController");
const { auth, allowRoles } = require("../middleware/auth");

// Only admins can view the user list
router.get("/", auth, allowRoles("admin"), listUsers);

module.exports = router;
