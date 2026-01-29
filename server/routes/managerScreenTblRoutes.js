import express from "express";
import { protectManager } from "../middleware/auth.js";
import {
  getTheatreScreensTbl,
  addScreenTbl,
  editScreenTbl,
  toggleScreenStatusTbl,
  deleteScreenTbl,
  getScreenTblById,
} from "../controllers/managerScreenTblController.js";

const managerScreenTblRouter = express.Router();

// SCREEN_TBL Management Routes
managerScreenTblRouter.get("/screens-tbl", protectManager, getTheatreScreensTbl);
managerScreenTblRouter.post("/screens-tbl/add", protectManager, addScreenTbl);
managerScreenTblRouter.put("/screens-tbl/:screenId", protectManager, editScreenTbl);
managerScreenTblRouter.patch("/screens-tbl/:screenId/toggle", protectManager, toggleScreenStatusTbl);
managerScreenTblRouter.delete("/screens-tbl/:screenId", protectManager, deleteScreenTbl);
managerScreenTblRouter.get("/screens-tbl/:screenId", protectManager, getScreenTblById);

export default managerScreenTblRouter;