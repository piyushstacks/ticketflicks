import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OThiOTNkYjJlYTQxNzcxMGU0Yjg3ZCIsInJvbGUiOiJtYW5hZ2VyIiwiaWF0IjoxNzcxNjYwNzYzLCJleHAiOjE3NzIyNjU1NjN9.TNYV5lTqcx0ZLxEs6qi3t_A2jCtExDN7Dj7gk0-J8Ko";

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log("Decoded token:", decoded);
} catch (error) {
  console.error("Token verification failed:", error.message);
}