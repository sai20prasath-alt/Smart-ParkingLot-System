const mongoose = require('mongoose');

const rateCardSchema = new mongoose.Schema(
  {
    vehicle_type: {
      type: String,
      enum: {
        values: ['MOTORCYCLE', 'CAR', 'BUS'],
        message: 'Invalid vehicle type. Must be MOTORCYCLE, CAR, or BUS',
      },
      required: [true, 'Vehicle type is required'],
      unique: [true, 'Vehicle type must be unique in rate cards'],
      index: true,
    },
    hourly_rate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0, 'Hourly rate cannot be negative'],
      validate: {
        validator: (v) => !isNaN(v) && v >= 0,
        message: 'Hourly rate must be a valid positive number',
      },
    },
    daily_max_rate: {
      type: Number,
      default: null,
      min: [0, 'Daily max rate cannot be negative'],
      validate: {
        validator: function (v) {
          if (v === null) return true;
          return !isNaN(v) && v >= 0 && v >= this.hourly_rate;
        },
        message: 'Daily max rate must be >= hourly rate',
      },
    },
    rounding_strategy: {
      type: String,
      enum: {
        values: ['CEILING', 'FLOOR', 'ROUND'],
        message: 'Invalid rounding strategy. Must be CEILING, FLOOR, or ROUND',
      },
      default: 'CEILING',
    },
    grace_period_minutes: {
      type: Number,
      default: 15,
      min: [0, 'Grace period cannot be negative'],
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

const RateCard = mongoose.model('RateCard', rateCardSchema);

module.exports = RateCard;
