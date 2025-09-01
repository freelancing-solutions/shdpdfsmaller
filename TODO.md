Here's a comprehensive project specification for your TypeScript/Next.js application:

## API Endpoints Specification

### Authentication Endpoints
- **POST** `/api/auth/login` - User authentication
  - Purpose: Authenticate users and return JWT tokens
  - Payload: `{ email: string, password: string }`
  - Must interface directly for JWT token management

- **POST** `/api/auth/register` - User registration
  - Purpose: Create new user accounts
  - Payload: `{ name: string, email: string, password: string }`
  - Must interface directly for account creation

- **GET** `/api/auth/profile` - User profile data
  - Purpose: Retrieve authenticated user information
  - Requires JWT token in headers

### Compression Endpoints
- **POST** `/api/compress/single` - Single file compression
  - Purpose: Compress individual PDF files
  - Payload: FormData with `file`, `compressionLevel`, `imageQuality`
  - Must interface directly for file processing

- **POST** `/api/compress/bulk` - Bulk file compression
  - Purpose: Compress multiple PDF files simultaneously
  - Payload: FormData with `file[index]`, `compressionLevel`, `imageQuality`
  - Must interface directly for batch processing

### Subscription Endpoints
- **POST** `/api/subscriptions/create` - Create subscription
  - Purpose: Initialize user subscription with payment
  - Payload: `{ planId: string, paymentMethodId: string }`
  - Must interface with PayPal API integration

- **POST** `/api/subscriptions/cancel` - Cancel subscription
  - Purpose: Terminate active subscription
  - Must interface with PayPal API for cancellation

- **GET** `/api/subscriptions` - Get subscription status
  - Purpose: Retrieve current subscription information

## Additional Project Requirements

### Navigation Structure
**Hamburger Menu Options:**
- Authorization Section:
  - Login (Dialog-based)
  - Logout 
  - Subscribe (Dialog-based)
- User Profile Section:
  - Profile Management (Dialog-based)
  - Subscription Plans (Dialog-based)
  - Current Subscription Status

### Authentication System
- JWT token-based authentication
- Token storage in secure HTTP-only cookies
- Automatic token refresh mechanism
- Protected route implementation

### Subscription Plans (PDFSmaller Features)
**Plan Tiers:**
1. **Free Tier** - Basic compression, limited features
2. **Pro Tier** - Advanced compression, bulk processing, priority support
3. **Enterprise Tier** - Maximum compression, unlimited files, dedicated support

### Payment Integration
- **PayPal Developer API integration**
- Required endpoints for PayPal:
  - `/api/payments/create-order` - Create PayPal order
  - `/api/payments/capture-order` - Capture payment
  - `/api/payments/webhook` - PayPal webhook handling
- Secure payment processing flow
- Subscription management through PayPal

### UI/UX Requirements
- **Dialog-based interfaces** for:
  - Login/Registration
  - Subscription selection and payment
  - Profile management
  - File upload and compression settings
- **Shadcn/UI components** throughout
- Responsive design for mobile and desktop
- Loading states and error handling
- File upload progress indicators

### Technical Stack
- **Next.js 14+** with App Router
- **TypeScript** strict mode
- **Shadcn/UI** component library
- **React Hook Form** for form handling
- **Zod** for validation
- **PayPal JavaScript SDK** integration
- **JWT** authentication utilities

### File Structure Recommendation
```
src/
  components/
    ui/ (Shadcn components)
    auth/
    subscription/
    compression/
  lib/
    api/ (API call functions)
    auth/ (JWT utilities)
    paypal/ (Payment integration)
  types/ (TypeScript definitions)
  app/
    api/ (Next.js API routes)
```

The application must directly interface with all specified endpoints while maintaining a secure, user-friendly experience with dialog-based interactions for authentication and subscription flows.