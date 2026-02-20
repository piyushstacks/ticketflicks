import express from "express";
import {
  createTheatre,
  fetchAllTheatres,
  fetchTheatre,
  updateTheatre,
  deleteTheatre,
  fetchScreensByTheatre,
} from "../controllers/theatreController.js";
import { protectAdmin } from "../middleware/auth.js";

const theatreRouter = express.Router();

// Theatre Routes
theatreRouter.post("/", protectAdmin, createTheatre);
theatreRouter.get("/", fetchAllTheatres);
theatreRouter.get("/:theatreId", fetchTheatre);
theatreRouter.put("/:theatreId", protectAdmin, updateTheatre);
theatreRouter.delete("/:theatreId", protectAdmin, deleteTheatre);

// Screen Routes (only the ones that exist)
theatreRouter.get("/:theatreId/screens", fetchScreensByTheatre);

export default theatreRouter;
