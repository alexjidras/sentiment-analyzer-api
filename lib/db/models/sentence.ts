import mongoose from 'mongoose';
import { Schema } from "mongoose";

const sentenceSchema = new Schema({
    timestamp: {
      type: String,
      required: true
    },
    sentence: {
        type: String,
        required: true,
      },
      result: {
        type: String,
        required: true
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
})

export default mongoose.model("Sentence", sentenceSchema, "Sentences");