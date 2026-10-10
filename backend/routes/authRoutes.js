const router = require("express").Router();
const { login, register, signup, me } = require("../controllers/authController");
const { auth } = require("../middleware/auth");

// Authentication routes
router.post("/login", login);
router.post("/register", register); // Backward-compatible registration endpoint\nrouter.post("/signup", signup); // Faculty signup form
router.get("/me", auth, me);

module.exports = router;
