const mongoose = require('mongoose');

const parkingLotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Parking lot name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
      index: true,
    },
    total_floors: {
      type: Number,
      required: [true, 'Total floors is required'],
      min: [1, 'Total floors must be at least 1'],
    },
    total_spots: {
      type: Number,
      required: [true, 'Total spots is required'],
      min: [1, 'Total spots must be at least 1'],
    },
    available_motorcycle_spots: {
      type: Number,
      required: [true, 'Available motorcycle spots is required'],
      min: [0, 'Available motorcycle spots cannot be negative'],
    },
    available_car_spots: {
      type: Number,
      required: [true, 'Available car spots is required'],
      min: [0, 'Available car spots cannot be negative'],
    },
    available_bus_spots: {
      type: Number,
      required: [true, 'Available bus spots is required'],
      min: [0, 'Available bus spots cannot be negative'],
    },
    occupied_motorcycle_spots: {
      type: Number,
      default: 0,
      min: [0, 'Occupied spots cannot be negative'],
    },
    occupied_car_spots: {
      type: Number,
      default: 0,
      min: [0, 'Occupied spots cannot be negative'],
    },
    occupied_bus_spots: {
      type: Number,
      default: 0,
      min: [0, 'Occupied spots cannot be negative'],
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Virtual for occupancy rate
parkingLotSchema.virtual('occupancy_rate').get(function () {
  if (this.total_spots === 0) return 0;
  const totalOccupied =
    this.occupied_motorcycle_spots + this.occupied_car_spots + this.occupied_bus_spots;
  return (totalOccupied / this.total_spots).toFixed(2);
});

// Ensure virtuals are included in JSON output
parkingLotSchema.set('toJSON', { virtuals: true });

const ParkingLot = mongoose.model('ParkingLot', parkingLotSchema);

module.exports = ParkingLot;
