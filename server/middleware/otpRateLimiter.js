// Simple in-memory rate limiter for OTP endpoints
// Limits requests per (email + purpose) key within a time window

const map = new Map(); // key -> { count, firstAt }

export const otpRateLimiter = (options = {}) => {
  const { windowMs = 60 * 60 * 1000, max = 20 } = options; // default: 20 per hour (more lenient for dev)

  return (req, res, next) => {
    try {
      const email = (req.body && req.body.email) || req.query.email || req.headers["x-user-email"];
      const purpose = (req.body && req.body.purpose) || "generic";
      if (!email) return res.status(400).json({ success: false, message: "Email is required for rate limiting" });

      const key = `${email.toLowerCase()}::${purpose}`;
      const now = Date.now();
      const entry = map.get(key);
      if (!entry) {
        map.set(key, { count: 1, firstAt: now });
        return next();
      }

      if (now - entry.firstAt > windowMs) {
        // reset window
        map.set(key, { count: 1, firstAt: now });
        return next();
      }

      if (entry.count >= max) {
        const retryAfter = Math.ceil((windowMs - (now - entry.firstAt)) / 1000);
        res.set("Retry-After", String(retryAfter));
        return res.status(429).json({ success: false, message: `Too many OTP requests. Try again in ${retryAfter} seconds.` });
      }

      entry.count += 1;
      map.set(key, entry);
      return next();
    } catch (err) {
      return next();
    }
  };
};
