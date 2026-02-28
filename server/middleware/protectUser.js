import jwt from "jsonwebtoken";

export const protectUser = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  console.log("[protectUser] authHeader present:", !!authHeader);
  console.log("[protectUser] token present:", !!token);

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[protectUser] decoded token:", decoded);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    console.log("[protectUser] JWT verify error:", error.message);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
