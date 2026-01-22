const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    license_plate: {
      type: String,
      required: [true, 'License plate is required'],
      unique: [true, 'License plate must be unique'],
      trim: true,
      maxlength: [20, 'License plate cannot exceed 20 characters'],
      index: true,
    },
    vehicle_type: {
      type: String,
      enum: {
        values: ['MOTORCYCLE', 'CAR', 'BUS'],
        message: 'Invalid vehicle type. Must be MOTORCYCLE, CAR, or BUS',
      },
      required: [true, 'Vehicle type is required'],
      index: true,
    },
    owner_name: {
      type: String,
      trim: true,
      maxlength: [100, 'Owner name cannot exceed 100 characters'],
      default: null,
    },
    registration_number: {
      type: String,
      trim: true,
      maxlength: [50, 'Registration number cannot exceed 50 characters'],
      default: null,
    },
    is_currently_parked: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Index for quick lookup by license plate
vehicleSchema.index({ license_plate: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
