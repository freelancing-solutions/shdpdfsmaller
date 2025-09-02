
# Backend API Documentation

## Introduction

This document outlines the backend API for the PDFSmaller application. The backend is built using Next.js API Routes and handles user authentication, subscriptions, payments, and PDF processing.

## Environment Variables

The following environment variables must be set in a `.env` file in the project root:

- `DATABASE_URL`: The connection string for the Prisma database. For SQLite, this is `file:./db/dev.db`.
- `JWT_SECRET`: A long, random string used to sign JSON Web Tokens for authentication.
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`: The client ID for the PayPal application, used on the frontend.
- `PAYPAL_CLIENT_SECRET`: The client secret for the PayPal application, used on the backend.

## Authentication

Authentication is handled using JSON Web Tokens (JWT). After a successful login, a JWT is set as a secure, HTTP-only cookie named `token`. This token is automatically sent with subsequent requests and is used to identify the authenticated user.

### `POST /api/auth/register`

- **Description:** Creates a new user account.
- **Protection:** Public
- **Request Body:** `application/json`
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Success Response (201):**
  ```json
  {
    "message": "User created successfully",
    "userId": "string"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: If validation fails (e.g., password too short).
  - `409 Conflict`: If a user with the email already exists.

### `POST /api/auth/login`

- **Description:** Authenticates a user and sets the `token` cookie.
- **Protection:** Public
- **Request Body:** `application/json`
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Success Response (200):**
  - Sets `token` cookie.
  - Body:
    ```json
    {
      "message": "Login successful"
    }
    ```
- **Error Responses:**
  - `401 Unauthorized`: If credentials are invalid.

### `POST /api/auth/logout`

- **Description:** Clears the `token` cookie to log the user out.
- **Protection:** Public
- **Request Body:** None
- **Success Response (200):**
  ```json
  {
    "message": "Logout successful"
  }
  ```

### `GET /api/auth/profile`

- **Description:** Retrieves the profile of the currently authenticated user.
- **Protection:** Protected (requires `token` cookie)
- **Request Body:** None
- **Success Response (200):**
  ```json
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "Subscription": {
      "plan": "FREE" | "PRO" | "ENTERPRISE",
      "status": "string"
    } | null
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: If the token is missing or invalid.

## Subscriptions & Payments (PayPal)

The payment flow is handled by integrating with the PayPal API.

### `POST /api/payments/create-order`

- **Description:** Creates a PayPal order for a specific subscription plan.
- **Protection:** Protected
- **Request Body:** `application/json`
  ```json
  {
    "planId": "PRO" | "ENTERPRISE"
  }
  ```
- **Success Response (200):**
  - Returns the PayPal order object, including the order `id`.

### `POST /api/payments/capture-order`

- **Description:** Captures the payment for a previously created PayPal order.
- **Protection:** Protected
- **Request Body:** `application/json`
  ```json
  {
    "orderId": "string"
  }
  ```
- **Success Response (200):**
  - Returns the captured order details from PayPal.

### `POST /api/subscriptions/create`

- **Description:** Creates or updates a user's subscription record in the database after a successful payment.
- **Protection:** Protected
- **Request Body:** `application/json`
  ```json
  {
    "plan": "PRO" | "ENTERPRISE",
    "status": "string",
    "paypalSubscriptionId": "string",
    "currentPeriodEnd": "ISO-8601-Date"
  }
  ```
- **Success Response (200):**
  - Returns the created or updated subscription object from the database.

### `GET /api/subscriptions`

- **Description:** Retrieves the current subscription status for the authenticated user.
- **Protection:** Protected
- **Request Body:** None
- **Success Response (200):**
  - Returns the user's subscription object or a default FREE plan if none exists.

## PDF Processing API

### Compression

#### `POST /api/compress/single`

- **Description:** Compresses a single PDF file.
- **Protection:** Protected
- **Request Body:** `multipart/form-data`
  - `file`: The PDF file to compress.
  - `compressionLevel`: 'low', 'medium', 'high', or 'maximum'.
  - `imageQuality`: A number between 10 and 100.
- **Success Response (200):**
  - Returns the compressed PDF file as a `application/pdf` blob.

#### `POST /api/compress/bulk`

- **Description:** Compresses multiple PDF files and returns them as a single zip archive.
- **Protection:** Protected (Requires PRO or ENTERPRISE plan)
- **Request Body:** `multipart/form-data`
  - `files`: An array of PDF files.
  - `compressionLevel`: 'low', 'medium', 'high', or 'maximum'.
  - `imageQuality`: A number between 10 and 100.
- **Success Response (200):**
  - Returns a zip file as a `application/zip` blob.
- **Error Responses:**
  - `403 Forbidden`: If the user does not have the required subscription plan.

### Other PDF Tools

The following endpoints exist for other PDF processing tasks. They follow a similar pattern to the compression endpoints, accepting a file and options via `multipart/form-data`.


- **`POST /api/convert`**: Converts a PDF to other formats.
- **`POST /api/ocr`**: Performs OCR on a PDF.
- **`POST /api/analyze`**: Analyzes a PDF for properties.
- **`POST /api/ai-tools`**: Uses AI to perform tasks like summarization on a PDF.
- **`/api/files`**: Manages stored files (not implemented in the new authenticated system).
