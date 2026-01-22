# Smart Parking Lot System - Technical Design Document

## Executive Summary

This document outlines the low-level technical architecture for a smart parking lot backend system. It provides detailed specifications for data models, algorithms, and system interactions.

---

## 1. Data Model & Database Schema

### 1.1 Database Entities

#### ParkingSpot Table
```sql
CREATE TABLE parking_spots (
  spot_id INT AUTO_INCREMENT PRIMARY KEY,
  floor_number INT NOT NULL,
  spot_number INT NOT NULL,
  spot_type ENUM('MOTORCYCLE', 'CAR', 'BUS') NOT NULL,
  status ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE') DEFAULT 'AVAILABLE',
  current_vehicle_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(floor_number, spot_number),
  INDEX idx_status (status),
  INDEX idx_spot_type (spot_type)
);
```

#### Vehicle Table
```sql
CREATE TABLE vehicles (
  vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
  license_plate VARCHAR(20) UNIQUE NOT NULL,
  vehicle_type ENUM('MOTORCYCLE', 'CAR', 'BUS') NOT NULL,
  owner_name VARCHAR(100),
  registration_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_license_plate (license_plate)
);
```

#### ParkingTransaction Table
```sql
CREATE TABLE parking_transactions (
  transaction_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  spot_id INT NOT NULL,
  entry_time TIMESTAMP NOT NULL,
  exit_time TIMESTAMP,
  duration_minutes INT,
  parking_fee DECIMAL(10, 2),
  payment_status ENUM('PENDING', 'PAID', 'CANCELLED') DEFAULT 'PENDING',
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
  FOREIGN KEY (spot_id) REFERENCES parking_spots(spot_id),
  INDEX idx_vehicle_id (vehicle_id),
  INDEX idx_spot_id (spot_id),
  INDEX idx_entry_time (entry_time),
  INDEX idx_exit_time (exit_time),
  INDEX idx_payment_status (payment_status)
);
```

#### RateCard Table
```sql
CREATE TABLE rate_cards (
  rate_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_type ENUM('MOTORCYCLE', 'CAR', 'BUS') NOT NULL,
  hourly_rate DECIMAL(10, 2) NOT NULL,
  daily_max_rate DECIMAL(10, 2),
  rounding_strategy ENUM('CEILING', 'FLOOR', 'ROUND') DEFAULT 'CEILING',
  grace_period_minutes INT DEFAULT 15,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(vehicle_type),
  INDEX idx_vehicle_type (vehicle_type)
);
```

#### ParkingLot Table
```sql
CREATE TABLE parking_lots (
  lot_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  total_floors INT NOT NULL,
  total_spots INT NOT NULL,
  available_motorcycle_spots INT,
  available_car_spots INT,
  available_bus_spots INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
);
```

### 1.2 Indexing Strategy & AUTO_INCREMENT Benefits

**Why AUTO_INCREMENT INT Over UUID:**
- **Storage**: 8 bytes vs 16 bytes per ID (50% storage reduction)
- **Performance**: Sequential access patterns improve cache locality
- **Query Speed**: Faster joins and lookups due to smaller data type
- **Simplicity**: Easier to debug, log, and reference in monitoring
- **Ideal For**: Single parking lot backend without distributed requirements

**Index Strategy:**
- **Primary Indexes**: All AUTO_INCREMENT primary keys (clustered indexes)
- **Foreign Key Indexes**: vehicle_id, spot_id in transactions
- **Time-Based Indexes**: entry_time, exit_time for range queries
- **Composite Indexes**: (floor_number, spot_number) for unique spot lookups
- **Status Indexes**: status, payment_status for filtering queries
- **Lookup Indexes**: license_plate, vehicle_type, spot_type for quick searches

---

## 2. Parking Spot Allocation Algorithm

### 2.1 Allocation Strategy: Best-Fit with Size Priority

```
ALGORITHM: AllocateSpot(vehicleType, currentTime)
INPUT: Vehicle type (MOTORCYCLE, CAR, BUS), Current timestamp
OUTPUT: Assigned spot_id or NULL if no spot available

1. Determine eligible spot sizes based on vehicle type:
   - MOTORCYCLE: Can use MOTORCYCLE, CAR, or BUS spots
   - CAR: Can use CAR or BUS spots
   - BUS: Can only use BUS spots

2. Query available spots by size priority (best-fit):
   - Retrieve first available spot matching minimum required size
   - Prefer spots on lower floors (faster access)

3. Lock the selected spot (optimistic/pessimistic locking)

4. Verify spot is still available (double-check)

5. Create parking transaction record:
   - spot_id = selected spot
   - vehicle_id = vehicle
   - entry_time = currentTime
   - status = OCCUPIED

6. Update ParkingSpot:
   - status = OCCUPIED
   - current_vehicle_id = vehicle_id

7. Update ParkingLot available counts:
   - Decrement appropriate spot type counter

8. Return spot_id and entry details

9. On Failure:
   - Release lock
   - Return NULL or error message
```

### 2.2 Optimization Considerations

- **Spot Fragmentation**: Minimize by assigning smallest suitable spot first
- **Floor Distribution**: Balance vehicles across floors to avoid congestion
- **Access Speed**: Prioritize lower floors for quicker exit processing
- **Time Complexity**: O(1) average with proper indexing (hash-based lookups)

---

## 3. Fee Calculation Logic

### 3.1 Fee Calculation Algorithm

```
ALGORITHM: CalculateParkingFee(vehicleType, entryTime, exitTime)
INPUT: Vehicle type, entry timestamp, exit timestamp
OUTPUT: Calculated parking fee (decimal)

1. Retrieve rate card for vehicle type:
   - hourly_rate = RateCard[vehicleType].hourly_rate
   - daily_max_rate = RateCard[vehicleType].daily_max_rate
   - grace_period = RateCard[vehicleType].grace_period_minutes
   - rounding_strategy = RateCard[vehicleType].rounding_strategy

2. Calculate duration:
   - duration_ms = exitTime - entryTime
   - duration_minutes = FLOOR(duration_ms / 60000)

3. Apply grace period:
   - IF duration_minutes <= grace_period:
       fee = 0
   - ELSE:
       adjusted_minutes = duration_minutes - grace_period

4. Calculate hourly units with rounding:
   - IF rounding_strategy == 'CEILING':
       hourly_units = CEILING(adjusted_minutes / 60)
   - ELSE IF rounding_strategy == 'FLOOR':
       hourly_units = FLOOR(adjusted_minutes / 60)
   - ELSE:
       hourly_units = ROUND(adjusted_minutes / 60)

5. Calculate base fee:
   - base_fee = hourly_units * hourly_rate

6. Apply daily cap (if applicable):
   - IF daily_max_rate IS NOT NULL AND base_fee > daily_max_rate:
       final_fee = daily_max_rate
   - ELSE:
       final_fee = base_fee

7. Round to 2 decimal places

8. Return final_fee
```

### 3.2 Pricing Example

| Vehicle Type | Hourly Rate | Daily Max | Grace Period |
|---|---|---|---|
| Motorcycle | $5.00 | $30.00 | 15 min |
| Car | $8.00 | $50.00 | 15 min |
| Bus | $15.00 | $100.00 | 15 min |

**Example Calculation**:
- Vehicle: Car, Entry: 10:00 AM, Exit: 12:35 PM
- Duration: 155 minutes
- Grace Period: 15 minutes → Adjusted: 140 minutes
- Hourly Units (ceiling): CEIL(140/60) = 3 hours
- Fee: 3 × $8.00 = $24.00
- Daily Max Check: $24.00 < $50.00 → Final Fee: $24.00

---

## 4. Concurrency Handling

### 4.1 Concurrency Strategy

#### Row-Level Locking (Pessimistic)
```sql
-- Allocate Spot with Lock
SELECT * FROM parking_spots 
WHERE spot_type = ? AND status = 'AVAILABLE' 
ORDER BY floor_number ASC, spot_number ASC 
LIMIT 1 
FOR UPDATE;
```

**Pros**: Prevents simultaneous allocation
**Cons**: Potential deadlocks, reduced throughput

#### Optimistic Locking
```sql
-- Version-based conflict detection
UPDATE parking_spots 
SET status = 'OCCUPIED', current_vehicle_id = ?, version = version + 1 
WHERE spot_id = ? AND version = ? AND status = 'AVAILABLE';
```

**Pros**: Higher throughput, no deadlocks
**Cons**: Requires retry logic

#### Transaction Isolation Levels
- **Repeatable Read**: Default for MySQL/PostgreSQL
- **Serializable**: For critical operations (increased overhead)
- **Read Committed**: For non-critical reads

### 4.2 Concurrency Handling Points

1. **Entry Operation**:
   - Lock spot during allocation
   - Use transaction to create spot + transaction record atomically
   - Implement exponential backoff retry on conflict

2. **Exit Operation**:
   - Lock transaction record
   - Ensure only one exit per vehicle
   - Atomic update of transaction, spot status, and lot counts

3. **Availability Query**:
   - No lock required (read-only)
   - Use Redis cache for frequent queries
   - Cache TTL: 5-10 seconds

### 4.3 Deadlock Prevention

- **Lock Ordering**: Always lock spots in ascending spot_id order
- **Timeout**: Set lock timeout to prevent indefinite blocking
- **Rollback Strategy**: Automatic rollback on deadlock with retry
- **Monitoring**: Track deadlock occurrences for optimization

---

## 5. System Workflows

### 5.1 Vehicle Entry Workflow

```
1. Vehicle Arrives → POST /parking/entry
2. Validate vehicle type and license plate
3. Check if vehicle already parked (prevent double entry)
4. Call AllocateSpot(vehicleType)
5. Lock selected spot (pessimistic locking)
6. Verify spot still available (double-check)
7. Create ParkingTransaction record
8. Update ParkingSpot status to OCCUPIED
9. Decrement available spot count in ParkingLot
10. Return spot details and confirmation
11. Release lock
```

### 5.2 Vehicle Exit Workflow

```
1. Vehicle Exits → POST /parking/exit
2. Validate vehicle and look up current transaction
3. Lock transaction record
4. Verify vehicle is actually parked
5. Calculate parking duration
6. Call CalculateParkingFee()
7. Update ParkingTransaction:
   - Set exit_time
   - Set duration_minutes
   - Set parking_fee
   - Set payment_status to PENDING
8. Update ParkingSpot status to AVAILABLE
9. Increment available spot count in ParkingLot
10. Return fee and payment details
11. Release lock
```

### 5.3 Availability Query Workflow

```
1. Query Request → GET /parking/spots/availability
2. Check Redis cache for available spots
3. If cache hit, return cached data
4. If cache miss:
   - Query database for available spots by type
   - Group by floor and type
   - Cache results (TTL: 5-10 seconds)
   - Return to client
```

---

## 6. Error Handling & Edge Cases

### 6.1 Error Scenarios

| Scenario | Handling |
|---|---|
| No available spots | Return 409 Conflict; suggest nearby lots |
| Vehicle already parked | Return 400 Bad Request |
| Duplicate license plate in system | Return 409 Conflict |
| Invalid vehicle type | Return 400 Bad Request |
| Lock timeout on allocation | Retry with exponential backoff (3 attempts) |
| Database connection failure | Return 500 with retry instructions |

### 6.2 Edge Cases

1. **Spot Fragmentation**: Ensure allocation considers spot size hierarchy
2. **Grace Period**: Zero fee if stay within grace period
3. **Partial Hours**: Always round up for fairness
4. **Daily Caps**: Cannot exceed daily maximum regardless of duration
5. **Concurrent Entries**: Multiple vehicles entering simultaneously
6. **Spot Maintenance**: Handle unavailable spots gracefully

---

## 7. Performance Considerations

### 7.1 Query Optimization

- **Available Spot Query**: Index on (status, spot_type, floor_number)
- **Transaction Lookups**: Index on vehicle_id and timestamp range
- **Historical Queries**: Partition transaction table by date/month

### 7.2 Caching Strategy

| Data | Cache | TTL |
|---|---|---|
| Available spot counts | Redis | 5-10 seconds |
| Rate cards | Redis | 1 hour (invalidate on update) |
| Recent transactions | Redis | 5 minutes |
| Spot details | Redis | 30 minutes |

### 7.3 Scalability

- **Horizontal Scaling**: Implement for stateless services
- **Database Sharding**: Shard by parking_lot_id for multi-lot systems
- **Message Queues**: Use for asynchronous fee calculation/payment
- **Load Balancing**: Distribute API traffic across multiple servers

---

## 8. Monitoring & Logging

### 8.1 Metrics to Track

- Allocation latency (p50, p95, p99)
- Failed allocations rate
- Concurrent vehicle count
- Spot utilization rate
- Fee calculation accuracy
- Lock contention/deadlocks

### 8.2 Logging Points

- Entry allocation attempts and success/failure
- Exit processing and fee calculations
- Lock acquisition and release
- Database errors and retries
- Concurrency conflicts

---

## 9. Testing Strategy

- **Unit Tests**: Algorithms, fee calculation, utility functions
- **Integration Tests**: Entry/exit workflows, database operations
- **Concurrency Tests**: Multiple simultaneous operations
- **Load Tests**: Peak hour simulation
- **Edge Case Tests**: All error scenarios

---

**Document Version**: 1.0
**Last Updated**: January 22, 2026
**Status**: Design Review Ready
