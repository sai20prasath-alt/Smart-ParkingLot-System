const mongoose = require('mongoose');

const parkingTransactionSchema = new mongoose.Schema(
  {
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
      index: true,
    },
    spot_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSpot',
      required: [true, 'Spot ID is required'],
      index: true,
    },
    entry_time: {
      type: Date,
      required: [true, 'Entry time is required'],
      index: true,
    },
    exit_time: {
      type: Date,
      default: null,
      index: true,
    },
    duration_minutes: {
      type: Number,
      default: null,
      min: [0, 'Duration cannot be negative'],
    },
    parking_fee: {
      type: Number,
      default: null,
      min: [0, 'Parking fee cannot be negative'],
    },
    payment_status: {
      type: String,
      enum: {
        values: ['PENDING', 'PAID', 'CANCELLED'],
        message: 'Invalid payment status. Must be PENDING, PAID, or CANCELLED',
      },
      default: 'PENDING',
      index: true,
    },
    payment_method: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Compound index for time-based queries
parkingTransactionSchema.index({ entry_time: 1, exit_time: 1 });

// Index for payment status filtering
parkingTransactionSchema.index({ payment_status: 1, updated_at: -1 });

// Index for vehicle history
parkingTransactionSchema.index({ vehicle_id: 1, entry_time: -1 });

const ParkingTransaction = mongoose.model('ParkingTransaction', parkingTransactionSchema);

module.exports = ParkingTransaction;
