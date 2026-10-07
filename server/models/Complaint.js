import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    complainant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    againstUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride'
    },
    category: {
      type: String,
      enum: ['safety', 'payment', 'driver', 'rider', 'other'],
      default: 'other'
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['open', 'in-review', 'resolved', 'closed'],
      default: 'open'
    },
    adminNote: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
