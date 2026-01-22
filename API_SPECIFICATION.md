# Smart Parking Lot System - API Specification

## Overview

This document defines all REST API endpoints for the Smart Parking Lot Backend System, including request/response schemas, error codes, and usage examples.

---

## Base URL

```
http://localhost:3000/api/v1
```

---

## Authentication

All endpoints require Bearer token authentication (to be implemented).

```
Header: Authorization: Bearer <token>
```

---

## 1. Vehicle Entry Endpoint

### POST /parking/entry

**Description**: Record vehicle entry and assign parking spot

**Request Body**:
```json
{
  "license_plate": "ABC-1234",
  "vehicle_type": "CAR",
  "owner_name": "John Doe",
  "registration_number": "REG-789"
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|---|---|---|---|
| license_plate | string | Yes | Unique vehicle identifier (max 20 chars) |
| vehicle_type | enum | Yes | MOTORCYCLE, CAR, or BUS |
| owner_name | string | No | Vehicle owner name |
| registration_number | string | No | Vehicle registration number |

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "transaction_id": "tx-550e8400-e29b-41d4-a716-446655440000",
    "vehicle_id": "vh-550e8400-e29b-41d4-a716-446655440001",
    "spot_id": "sp-550e8400-e29b-41d4-a716-446655440002",
    "spot_details": {
      "floor_number": 2,
      "spot_number": 15,
      "spot_type": "CAR"
    },
    "entry_time": "2026-01-22T14:30:00Z",
    "message": "Vehicle successfully parked at Floor 2, Spot 15"
  }
}
```

**Error Responses**:

| Code | Status | Message |
|---|---|---|
| NO_SPOT_AVAILABLE | 409 | No available parking spots for vehicle type |
| VEHICLE_ALREADY_PARKED | 409 | Vehicle is already parked in the lot |
| INVALID_VEHICLE_TYPE | 400 | Invalid vehicle type provided |
| INVALID_LICENSE_PLATE | 400 | Invalid or duplicate license plate |
| DATABASE_ERROR | 500 | Internal server error |
| LOCK_TIMEOUT | 503 | System busy, please retry |

**Example Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "NO_SPOT_AVAILABLE",
    "message": "No available parking spots for vehicle type CAR",
    "timestamp": "2026-01-22T14:30:00Z"
  }
}
```

---

## 2. Vehicle Exit Endpoint

### POST /parking/exit

**Description**: Record vehicle exit and calculate parking fee

**Request Body**:
```json
{
  "license_plate": "ABC-1234"
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|---|---|---|---|
| license_plate | string | Yes | Vehicle identifier |

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "transaction_id": "tx-550e8400-e29b-41d4-a716-446655440000",
    "vehicle_id": "vh-550e8400-e29b-41d4-a716-446655440001",
    "spot_id": "sp-550e8400-e29b-41d4-a716-446655440002",
    "entry_time": "2026-01-22T14:30:00Z",
    "exit_time": "2026-01-22T16:45:00Z",
    "duration_minutes": 135,
    "duration_formatted": "2 hours 15 minutes",
    "parking_fee": 24.00,
    "currency": "USD",
    "payment_status": "PENDING",
    "message": "Thank you for using our parking lot"
  }
}
```

**Response Fields**:
| Field | Type | Description |
|---|---|---|
| transaction_id | string | Unique transaction identifier |
| vehicle_id | string | Vehicle identifier |
| spot_id | string | Spot that was occupied |
| entry_time | ISO8601 | Check-in timestamp |
| exit_time | ISO8601 | Check-out timestamp |
| duration_minutes | integer | Total parking duration in minutes |
| duration_formatted | string | Human-readable duration |
| parking_fee | decimal | Calculated fee amount |
| currency | string | Fee currency (USD) |
| payment_status | enum | PENDING, PAID, CANCELLED |

**Error Responses**:

| Code | Status | Message |
|---|---|---|
| VEHICLE_NOT_FOUND | 404 | Vehicle is not parked in the lot |
| INVALID_LICENSE_PLATE | 400 | Invalid license plate format |
| ALREADY_EXITED | 409 | Vehicle has already exited |
| DATABASE_ERROR | 500 | Internal server error |

**Example Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VEHICLE_NOT_FOUND",
    "message": "Vehicle with license plate ABC-1234 is not currently parked",
    "timestamp": "2026-01-22T16:45:00Z"
  }
}
```

---

## 3. Check Parking Availability Endpoint

### GET /parking/spots/availability

**Description**: Get real-time availability of parking spots

**Query Parameters**:
| Parameter | Type | Optional | Description |
|---|---|---|---|
| vehicle_type | enum | Yes | MOTORCYCLE, CAR, BUS (returns all if not specified) |
| floor_number | integer | Yes | Specific floor (returns all if not specified) |

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "total_available_spots": 47,
    "total_occupied_spots": 153,
    "total_spots": 200,
    "occupancy_rate": 0.765,
    "availability_by_type": {
      "MOTORCYCLE": {
        "available": 12,
        "occupied": 38,
        "total": 50,
        "occupancy_rate": 0.76
      },
      "CAR": {
        "available": 25,
        "occupied": 100,
        "total": 125,
        "occupancy_rate": 0.8
      },
      "BUS": {
        "available": 10,
        "occupied": 15,
        "total": 25,
        "occupancy_rate": 0.6
      }
    },
    "availability_by_floor": {
      "1": {
        "available": 15,
        "occupied": 35,
        "total": 50
      },
      "2": {
        "available": 18,
        "occupied": 32,
        "total": 50
      },
      "3": {
        "available": 14,
        "occupied": 36,
        "total": 50
      }
    },
    "timestamp": "2026-01-22T16:45:00Z"
  }
}
```

**Filtered Response (by vehicle_type=CAR)**:
```json
{
  "success": true,
  "data": {
    "vehicle_type_filter": "CAR",
    "available_spots": 25,
    "occupied_spots": 100,
    "total_spots": 125,
    "occupancy_rate": 0.8,
    "available_floor_distribution": {
      "1": 8,
      "2": 10,
      "3": 7
    },
    "timestamp": "2026-01-22T16:45:00Z"
  }
}
```

---

## 4. Get Vehicle Status Endpoint

### GET /parking/vehicle/{license_plate}/status

**Description**: Get current parking status of a vehicle

**Path Parameters**:
| Parameter | Type | Description |
|---|---|---|
| license_plate | string | Vehicle license plate |

**Success Response (200 OK) - Currently Parked**:
```json
{
  "success": true,
  "data": {
    "vehicle_id": "vh-550e8400-e29b-41d4-a716-446655440001",
    "license_plate": "ABC-1234",
    "vehicle_type": "CAR",
    "is_parked": true,
    "parking_details": {
      "transaction_id": "tx-550e8400-e29b-41d4-a716-446655440000",
      "spot_id": "sp-550e8400-e29b-41d4-a716-446655440002",
      "floor_number": 2,
      "spot_number": 15,
      "entry_time": "2026-01-22T14:30:00Z",
      "current_duration_minutes": 135,
      "estimated_fee": 24.00,
      "parking_started": "2 hours 15 minutes ago"
    }
  }
}
```

**Success Response (200 OK) - Not Parked**:
```json
{
  "success": true,
  "data": {
    "vehicle_id": "vh-550e8400-e29b-41d4-a716-446655440001",
    "license_plate": "ABC-1234",
    "vehicle_type": "CAR",
    "is_parked": false,
    "last_parking": {
      "transaction_id": "tx-550e8400-e29b-41d4-a716-446655440000",
      "entry_time": "2026-01-22T14:30:00Z",
      "exit_time": "2026-01-22T16:45:00Z",
      "duration_minutes": 135,
      "parking_fee": 24.00
    }
  }
}
```

**Error Response (404)**:
```json
{
  "success": false,
  "error": {
    "code": "VEHICLE_NOT_FOUND",
    "message": "No vehicle found with license plate ABC-1234",
    "timestamp": "2026-01-22T16:45:00Z"
  }
}
```

---

## 5. Fee Calculation (Estimation) Endpoint

### POST /parking/fees/calculation

**Description**: Calculate estimated or final parking fee

**Request Body**:
```json
{
  "vehicle_type": "CAR",
  "entry_time": "2026-01-22T14:30:00Z",
  "exit_time": "2026-01-22T16:45:00Z"
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|---|---|---|---|
| vehicle_type | enum | Yes | MOTORCYCLE, CAR, or BUS |
| entry_time | ISO8601 | Yes | Parking entry timestamp |
| exit_time | ISO8601 | Yes | Parking exit timestamp (or current time for estimation) |

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "vehicle_type": "CAR",
    "entry_time": "2026-01-22T14:30:00Z",
    "exit_time": "2026-01-22T16:45:00Z",
    "duration_minutes": 135,
    "duration_formatted": "2 hours 15 minutes",
    "rate_card": {
      "hourly_rate": 8.00,
      "daily_max_rate": 50.00,
      "grace_period_minutes": 15,
      "rounding_strategy": "CEILING"
    },
    "calculation_details": {
      "grace_period_applied": 15,
      "adjusted_minutes": 120,
      "hourly_units": 2,
      "base_fee": 16.00,
      "daily_cap_applied": false,
      "final_fee": 16.00
    },
    "parking_fee": 16.00,
    "currency": "USD"
  }
}
```

**Detailed Calculation Fields**:
| Field | Description |
|---|---|
| grace_period_applied | Minutes of free parking |
| adjusted_minutes | Duration after grace period |
| hourly_units | Number of hours (rounded) |
| base_fee | Fee before daily cap |
| daily_cap_applied | Whether daily maximum was applied |
| final_fee | Final payable amount |

---

## 6. Parking Lot Statistics Endpoint

### GET /parking/statistics

**Description**: Get overall parking lot statistics

**Query Parameters**:
| Parameter | Type | Optional | Description |
|---|---|---|---|
| time_period | enum | Yes | HOURLY, DAILY, WEEKLY (default: DAILY) |

**Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "statistics_period": "DAILY",
    "date": "2026-01-22",
    "vehicles_entered": 342,
    "vehicles_exited": 298,
    "current_vehicles_parked": 44,
    "peak_occupancy_rate": 0.85,
    "average_occupancy_rate": 0.72,
    "total_revenue": 2847.50,
    "revenue_by_vehicle_type": {
      "MOTORCYCLE": 185.00,
      "CAR": 1952.50,
      "BUS": 710.00
    },
    "average_parking_duration_minutes": 142,
    "average_parking_fee": 9.54,
    "high_demand_periods": [
      "08:00-09:00",
      "12:00-13:00",
      "17:00-18:00"
    ]
  }
}
```

---

## 7. Error Codes Reference

| Code | HTTP Status | Description |
|---|---|---|
| SUCCESS | 200 | Operation successful |
| BAD_REQUEST | 400 | Invalid input parameters |
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (duplicate, invalid state) |
| LOCK_TIMEOUT | 503 | System lock timeout, retry later |
| INTERNAL_ERROR | 500 | Internal server error |

---

## 8. Rate Limiting

- **Limit**: 1000 requests per minute per API key
- **Header**: `X-RateLimit-Remaining`
- **Reset**: Resets every minute
- **Response**: 429 Too Many Requests

---

## 9. Response Format

All responses follow this standard format:

**Success Response**:
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "timestamp": "ISO8601 timestamp"
  }
}
```

---

## 10. Usage Examples

### Example 1: Complete Parking Session

```bash
# Vehicle Entry
curl -X POST http://localhost:3000/api/v1/parking/entry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "license_plate": "ABC-1234",
    "vehicle_type": "CAR",
    "owner_name": "John Doe"
  }'

# Check Availability (optional)
curl -X GET "http://localhost:3000/api/v1/parking/spots/availability?vehicle_type=CAR" \
  -H "Authorization: Bearer <token>"

# Check Vehicle Status
curl -X GET http://localhost:3000/api/v1/parking/vehicle/ABC-1234/status \
  -H "Authorization: Bearer <token>"

# Vehicle Exit
curl -X POST http://localhost:3000/api/v1/parking/exit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "license_plate": "ABC-1234"
  }'
```

---

**API Version**: 1.0
**Last Updated**: January 22, 2026
**Status**: Review Ready
