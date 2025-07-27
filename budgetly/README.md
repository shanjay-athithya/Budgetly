# 💰 Budgetly - Personal Finance Management App

A full-stack personal finance management application built with Next.js, Firebase Authentication, MongoDB, and Tailwind CSS. Budgetly helps users track income, manage expenses, plan EMIs, and get smart product suggestions based on their financial health.

## 📌 Project Overview

Budgetly is a comprehensive personal finance tracker that empowers users to take control of their financial life. The app provides intuitive tools for tracking income and expenses, planning EMIs, analyzing spending patterns, and making informed purchasing decisions.

### Core Features
- **Income & Expense Tracking**: Add, edit, and delete income sources and expenses with detailed categorization
- **EMI Planner**: Manage and track EMIs with time-based planning and payment status
- **Financial Dashboard**: Visual analytics with charts showing spending trends and category breakdowns
- **Smart Suggestions**: AI-powered product recommendations based on financial health and affordability
- **Profile Management**: Complete user profile setup with savings, occupation, and location
- **Monthly Reports**: Generate comprehensive financial reports with PDF export functionality

## 🚀 Features

### Authentication & User Management
- **Google & Email Login**: Secure authentication using Firebase Auth
- **Profile Setup**: Complete user profile with initial savings, occupation, and location
- **User Session Management**: Persistent login state with automatic data synchronization

### Financial Management
- **Income Manager**: Track multiple income sources with history and monthly breakdown
- **Expense Manager**: Categorize expenses with detailed tracking and filtering
- **EMI Planner**: Manage EMIs with remaining months tracking and payment status
- **Savings Tracker**: Monitor savings growth and financial health score

### Analytics & Reporting
- **Dashboard Analytics**: Real-time financial metrics with Chart.js visualizations
- **Monthly Breakdown**: Bar charts showing income vs expenses trends
- **Category Analysis**: Spending breakdown by category with percentage calculations
- **PDF Reports**: Generate and download comprehensive financial reports

### Smart Features
- **Product Suggestions**: AI-powered recommendations based on financial capacity
- **Affordability Calculator**: Check if products are financially advisable
- **Financial Health Score**: Automated scoring based on income, expenses, and savings

### User Experience
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Dark Theme**: Modern dark interface with red accent colors
- **Sidebar Navigation**: Intuitive navigation with collapsible sidebar
- **Real-time Updates**: Instant data synchronization across all components

## 🧩 Components

### Core Layout Components
- **Header**: User profile display and navigation controls
- **Sidebar**: Main navigation with collapsible menu
- **Layout**: Main application wrapper with authentication checks

### Financial Management Components
- **IncomeManager**: Income tracking with add/edit/delete functionality
- **ExpenseManager**: Expense management with categorization and filtering
- **EMIManager**: EMI planning and tracking with payment status
- **SavingsManager**: Savings tracking and financial health monitoring

### Analytics & Reporting Components
- **Dashboard**: Main analytics dashboard with charts and metrics
- **ReportsManager**: Comprehensive reporting with PDF generation
- **WelcomeMessage**: New user onboarding and initial setup

### Smart Features Components
- **SuggestionsManager**: Product recommendations and affordability analysis
- **ProfileModal**: User profile management and settings

### Authentication Components
- **Login**: Firebase authentication with Google and email options

## ⚙️ Custom Hooks

### Data Management
- **useData**: Global state management for user data, income, expenses, and EMIs
- **useAuth**: Firebase authentication state management

### Context Providers
- **DataContext**: Centralized state management for financial data
- **AuthProvider**: Authentication state and user session management

## 📦 Packages Used

### Core Framework
- **Next.js 15.4.3**: React framework with App Router
- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript

### Authentication & Database
- **Firebase**: Authentication and user management
- **MongoDB**: NoSQL database for data persistence
- **Mongoose**: MongoDB object modeling

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Chart.js**: Data visualization library
- **Heroicons**: Icon library

### PDF Generation
- **jsPDF**: Client-side PDF generation
- **html2canvas**: HTML to canvas conversion for PDF

### Development Tools
- **ESLint**: Code linting and quality
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## 🧠 MongoDB Schema Design

### User Schema
```typescript
interface User {
  _id: string;
  uid: string;                    // Firebase UID
  email: string;
  name: string;
  occupation?: string;
  location?: string;
  months: {
    [monthKey: string]: {
      income: IncomeEntry[];      // Array of income entries
      expenses: Expense[];        // Array of expense entries
      savings: number;            // Monthly savings
    }
  };
  createdAt: Date;
  updatedAt: Date;
}

interface IncomeEntry {
  _id?: string;
  amount: number;
  source: string;
  date: Date;
  description?: string;
}

interface Expense {
  _id?: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  type: 'expense' | 'emi';
  emiDetails?: {
    monthlyAmount: number;
    totalAmount: number;
    remainingMonths: number;
    isActive: boolean;
  };
}
```

## 🌐 API Routes

### User Management
- **GET/POST `/api/user`**: User creation and profile management
- **GET/PUT `/api/profile`**: Profile data retrieval and updates

### Financial Data
- **GET/POST/PUT/DELETE `/api/income`**: Income CRUD operations
- **GET/POST/PUT/DELETE `/api/expenses`**: Expense CRUD operations

### Smart Features
- **GET/POST `/api/suggestions`**: Product suggestions and affordability analysis

## 🧪 Deployment Instructions

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd budgetly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env.local` file**
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # MongoDB Configuration
   MONGODB_URI=your_mongodb_connection_string
   ```

### Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Google and Email providers
3. Copy Firebase configuration to `.env.local`

### MongoDB Setup
1. Create a MongoDB Atlas cluster or use local MongoDB
2. Set up database connection string in `.env.local`
3. Ensure proper network access and authentication

### Development
```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Deployment on Vercel
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 📊 Dashboard Details

### Financial Metrics Calculation
- **Total Income**: Sum of all income entries for the current month
- **Total Expenses**: Sum of all expenses for the current month
- **Net Savings**: Income minus expenses
- **Financial Health Score**: Algorithm based on savings ratio and expense patterns

### Chart Rendering
- **Monthly Trends**: Line charts showing income vs expenses over time
- **Category Breakdown**: Pie charts displaying expense distribution
- **Spending Trends**: Bar charts for monthly comparison
- **Real-time Updates**: Charts update automatically when data changes

### Chart.js Integration
- Responsive chart containers
- Custom color schemes matching app theme
- Interactive tooltips and legends
- Smooth animations and transitions

## 💡 Suggestions Logic

### Financial Health Scoring
```typescript
// Basic scoring algorithm
const monthlyIncome = calculateTotalIncome();
const monthlyExpenses = calculateTotalExpenses();
const existingEMIs = calculateActiveEMIs();
const savings = user.savings;

const availableBudget = monthlyIncome - monthlyExpenses - existingEMIs;
const affordabilityScore = (availableBudget / monthlyIncome) * 100;
```

### Product Recommendation Criteria
- **Affordability**: Monthly payment vs available budget
- **Savings Impact**: Effect on current savings
- **Financial Health**: Impact on overall financial score
- **Risk Assessment**: Based on income stability and existing commitments

### Manual Product Analysis
- Users can add custom products for analysis
- System calculates affordability and provides recommendations
- Shows detailed breakdown of financial impact

## 🔒 Auth Flow

### Authentication Process
1. **User Login**: Firebase authentication with Google or email
2. **Auth State Check**: `onAuthStateChanged` monitors login status
3. **User Initialization**: Check if user exists in database
4. **Profile Setup**: New users complete profile setup
5. **Data Loading**: Load user's financial data from MongoDB

### New User Flow
```typescript
// Authentication flow
authUser → checkUserExists → createUser → profileSetup → loadData
```

### Session Management
- Persistent login state across browser sessions
- Automatic data synchronization on login
- Secure token-based authentication

## 🎨 UI Theme

### Design System
- **Primary Font**: Lexend (clean, modern typography)
- **Color Palette**: 
  - Background: `#1C1C1E` (dark theme)
  - Primary: `#F70000` (red accent)
  - Secondary: `#2C2C2E` (card backgrounds)
  - Text: `#FFFFFF` (white text)
- **Responsive Breakpoints**: Mobile-first design
- **Component Styling**: Tailwind CSS utility classes

### Visual Elements
- **Icons**: Heroicons for consistent iconography
- **Charts**: Custom-styled Chart.js components
- **Animations**: Smooth transitions and hover effects
- **Layout**: Grid and Flexbox for responsive design

## 📁 Folder Structure

```
budgetly/
├── src/
│   ├── app/
│   │   ├── api/                 # API routes
│   │   │   ├── expenses/
│   │   │   ├── income/
│   │   │   ├── profile/
│   │   │   ├── suggestions/
│   │   │   └── user/
│   │   ├── favicon.ico
│   │   ├── firebase.ts         # Firebase configuration
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   │   ├── Dashboard.tsx
│   │   ├── EMIManager.tsx
│   │   ├── ExpenseManager.tsx
│   │   ├── Header.tsx
│   │   ├── IncomeManager.tsx
│   │   ├── Layout.tsx
│   │   ├── ReportsManager.tsx
│   │   ├── SavingsManager.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SuggestionsManager.tsx
│   │   └── WelcomeMessage.tsx
│   ├── context/                # React context
│   │   └── DataContext.tsx
│   └── services/               # API services
│       └── api.ts
├── models/                     # MongoDB models
│   └── User.ts
├── lib/                        # Utility libraries
│   └── mongoose.ts
├── public/                     # Static assets
├── package.json
├── next.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 📅 Future Improvements

### Planned Features
- **Budget Planning**: Set monthly budgets with alerts
- **Bill Reminders**: Automated payment reminders
- **Investment Tracking**: Portfolio management and tracking
- **Tax Planning**: Tax calculation and optimization
- **Export Options**: CSV, Excel export functionality
- **Mobile App**: React Native mobile application
- **Multi-currency**: Support for multiple currencies
- **Family Accounts**: Shared family finance management

### Technical Enhancements
- **Real-time Sync**: WebSocket integration for live updates
- **Offline Support**: PWA capabilities for offline usage
- **Advanced Analytics**: Machine learning for spending insights
- **API Rate Limiting**: Enhanced security and performance
- **Caching Strategy**: Redis integration for better performance
- **Testing Suite**: Comprehensive unit and integration tests

### User Experience
- **Dark/Light Theme**: User preference toggle
- **Custom Categories**: User-defined expense categories
- **Goal Setting**: Financial goal tracking and visualization
- **Notifications**: Push notifications for important events
- **Data Import**: Bulk import from bank statements

---

**Budgetly** - Take control of your financial future, one transaction at a time. 💰✨
