# Mothmerah Admin Dashboard

A comprehensive Next.js-based admin dashboard for the Mothmerah agricultural platform, providing role-based management interfaces for farmers, wholesalers, commercial buyers, and administrators.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Getting Started](#getting-started)
- [Integration Points](#integration-points)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [API Integration](#api-integration)
- [Authentication & Authorization](#authentication--authorization)
- [Development](#development)
- [License](#license)

## 📝 Overview

Mothmerah Admin is a modern, role-based admin panel designed to manage agricultural operations, including:
- User management across multiple roles
- Auction management
- Inventory and product management
- Pricing rule configuration
- Dashboard analytics
- Claim management
- Multi-language support

The platform supports four distinct user roles with tailored dashboards and functionalities:
- **ADMIN**: Full system access
- **WHOLESALER**: Bulk purchasing and management
- **BASE_USER**: Individual user interface
- **COMMERCIAL_BUYER**: Commercial purchasing interface

## 🛠 Tech Stack

- **Framework**: Next.js 16.2.6
- **Language**: TypeScript 5.9.3
- **Styling**: Tailwind CSS 4.2.1
- **UI Components**: React 19.2.0
- **API Client**: Axios 1.13.4
- **Charting**: ApexCharts 4.7.0
- **Calendar**: FullCalendar 6.1.19
- **PDF Export**: jsPDF 4.2.1, pdfmake 0.3.5
- **Drag & Drop**: React DnD 16.0.1
- **File Upload**: React Dropzone 14.3.8
- **Date Picker**: Flatpickr 4.6.13
- **Map Visualization**: react-jvectormap

## 📁 Project Structure

```
mothmerah_admin/
├── src/
│   ├── app/
│   │   ├── (full-width-pages)/       # Full-width layout pages
│   │   ├── admin/                    # Admin dashboard
│   │   ├── base-user/                # Base user dashboard
│   │   ├── commercial-buyer/         # Commercial buyer dashboard
│   │   ├── farmer/                   # Farmer dashboard
│   │   ├── wholesaler/               # Wholesaler dashboard
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Home page (redirects by role)
│   │   ├── globals.css               # Global styles
│   │   └── favicon.ico
│   ├── components/                   # Reusable React components
│   ├── layout/                       # Layout components
│   ├── hooks/                        # Custom React hooks
│   ├── context/                      # React Context providers
│   ├── icons/                        # SVG icons
│   ├── locales/                      # Internationalization files
│   ├── utils/                        # Utility functions
│   ├── proxy.ts                      # Authentication proxy middleware
│   └── svg.d.ts                      # TypeScript definitions for SVG
├── services/                         # API service layer
│   ├── auth.ts                       # Authentication services
│   ├── users.ts                      # User management
│   ├── roles.ts                      # Role management
│   ├── products.ts                   # Product management
│   ├── categories.ts                 # Category management
│   ├── auctions.ts                   # Auction management
│   ├── inventories.ts                # Inventory management
│   ├── claims.ts                     # Claims management
│   ├── pricing.ts                    # Pricing rules
│   ├── dashboard.ts                  # Dashboard data
│   └── translate.ts                  # Translation services
├── public/                           # Static assets
├── next.config.ts                    # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── postcss.config.js                 # PostCSS configuration
├── package.json                      # Project dependencies
└── .env                              # Environment configuration
```

## ✨ Features

### Role-Based Access Control
- Route-based authentication with role validation
- Protected dashboards for each user role
- Cookie-based session management with `access_token` and `user_type`

### Admin Functionalities
- **Auctions Management**: Create, view, and manage auctions
- **Inventory Management**: Track and manage product inventory
- **Pricing Rules**: Configure and assign dynamic pricing rules with discount levels
- **User Management**: Manage users across different roles
- **Dashboard Analytics**: Real-time analytics and statistics
- **Claims Handling**: Process and track claims
- **Category Management**: Organize products by categories

### User Interface
- Responsive design using Tailwind CSS
- Interactive dashboards with ApexCharts
- Calendar integration for event management
- Drag-and-drop file uploads
- PDF export capabilities
- Multi-language support
- Light/Dark mode ready styling

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/FMI-team/mothmerah_admin.git
   cd mothmerah_admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy .env.example to .env (or create .env manually)
   cp .env.example .env
   ```
   See [Environment Variables](#environment-variables) section for details.

4. **Run development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 🔗 Integration Points

### Payment Processing - Moyasar
The application integrates with **Moyasar** payment gateway for payment processing.

**Configuration:**
- API Key: `MOYASAR_API_KEY`
- API Secret: `MOYASAR_API_SECRET`
- Public Credentials: `NEXT_PUBLIC_CREDENTIALS`

**Usage:**
Payment integration is handled through the Moyasar API. The credentials are configured in `.env` file and used when processing transactions within the platform.

**Related Files:**
- Services for payment handling may be in the API layer
- Payment endpoints typically interact with backend services

### Backend API
The application communicates with a RESTful backend API for:
- User authentication and authorization
- Data CRUD operations
- Report generation
- Analytics

**API Configuration:**
- Base URL: Configured in environment variables
- Authentication: Bearer token in request headers
- Default port: 8001 (as per `start` script configuration)

**API Services:**
- `services/auth.ts` - Authentication endpoints
- `services/users.ts` - User management endpoints
- `services/auctions.ts` - Auction endpoints
- `services/inventories.ts` - Inventory endpoints
- `services/products.ts` - Product endpoints
- `services/pricing.ts` - Pricing rule endpoints
- `services/dashboard.ts` - Analytics endpoints
- And more...

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Moyasar Payment Gateway
MOYASAR_API_KEY=sk_test_6dDrwE6B9azp2xdDrFsQst8rBENZEQvGLEBSNMmb
MOYASAR_API_SECRET=your_secret_here

# Public Credentials (Base64 encoded)
NEXT_PUBLIC_CREDENTIALS=c2tfdGVzdF82ZERyd0U2QjlhenAyeGREckZzUXN0OHJCRU5aRVF2R0xFQlNOTW1iOiIi

# Backend API (optional, if not hardcoded)
NEXT_PUBLIC_API_BASE_URL=http://api.example.com
```

**Note:** The `NEXT_PUBLIC_` prefix makes variables accessible on the client-side. Keep sensitive secrets without this prefix.

## 🔄 Usage

### Starting the Application

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

**Linting:**
```bash
npm run lint
```

### User Flow

1. User navigates to the application
2. Redirected to login if not authenticated
3. After login, user is redirected to their role-specific dashboard:
   - `/admin` - Admin dashboard
   - `/base-user` - Base user dashboard
   - `/wholesaler` - Wholesaler dashboard
   - `/commercial-buyer` - Commercial buyer dashboard
   - `/farmer` - Farmer dashboard

4. Unauthorized access attempts redirect to sign-in

## 📡 API Integration

The application includes a comprehensive service layer (`/services`) for API communication:

### Authentication Service
```typescript
// services/auth.ts
- Login and session management
- Token validation
```

### Pricing Service
```typescript
// services/pricing.ts
interface DiscountRulePayload {
  rule_name_key: string;
  discount_type: "PERCENTAGE" | "FIXED_AMOUNT";
  levels: DiscountLevel[];
}

- Create pricing rules with discount levels
- Assign rules to packaging options
- Support for percentage and fixed-amount discounts
```

### Dashboard Service
```typescript
// services/dashboard.ts
- Retrieve analytics data
- Generate statistics for various user roles
```

### Other Services
- **Auctions**: Create, update, retrieve auction data
- **Inventories**: Manage inventory levels
- **Products**: Product catalog management
- **Users**: User CRUD operations
- **Claims**: Claim processing
- **Roles**: Role management

## 🔐 Authentication & Authorization

### Middleware Protection
The application uses Next.js middleware (`src/proxy.ts`) to protect routes:

```typescript
// Protected routes require:
// 1. access_token cookie (authentication)
// 2. user_type cookie (authorization)

// Route patterns:
- /admin        → requires ADMIN role
- /wholesaler   → requires WHOLESALER role
- /base-user    → requires BASE_USER role
```

### Security Headers
- `X-Frame-Options: DENY` - Prevents clickjacking
- `Content-Security-Policy: frame-ancestors 'self'` - CSP enforcement
- Cache control headers for static and dynamic content

## 🛠 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server (port 8001)
npm start

# Run ESLint
npm run lint
```

### TypeScript Configuration
- Target: ES2017
- Module Resolution: Bundler
- Strict Mode: Enabled
- Path Aliases: `@/*` → `./src/*`

### Styling
- **Framework**: Tailwind CSS with forms plugin
- **PostCSS**: Autoprefixer enabled
- **SVG Support**: SVGR webpack loader for SVG components

### Code Quality
- ESLint configuration included
- Prettier formatting config
- TypeScript strict mode for type safety

## 📦 Build Output

- Build command: `next build`
- Start command: `next start -p 8001`
- Output port: 8001

## 📄 License

ISC License - See LICENSE file for details

---

**Repository**: [FMI-team/mothmerah_admin](https://github.com/FMI-team/mothmerah_admin)

**Created**: November 22, 2025

**Language Composition**: TypeScript 97.7%, CSS 2.2%, JavaScript 0.1%
