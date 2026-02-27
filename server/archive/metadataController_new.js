import Genre from "../models/Genre.js";
import Language from "../models/Language.js";
import Cast from "../models/Cast.js";

// ============== GENRE CONTROLLERS ==============

export const createGenre = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.json({ success: false, message: "Name is required" });

    const genre = await Genre.create({ name, description });
    res.json({ success: true, message: "Genre created", genre });
  } catch (error) {
    console.error("[createGenre]", error);
    res.json({ success: false, message: error.message });
  }
};

export const getAllGenres = async (req, res) => {
  try {
    const genres = await Genre.find().sort({ name: 1 });
    res.json({ success: true, genres });
  } catch (error) {
    console.error("[getAllGenres]", error);
    res.json({ success: false, message: error.message });
  }
};

export const updateGenre = async (req, res) => {
  try {
    const { genreId } = req.params;
    const updates = req.body;
    const genre = await Genre.findByIdAndUpdate(genreId, updates, { new: true });
    if (!genre) return res.json({ success: false, message: "Genre not found" });
    res.json({ success: true, genre });
  } catch (error) {
    console.error("[updateGenre]", error);
    res.json({ success: false, message: error.message });
  }
};

export const deleteGenre = async (req, res) => {
  try {
    const { genreId } = req.params;
    const genre = await Genre.findByIdAndDelete(genreId);
    if (!genre) return res.json({ success: false, message: "Genre not found" });
    res.json({ success: true, message: "Genre deleted" });
  } catch (error) {
    console.error("[deleteGenre]", error);
    res.json({ success: false, message: error.message });
  }
};

// ============== LANGUAGE CONTROLLERS ==============

export const createLanguage = async (req, res) => {
  try {
    const { name, code, region } = req.body;
    if (!name || !code) return res.json({ success: false, message: "Name and code are required" });

    const language = await Language.create({ name, code, region });
    res.json({ success: true, message: "Language created", language });
  } catch (error) {
    console.error("[createLanguage]", error);
    res.json({ success: false, message: error.message });
  }
};

export const getAllLanguages = async (req, res) => {
  try {
    const languages = await Language.find().sort({ name: 1 });
    res.json({ success: true, languages });
  } catch (error) {
    console.error("[getAllLanguages]", error);
    res.json({ success: false, message: error.message });
  }
};

export const updateLanguage = async (req, res) => {
  try {
    const { languageId } = req.params;
    const updates = req.body;
    const language = await Language.findByIdAndUpdate(languageId, updates, { new: true });
    if (!language) return res.json({ success: false, message: "Language not found" });
    res.json({ success: true, language });
  } catch (error) {
    console.error("[updateLanguage]", error);
    res.json({ success: false, message: error.message });
  }
};

export const deleteLanguage = async (req, res) => {
  try {
    const { languageId } = req.params;
    const language = await Language.findByIdAndDelete(languageId);
    if (!language) return res.json({ success: false, message: "Language not found" });
    res.json({ success: true, message: "Language deleted" });
  } catch (error) {
    console.error("[deleteLanguage]", error);
    res.json({ success: false, message: error.message });
  }
};

// ============== CAST CONTROLLERS ==============

export const createCast = async (req, res) => {
  try {
    const { name, bio, dob } = req.body;
    if (!name) return res.json({ success: false, message: "Name is required" });

    const cast = await Cast.create({ name, bio, dob });
    res.json({ success: true, message: "Cast member created", cast });
  } catch (error) {
    console.error("[createCast]", error);
    res.json({ success: false, message: error.message });
  }
};

export const getAllCast = async (req, res) => {
  try {
    const cast = await Cast.find().sort({ name: 1 });
    res.json({ success: true, cast });
  } catch (error) {
    console.error("[getAllCast]", error);
    res.json({ success: false, message: error.message });
  }
};

export const updateCast = async (req, res) => {
  try {
    const { castId } = req.params;
    const updates = req.body;
    const cast = await Cast.findByIdAndUpdate(castId, updates, { new: true });
    if (!cast) return res.json({ success: false, message: "Cast member not found" });
    res.json({ success: true, cast });
  } catch (error) {
    console.error("[updateCast]", error);
    res.json({ success: false, message: error.message });
  }
};

export const deleteCast = async (req, res) => {
  try {
    const { castId } = req.params;
    const cast = await Cast.findByIdAndDelete(castId);
    if (!cast) return res.json({ success: false, message: "Cast member not found" });
    res.json({ success: true, message: "Cast member deleted" });
  } catch (error) {
    console.error("[deleteCast]", error);
    res.json({ success: false, message: error.message });
  }
};

export default {
  createGenre, getAllGenres, updateGenre, deleteGenre,
  createLanguage, getAllLanguages, updateLanguage, deleteLanguage,
  createCast, getAllCast, updateCast, deleteCast,
};
