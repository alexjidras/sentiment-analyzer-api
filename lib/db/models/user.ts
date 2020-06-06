import mongoose from 'mongoose';
import { Schema } from "mongoose";
import { isEmail } from '../../utils';

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 4,
        unique: true,
        validate: {
          validator: isEmail,
          message: '{VALUE} is not a valid email'
        }
      },
      name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3
      },
      password: {
        type: String,
        required: true,
        minlength: 6
      },
})

export default mongoose.model("User", userSchema, "Users");