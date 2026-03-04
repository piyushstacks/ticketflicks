import mongoose from "mongoose";

const upcomingMovieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    poster: {
        type: String, // URL to poster image
        required: true
    },
    release_date: {
        type: Date,
        required: true
    },
    trailer: {
        type: String // URL to trailer
    },
    genres: [{
        type: String
    }],
    createdByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    }
}, { timestamps: true });

const UpcomingMovie = mongoose.model("UpcomingMovie", upcomingMovieSchema);

export default UpcomingMovie;
