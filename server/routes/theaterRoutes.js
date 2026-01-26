import express from "express";
import {
  createTheater,
  fetchAllTheaters,
  fetchTheater,
  updateTheater,
  deleteTheater,
  createScreen,
  fetchScreensByTheater,
  fetchScreen,
  updateScreen,
  deleteScreen,
} from "../controllers/theaterController.js";
import { protectAdmin } from "../middleware/auth.js";

const theaterRouter = express.Router();

// Theater Routes
theaterRouter.post("/", protectAdmin, createTheater);
theaterRouter.get("/", fetchAllTheaters);
theaterRouter.get("/:theaterId", fetchTheater);
theaterRouter.put("/:theaterId", protectAdmin, updateTheater);
theaterRouter.delete("/:theaterId", protectAdmin, deleteTheater);

// Screen Routes
theaterRouter.post("/:theaterId/screens", protectAdmin, createScreen);
theaterRouter.get("/:theaterId/screens", fetchScreensByTheater);
theaterRouter.get("/screens/:screenId", fetchScreen);
theaterRouter.put("/screens/:screenId", protectAdmin, updateScreen);
theaterRouter.delete("/screens/:screenId", protectAdmin, deleteScreen);

export default theaterRouter;
