import express from "express";
import {
  createTheater,
  fetchAllTheaters,
  fetchTheater,
  updateTheater,
  deleteTheater,
  fetchScreensByTheater,
} from "../controllers/theaterController.js";
import { protectAdmin } from "../middleware/auth.js";

const theaterRouter = express.Router();

// Theater Routes
theaterRouter.post("/", protectAdmin, createTheater);
theaterRouter.get("/", fetchAllTheaters);
theaterRouter.get("/:theaterId", fetchTheater);
theaterRouter.put("/:theaterId", protectAdmin, updateTheater);
theaterRouter.delete("/:theaterId", protectAdmin, deleteTheater);

// Screen Routes (only the ones that exist)
theaterRouter.get("/:theaterId/screens", fetchScreensByTheater);

export default theaterRouter;
