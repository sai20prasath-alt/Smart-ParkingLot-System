const mongoose = require('mongoose');

const parkingSpotSchema = new mongoose.Schema(
  {
    floor_number: {
      type: Number,
      required: [true, 'Floor number is required'],
      min: [1, 'Floor number must be positive'],
    },
    spot_number: {
      type: Number,
      required: [true, 'Spot number is required'],
      min: [1, 'Spot number must be positive'],
    },
    spot_type: {
      type: String,
      enum: {
        values: ['MOTORCYCLE', 'CAR', 'BUS'],
        message: 'Invalid spot type. Must be MOTORCYCLE, CAR, or BUS',
      },
      required: [true, 'Spot type is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'],
        message: 'Invalid status. Must be AVAILABLE, OCCUPIED, or MAINTENANCE',
      },
      default: 'AVAILABLE',
      index: true,
    },
    current_vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
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

// Compound index for unique spot identification
parkingSpotSchema.index({ floor_number: 1, spot_number: 1 }, { unique: true });

// Index for efficient spot allocation queries
parkingSpotSchema.index({ status: 1, spot_type: 1, floor_number: 1 });

const ParkingSpot = mongoose.model('ParkingSpot', parkingSpotSchema);

module.exports = ParkingSpot;
