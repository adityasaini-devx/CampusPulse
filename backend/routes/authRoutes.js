const router = require("express").Router();
const { login, register, me } = require("../controllers/authController");
const { auth } = require("../middleware/auth");

// Authentication routes
router.post("/login", login);
router.post("/register", register);
router.get("/me", auth, me);

module.exports = router;
