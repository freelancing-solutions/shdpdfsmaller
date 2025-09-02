# PDFSmaller Advanced

A comprehensive PDF processing suite built with Next.js 15, TypeScript, and modern web technologies. This advanced PDF tool offers compression, conversion, OCR, AI-powered analysis, and file management capabilities with secure authentication and usage-based access control.

## Features

### 🔐 Authentication & Access Control
- **Role-based access**: Guest, Free, Pro, and Enterprise tiers
- **Guest limitations**: One execution per route without authentication
- **Usage tracking**: Real-time monitoring of API calls and processing limits
- **Plan enforcement**: Automatic throttling based on subscription tier
- **Session management**: Secure token-based authentication

### 🗜️ PDF Compression
- **Server-side processing**: Advanced PDF compression handled on secure servers
- **Multiple compression levels**: Low, Medium, High, and Maximum compression
- **Image quality control**: Adjustable image quality settings (10-100%)
- **Real-time analysis**: Instant file analysis with compression estimates
- **Batch processing**: Compress multiple files simultaneously (paid feature)

### 🔄 PDF Conversion
- **Multiple output formats**: Convert to DOCX, TXT, HTML, or Images
- **Quality settings**: Low, Medium, and High quality options
- **Format preservation**: Optional formatting preservation (paid feature)
- **Image extraction**: Extract images from PDFs (paid feature)
- **Batch conversion**: Process multiple files at once (paid feature)

### 👁️ OCR (Optical Character Recognition)
- **Multi-language support**: English, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean
- **Multiple output formats**: Plain text, annotated PDF, Word document, searchable PDF
- **Confidence control**: Adjustable OCR confidence levels (50-100%)
- **Layout preservation**: Option to preserve original document layout (paid feature)
- **Batch processing**: Process multiple documents simultaneously (paid feature)

### 🤖 AI Tools
- **Document summarization**: Generate basic, detailed, or comprehensive summaries
- **Translation**: Translate documents to 10 different languages
- **Keyword extraction**: Extract key terms and phrases
- **Sentiment analysis**: Analyze document sentiment and confidence
- **Question generation**: Generate questions from document content
- **Document categorization**: Automatically categorize documents by type

### 📁 File Manager
- **Centralized storage**: Manage all processed files in one place
- **Search functionality**: Quick search through stored files
- **Storage analytics**: Monitor storage usage and file statistics
- **File organization**: Categorize files by processing type
- **Download management**: Easy download of processed files
- **Bulk operations**: Clear all files or manage individually

## Access Tiers & Limitations

### Guest Users (Unauthenticated)
- **One execution per route**: Limited to a single use of each API endpoint
- **No file storage**: Cannot save files to the file manager
- **Basic features only**: Access to standard compression and conversion
- **No batch processing**: Limited to single file operations
- **Session-based**: Restrictions reset after browser session ends

### Free Tier (Authenticated)
- **50 operations/month**: Monthly limit on PDF processing
- **Basic features**: Standard compression and conversion
- **5MB file limit**: Maximum file size for processing
- **Limited storage**: 100MB total storage capacity
- **No priority processing**: Standard queue position

### Pro Tier ($9.99/month)
- **Unlimited operations**: No monthly processing limits
- **Advanced features**: Access to all OCR and AI tools
- **25MB file limit**: Increased maximum file size
- **5GB storage**: Expanded storage capacity
- **Priority processing**: Faster processing queue
- **Batch operations**: Process multiple files simultaneously

### Enterprise Tier ($29.99/month)
- **All Pro features**: Everything included in Pro tier
- **100MB file limit**: Maximum file size for large documents
- **Unlimited storage**: No storage capacity restrictions
- **API access**: Programmatic access to PDF processing
- **Custom domains**: White-labeled processing interface
- **Priority support**: 24/7 technical support

## Technology Stack

- **Frontend**: Next.js 15 with TypeScript
- **UI Framework**: React 19 with Tailwind CSS 4
- **Authentication**: NextAuth.js with JWT tokens
- **Components**: shadcn/ui component library
- **PDF Processing**: Server-side PDF manipulation with advanced algorithms
- **Payment Processing**: PayPal integration for secure transactions
- **Rate Limiting**: Upstash Redis for request throttling
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: React hooks with local state management
- **Icons**: Lucide React icons
- **Development**: ESLint, Prettier, TypeScript

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database
- Redis instance (for rate limiting)
- PayPal business account (for payment processing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/freelancing-solutions/shdpdfsmaller
   cd pdfsmaller-advanced
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/pdfsmaller"

   # Authentication
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"

   # Redis for rate limiting
   REDIS_URL="redis://localhost:6379"

   # Payment processing (PayPal)
   PAYPAL_CLIENT_ID="your-paypal-client-id"
   PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
   PAYPAL_WEBHOOK_ID="your-paypal-webhook-id"
   ```

4. **Set up database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts     # Authentication API
│   │   ├── analyze/route.ts                # PDF analysis API (protected)
│   │   ├── compress/route.ts               # PDF compression API (protected)
│   │   ├── convert/route.ts                # PDF conversion API (protected)
│   │   ├── ocr/route.ts                    # OCR processing API (protected)
│   │   ├── ai-tools/route.ts               # AI tools API (protected)
│   │   ├── files/route.ts                  # File manager API (protected)
│   │   └── webhooks/paypal/route.ts        # PayPal webhook handler
│   ├── login/
│   │   └── page.tsx                        # Login page
│   ├── register/
│   │   └── page.tsx                        # Registration page
│   ├── subscription/
│   │   └── page.tsx                        # Subscription management
│   ├── page.tsx                            # Main application page
│   ├── layout.tsx                          # Root layout
│   └── globals.css                         # Global styles
├── components/
│   ├── auth/                              # Authentication components
│   ├── billing/                           # Subscription components
│   └── ui/                                # shadcn/ui components
├── lib/
│   ├── api-utils.ts                       # Standardized API file handling and responses
│   ├── auth.ts                            # Authentication utilities
│   ├── paypal.ts                          # PayPal integration
│   ├── rate-limiting.ts                   # Rate limiting service
│   ├── subscription.ts                    # Subscription management
│   ├── pdf-compression.ts                 # PDF compression service
│   ├── pdf-conversion.ts                  # PDF conversion service
│   ├── pdf-ocr.ts                         # OCR processing service
│   ├── pdf-ai-tools.ts                    # AI tools service
│   ├── file-manager.ts                    # File management service
│   └── utils.ts                           # General utility functions
└── hooks/
    ├── use-auth.ts                        # Authentication hook
    ├── use-subscription.ts                # Subscription hook
    ├── use-mobile.ts                      # Mobile detection hook
    └── use-toast.ts                       # Toast notification hook
```

## API Architecture

To ensure a consistent and maintainable codebase, our backend API follows a standardized architecture for handling requests.

*   **Backend API Utilities (`src/lib/api-utils.ts`)**: All API routes that process file uploads and form data MUST use the `APIFileHandler` utility class. This class provides a centralized and standardized way to parse `multipart/form-data`, validate files and input parameters, and generate consistent JSON or file-based responses.

*   **Frontend API Client (`src/utils/api-client.ts`)**: All frontend components MUST use the `APIClient` service for communicating with the backend. This client is designed to work with the standardized API, simplifying file uploads and data handling on the client-side.

The `src/app/api/compress/route.ts` service serves as the reference implementation for this architecture. All other API routes are being refactored to adopt this pattern.

## API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js authentication routes

### PDF Analysis (Protected)
- `POST /api/analyze` - Analyze PDF for compression potential
- `GET /api/analyze` - API information

### PDF Compression (Protected)
- `POST /api/compress` - Compress PDF files (server-side processing)
- `GET /api/compress` - API information

### PDF Conversion (Protected)
- `POST /api/convert` - Convert PDF to other formats
- `GET /api/convert` - API information

### OCR Processing (Protected)
- `POST /api/ocr` - Process OCR on PDF files
- `GET /api/ocr` - API information

### AI Tools (Protected)
- `POST /api/ai-tools` - Process PDF with AI tools
- `GET /api/ai-tools` - API information

### File Manager (Protected)
- `GET /api/files?action=list` - List stored files
- `GET /api/files?action=storage` - Get storage info
- `GET /api/files?action=download&fileId={id}` - Download file
- `POST /api/files` - Upload file
- `DELETE /api/files?fileId={id}` - Delete file
- `DELETE /api/files?action=clear` - Clear all files

### Payment Processing
- `POST /api/payments/create-order` - Create PayPal order
- `POST /api/payments/capture-order` - Capture PayPal payment
- `POST /api/webhooks/paypal` - Handle PayPal webhook events

## Database Schema

```prisma
model Account {
  id           String   @id @default(cuid())
  userId       String
  type         String
  provider     String
  providerAccountId String
  refresh_token String?
  access_token String?
  expires_at   Int?
  token_type   String?
  scope        String?
  id_token     String?
  session_state String?
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  subscription  Subscription?
  usage         Usage[]
  files         File[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Subscription {
  id           String   @id @default(cuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id])
  plan         Plan     @default(Free)
  status       SubscriptionStatus @default(Active)
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd Boolean @default(false)
  paypalSubscriptionId String?
  paypalOrderId String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Usage {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  endpoint  String   // API endpoint name
  count     Int      @default(0)
  period    DateTime // Monthly period
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model File {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  name         String
  size         Int
  type         String
  category     FileCategory
  metadata     Json?
  content      Bytes?   // File content (optional)
  uploadedAt   DateTime @default(now())
  lastAccessed DateTime @default(now())
}

model Payment {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  amount    Float
  currency  String   @default("USD")
  status    PaymentStatus
  paypalOrderId String
  paypalCaptureId String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Usage Examples

### Authenticated API Request
```typescript
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('compressionLevel', 'medium');

const response = await fetch('/api/compress', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

if (response.status === 429) {
  // Handle rate limit exceeded
  console.error('Rate limit exceeded. Upgrade your plan for more requests.');
}

const compressedBlob = await response.blob();
```

### PayPal Payment Integration
```typescript
// Create PayPal order
const createOrderResponse = await fetch('/api/payments/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    planId: 'PRO',
    amount: '9.99',
    currency: 'USD'
  })
});

const orderData = await createOrderResponse.json();

// Redirect to PayPal approval URL
window.location.href = orderData.approvalUrl;
```

## PayPal Integration

### Payment Flow
1. User selects a subscription plan
2. System creates a PayPal order via API
3. User is redirected to PayPal for payment approval
4. PayPal redirects back to application with payment confirmation
5. System captures payment and activates subscription
6. Webhooks handle subscription lifecycle events

### Webhook Events Handled
- `PAYMENT.CAPTURE.COMPLETED` - Payment successfully captured
- `PAYMENT.CAPTURE.DENIED` - Payment was denied
- `PAYMENT.CAPTURE.REFUNDED` - Payment was refunded
- `BILLING.SUBSCRIPTION.ACTIVATED` - Subscription activated
- `BILLING.SUBSCRIPTION.CANCELLED` - Subscription cancelled
- `BILLING.SUBSCRIPTION.EXPIRED` - Subscription expired

## Server-Side PDF Compression

Our PDF compression is handled entirely on the server side for:
- **Better compression ratios**: Advanced algorithms that can't run in browsers
- **Security**: Sensitive documents never leave our secure infrastructure
- **Consistency**: Uniform compression results across all devices
- **Performance**: Heavy processing offloaded from client devices
- **Advanced features**: Support for complex PDF structures and embedded objects

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- **File size limits**: Enforced based on subscription tier (5MB Free, 25MB Pro, 100MB Enterprise)
- **Server-side processing**: All PDF compression happens on secure servers
- **Processing time**: Varies based on file size and complexity
- **Rate limiting**: Prevents API abuse and ensures fair usage

## Security Features

- **JWT authentication**: Secure token-based authentication
- **Role-based access control**: Different permissions for each subscription tier
- **Rate limiting**: Prevents API abuse and DoS attacks
- **Input validation**: All file inputs are validated before processing
- **Payment security**: PCI-compliant payment processing through PayPal
- **Data encryption**: Sensitive data encrypted at rest and in transit
- **Server-side processing**: Documents processed in secure environment

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add JSDoc comments for functions and classes
- Include proper error handling and validation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [NextAuth.js](https://next-auth.js.org/) for authentication
- [PayPal](https://www.paypal.com/) for payment processing
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Upstash Redis](https://upstash.com/) for rate limiting
- [Lucide](https://lucide.dev/) for icons
- [Next.js](https://nextjs.org/) for the React framework

## Support

For support, please open an issue in the GitHub repository or contact our support team at support@pdfsmaller.com.

Subscription and billing inquiries: billing@pdfsmaller.com

---

**PDFSmaller Advanced** - A comprehensive PDF processing solution with secure authentication, server-side compression, and PayPal payment integration.