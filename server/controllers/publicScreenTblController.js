import mongoose from 'mongoose';
import ScreenTbl from '../models/ScreenTbl.js';
import Theatre from '../models/Theatre.js';

// Get all active screens for a theatre (public endpoint)
export const getTheatreScreensPublic = async (req, res) => {
  try {
    const { theatreId } = req.params;

    console.log('[getTheatreScreensPublic] Called with theatreId:', theatreId);

    if (!theatreId) {
      return res.json({
        success: false,
        message: "Theatre ID is required",
      });
    }

    // Check if theatre exists and is approved
    const theatre = await Theatre.findOne({ 
      _id: new mongoose.Types.ObjectId(theatreId),
      approval_status: 'approved'
    });

    console.log('Theatre query result:', theatre ? 'Found' : 'Not found');
    console.log('Theatre ID:', theatreId);
    if (theatre) {
      console.log('Theatre name:', theatre.name);
      console.log('Approval status:', theatre.approval_status);
    }

    if (!theatre) {
      return res.json({
        success: false,
        message: "Theatre not found or not available",
      });
    }

    // Get all active screens for this theatre
    const screens = await ScreenTbl.find({
      theatre: theatreId,
      isActive: true,
      status: 'active'
    })
    .select('name screenNumber seatLayout seatTiers isActive status')
    .sort({ name: 1 });

    res.json({ 
      success: true, 
      screens,
      theatre: {
        _id: theatre._id,
        name: theatre.name,
        location: theatre.location
      }
    });
  } catch (error) {
    console.error("[getTheatreScreensPublic]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get single screen details (public endpoint)
export const getScreenDetailsPublic = async (req, res) => {
  try {
    const { screenId } = req.params;

    if (!screenId) {
      return res.json({
        success: false,
        message: "Screen ID is required",
      });
    }

    // Get screen with theatre details
    const screen = await ScreenTbl.findOne({
      _id: screenId,
      isActive: true,
      status: 'active'
    })
    .populate('theatre', 'name location address city')
    .select('name screenNumber seatLayout seatTiers isActive status');

    if (!screen) {
      return res.json({
        success: false,
        message: "Screen not found or not available",
      });
    }

    // Verify theatre is approved and active
    if (screen.theatre && (screen.theatre.approval_status !== 'approved' || screen.theatre.disabled)) {
      return res.json({
        success: false,
        message: "Theatre not available",
      });
    }

    res.json({ 
      success: true, 
      screen 
    });
  } catch (error) {
    console.error("[getScreenDetailsPublic]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get screens by theatre manager (for public display)
export const getScreensByManagerPublic = async (req, res) => {
  try {
    const { managerId } = req.params;

    if (!managerId) {
      return res.json({
        success: false,
        message: "Manager ID is required",
      });
    }

    // Find theatre by manager
    const theatre = await Theatre.findOne({ 
      manager_id: managerId,
      approval_status: 'approved',
      disabled: false
    });

    if (!theatre) {
      return res.json({
        success: false,
        message: "Theatre not found or not available",
      });
    }

    // Get all active screens for this theatre
    const screens = await ScreenTbl.find({
      theatre: theatre._id,
      isActive: true,
      status: 'active'
    })
    .select('name screenNumber seatLayout seatTiers isActive status')
    .sort({ name: 1 });

    res.json({ 
      success: true, 
      screens,
      theatre: {
        _id: theatre._id,
        name: theatre.name,
        location: theatre.location
      }
    });
  } catch (error) {
    console.error("[getScreensByManagerPublic]", error);
    res.json({ success: false, message: error.message });
  }
};