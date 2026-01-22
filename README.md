# Smart Parking Lot System - Backend Architecture

## Project Overview

A low-level backend system designed to efficiently manage vehicle entry and exit in a multi-floor urban parking lot. The system automates parking space allocation, tracks vehicle duration, and calculates parking fees in real-time.

## Functional Requirements

### 1. Parking Spot Allocation
- **Automatic Assignment**: Assign available parking spots based on vehicle size
- **Vehicle Types**: Support for motorcycle, car, and bus
- **Spot Categories**:
  - Motorcycle Spots: 1 space unit
  - Car Spots: 1 space unit
  - Bus Spots: 2 space units (can accommodate cars or motorcycles)
- **Optimization**: Efficiently match vehicle size to available spots to minimize space waste

### 2. Check-In and Check-Out
- **Entry Recording**: Capture vehicle entry with timestamp and assigned spot
- **Exit Recording**: Capture vehicle exit with timestamp
- **Duration Tracking**: Calculate total parking duration
- **Real-time Validation**: Prevent conflicts and double-bookings

### 3. Parking Fee Calculation
- **Duration-Based Pricing**: Calculate fees based on parking duration
- **Vehicle Type Pricing**: Different rates for different vehicle types
- **Variable Pricing Models**: Support for hourly, daily, or tiered rates
- **Accurate Computation**: Round-up or round-down rules for partial hours

### 4. Real-Time Availability Update
- **Live Status Updates**: Update spot availability immediately on entry/exit
- **Concurrent Operations**: Handle multiple simultaneous entries/exits
- **Availability Queries**: Provide real-time spot availability for incoming vehicles

## Design Considerations

### Data Model
- **Parking Spot Entity**: Floor, spot number, size type, status, vehicle ID
- **Vehicle Entity**: Vehicle ID, type, entry time, exit time, assigned spot
- **Parking Transaction Entity**: Vehicle info, entry time, exit time, duration, fee
- **Rate Card Entity**: Vehicle type, hourly rate, daily cap, pricing rules

### Allocation Algorithm
- **First-Fit Strategy**: Find first available spot matching vehicle size
- **Best-Fit Strategy**: Find smallest available spot that fits the vehicle
- **Optimization**: Minimize fragmentation, maximize space utilization
- **Time Complexity**: O(n) where n is number of available spots

### Fee Calculation Logic
- **Duration Calculation**: Exit time - Entry time
- **Hourly Rate Calculation**: Duration / 60 * hourly_rate
- **Rounding Rules**: Ceiling function (round up) for partial hours
- **Vehicle Type Multiplier**: Apply type-specific rate multipliers
- **Daily Caps**: Maximum fee per day if applicable

### Concurrency Handling
- **Database Transactions**: ACID properties for spot allocation
- **Optimistic Locking**: Version-based conflict detection
- **Pessimistic Locking**: Lock spots during allocation
- **Message Queues**: Decouple entry/exit operations if needed
- **Thread Safety**: Use locks for shared resources in multi-threaded environment

## System Architecture Layers

```
┌─────────────────────────────────┐
│    API Gateway / Controllers    │
├─────────────────────────────────┤
│    Business Logic Services      │
├─────────────────────────────────┤
│    Data Access Layer / Repos    │
├─────────────────────────────────┤
│    Database (SQL/NoSQL)         │
└─────────────────────────────────┘
```

## Key Components

1. **Vehicle Entry Service**: Handle check-in, spot allocation
2. **Vehicle Exit Service**: Handle check-out, fee calculation
3. **Parking Spot Manager**: Track and manage spot availability
4. **Fee Calculator**: Compute parking charges
5. **Database Repository**: Data persistence and queries

## Technology Stack (Recommended)

- **Backend Framework**: Node.js with Express.js
- **Database**: PostgreSQL (relational) or MongoDB (document-based)
- **Caching**: Redis for real-time availability tracking
- **Concurrency**: Thread pools, transaction management
- **Logging**: Winston or Bunyan

## API Endpoints (Preview)

- `POST /parking/entry` - Vehicle entry and spot allocation
- `POST /parking/exit` - Vehicle exit and fee calculation
- `GET /parking/spots/availability` - Check available spots
- `GET /parking/vehicle/:vehicleId/status` - Vehicle parking status
- `GET /parking/fees/calculation` - Calculate estimated fees

## Next Steps

1. Define detailed database schema
2. Implement allocation algorithms
3. Create fee calculation engine
4. Design API contracts
5. Implement concurrency handling
6. Create unit and integration tests

---

**Status**: Architecture Design Phase
**Last Updated**: January 22, 2026
