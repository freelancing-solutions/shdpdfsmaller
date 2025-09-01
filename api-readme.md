# API Endpoints

## /api/auth/login
**Method:** POST
**Payload:**
```json
{
  "email": "string",
  "password": "string"
}
```

## /api/auth/register
**Method:** POST
**Payload:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

## /api/auth/profile
**Method:** GET
**Payload:** None

## /api/compress/single
**Method:** POST
**Payload:** `FormData` containing:
- `file`: PDF file
- `compressionLevel`: string (low, medium, high, maximum)
- `imageQuality`: integer (10-100)

## /api/compress/bulk
**Method:** POST
**Payload:** `FormData` containing:
- `file[index]`: PDF files
- `compressionLevel`: string (low, medium, high, maximum)
- `imageQuality`: integer (10-100)

## /api/subscriptions/create
**Method:** POST
**Payload:**
```json
{
  "planId": "string",
  "paymentMethodId": "string"
}
```

## /api/subscriptions/cancel
**Method:** POST
**Payload:** None

## /api/subscriptions
**Method:** GET
**Payload:** None