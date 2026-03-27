const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) return res.status(401).json({ msg: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // ✅ MUST HAVE

    next();
  } catch {
    res.status(401).json({ msg: "Invalid token" });
  }
};