import express from "express";
import {
  registerTheatre,
  getAllTheatres,
  getTheatreDetails,
  searchTheatres,
} from "../controllers/theatreController.js";
import { protectAdmin } from "../middleware/auth.js";

const theatreRouter = express.Router();

// Theatre Routes
theatreRouter.post("/", protectAdmin, registerTheatre);
theatreRouter.get("/", getAllTheatres);
theatreRouter.get("/search", searchTheatres);
theatreRouter.get("/:theatreId", getTheatreDetails);

export default theatreRouter;
