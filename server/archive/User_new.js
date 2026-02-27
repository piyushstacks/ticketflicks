import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  phone: { 
    type: String, 
    required: true, 
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit phone number!`
    }
  },
  password_hash: { 
    type: String, 
    required: true, 
    select: false 
  },
  role: { 
    type: String, 
    required: true, 
    enum: ["customer", "manager", "admin"] 
  },
  last_login: { 
    type: Date 
  }
}, { timestamps: true });

const UserNew = mongoose.model("UserNew", userSchema, "users_new");

export default UserNew;
