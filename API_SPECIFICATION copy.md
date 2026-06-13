# ☕ Digital Coffee QSR Digital Ecosystem — API Specification

This document details the REST API endpoints and WebSocket event formats designed to connect the frontend-only coffee QSR ecosystem ("Digital Coffee") to an enterprise production backend.

---

## 1. Authentication Service (`/api/auth`)

Handles customer OTP verification and secure role-based access control (RBAC) authentication for Admin, Barista, and Kiosk roles.

### A. Customer OTP Login Request
Sends a temporary OTP to the customer's phone number.
* **URL**: `/api/auth/customer/login`
* **Method**: `POST`
* **Request Body**:
  ```json
  {
    "mobileNumber": "9876543210"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "OTP sent successfully to +91 ******3210"
  }
  ```

### B. Customer OTP Verification
Verifies the OTP and issues a JWT token.
* **URL**: `/api/auth/customer/verify-otp`
* **Method**: `POST`
* **Request Body**:
  ```json
  {
    "mobileNumber": "9876543210",
    "otp": "1234"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "USR-109",
      "mobile": "9876543210",
      "name": "Abhishek Roy",
      "loyaltyPoints": 420,
      "role": "Customer"
    }
  }
  ```

### C. Admin & Operator Login
Frictionless secure login for enterprise administrative portals and operator display consoles.
* **URL**: `/api/auth/operator/login`
* **Method**: `POST`
* **Request Body**:
  ```json
  {
    "email": "admin@digitalcoffee.com",
    "password": "Password123",
    "captchaCode": "B4Y8"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "operator": {
      "id": "OP-882",
      "name": "Vikram Sen",
      "email": "admin@digitalcoffee.com",
      "role": "admin",
      "storeId": "ST-BLR01"
    }
  }
  ```

---

## 2. Product & Menu Service (`/api/products`)

Manages the digital coffee menu catalog, customization configurations, and pricing engines.

### A. Get Menu Catalog
* **URL**: `/api/products`
* **Method**: `GET`
* **Headers**: `Authorization: Bearer <token>`
* **Query Params**:
  * `category` (optional): `Hot Coffee` | `Cold Coffee` | `Bakery` | `Merch`
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "PRD-01",
      "title": "Classic Cappuccino",
      "shortDescription": "Vibrant single-origin espresso pulled over velvety microfoam.",
      "category": "Hot Coffee",
      "price": 200,
      "rating": 4.8,
      "reviewCount": 142,
      "imageUrl": "https://images.unsplash.com/photo-1534778101976-62847782c213",
      "tags": ["Best Seller", "Artisanal"],
      "inStock": true,
      "variants": [
        { "id": "V-CAP-S", "name": "Small (250ml)", "price": 200 },
        { "id": "V-CAP-STD", "name": "Standard (360ml)", "price": 230 }
      ]
    }
  ]
  ```

### B. Create Menu Item (Admin)
* **URL**: `/api/products`
* **Method**: `POST`
* **Request Body**:
  ```json
  {
    "title": "Vanilla Cold Brew Concentrate",
    "shortDescription": "Slow extracted over 18 hours.",
    "category": "Cold Coffee",
    "price": 240,
    "inStock": true,
    "variants": [
      { "name": "300ml Glass Bottle", "price": 240 },
      { "name": "1L Enterprise Pack", "price": 680 }
    ]
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "id": "PRD-903",
    "title": "Vanilla Cold Brew Concentrate",
    "message": "Product created successfully."
  }
  ```

---

## 3. Order & KDS Dispatch Service (`/api/orders`)

Manages life-cycle states of customer orders, cart calculations, and real-time Barista KDS updates.

### A. Place New Order (Checkout)
* **URL**: `/api/orders`
* **Method**: `POST`
* **Request Body**:
  ```json
  {
    "customer": "Rohan Gupta",
    "items": [
      { "productId": "PRD-01", "variantId": "V-CAP-M", "qty": 1, "price": 230 }
    ],
    "source": "Kiosk",
    "totalAmount": 230,
    "gstAmount": 11.5,
    "grandTotal": 241.5,
    "notes": "Extra hot microfoam, please."
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "orderId": "T-104",
    "estimatedWaitMinutes": 8,
    "receiptUrl": "https://receipts.digitalcoffee.com/T-104.pdf"
  }
  ```

### B. Update Barista Ticket Status (KDS Kanban)
Advances the order through KDS columns (`Pending` $\rightarrow$ `In Progress` $\rightarrow$ `Ready` $\rightarrow$ `Completed`).
* **URL**: `/api/orders/:id/status`
* **Method**: `PUT`
* **Request Body**:
  ```json
  {
    "status": "In Progress"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "orderId": "T-104",
    "status": "In Progress",
    "updatedAt": "2026-05-21T23:44:00Z"
  }
  ```

### C. Issue Customer Order Refund
* **URL**: `/api/orders/:id/refund`
* **Method**: `POST`
* **Success Response (200 OK)**:
  ```json
  {
    "orderId": "OD-8732",
    "status": "Refunded",
    "refundReference": "REF-UPI-884210"
  }
  ```

---

## 4. Inventory, Ingredients & Waste Service (`/api/inventory`)

Provides raw-material management, expiration alerts, and dynamic threshold controls.

### A. Get Stocks levels
* **URL**: `/api/inventory/stocks`
* **Method**: `GET`
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "ING-01",
      "name": "Single-Origin Arabica Beans",
      "category": "Coffee Beans",
      "stockLevel": 45.5,
      "unit": "kg",
      "threshold": 10.0,
      "status": "Healthy"
    },
    {
      "id": "ING-02",
      "name": "Barista Grade Oat Milk",
      "category": "Milk Bases",
      "stockLevel": 4.0,
      "unit": "L",
      "threshold": 8.0,
      "status": "Low Stock"
    }
  ]
  ```

### B. Log Raw Material Waste
* **URL**: `/api/inventory/waste`
* **Method**: `POST`
* **Request Body**:
  ```json
  {
    "ingredientId": "ING-02",
    "amountLost": 2.5,
    "unit": "L",
    "reason": "Container leaked near cooler bar"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "wasteLogId": "WST-984"
  }
  ```

---

## 5. Enterprise Analytics Dashboard Service (`/api/analytics`)

Delivers high-fidelity sales, preparation, and operational efficiency metrics.

### A. Get Executive KPIs
* **URL**: `/api/analytics/dashboard`
* **Method**: `GET`
* **Success Response (200 OK)**:
  ```json
  {
    "kpis": {
      "revenueTotal": 458200,
      "revenueChangePercent": 14.8,
      "ordersTotal": 1420,
      "ordersChangePercent": 8.2,
      "averagePrepSeconds": 248,
      "wasteRatioPercent": 3.4
    }
  }
  ```

### B. Get Hourly Sales Trend
* **URL**: `/api/analytics/trends/sales`
* **Method**: `GET`
* **Query Params**:
  * `period`: `today` | `week` | `month`
* **Success Response (200 OK)**:
  ```json
  [
    { "time": "08:00", "orders": 120, "revenue": 24000 },
    { "time": "09:00", "orders": 185, "revenue": 37000 },
    { "time": "10:00", "orders": 240, "revenue": 48000 }
  ]
  ```

---

## 6. Real-Time WebSockets Events (`/ws/events`)

Bi-directional state sync utilizing push updates for active displays (such as counters, barista dashboards, and kiosks).

### A. Subscribing to Stores/Topic Channels
```json
{
  "action": "subscribe",
  "topic": "store:ST-BLR01:orders"
}
```

### B. Push Events Sent by the Server

#### 1. Incoming Order Broadcast (`order_created`)
Fired when a client finishes checking out. Triggers new cards to flash on the KDS Kanban.
```json
{
  "event": "order_created",
  "data": {
    "id": "T-184",
    "customer": "Kiosk Guest",
    "items": ["Espresso x1", "Chocolate Muffin x1"],
    "priority": "rush",
    "source": "Kiosk",
    "status": "Pending",
    "time": "Just now"
  }
}
```

#### 2. KDS Ticket Advance Notification (`order_status_updated`)
Alerts customer devices, wait screens, and overhead displays that a drink status changed.
```json
{
  "event": "order_status_updated",
  "data": {
    "orderId": "T-184",
    "status": "Ready",
    "message": "Order T-184 is ready for pick up at counter A!"
  }
}
```
