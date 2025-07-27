# Budgetly - Personal Finance Tracker

A comprehensive personal finance management application built with Next.js, MongoDB, and React. Track your income, expenses, EMIs, and get smart financial suggestions.

## 🚀 Features

### 📊 Dashboard
- **Month-based filtering** with dropdown selector
- **Real-time financial metrics** (Income, Expenses, Savings, EMIs)
- **Interactive charts** (Bar, Pie, Line charts)
- **Budget alerts** and financial health scoring
- **Quick insights** and spending trends

### 💰 Income Management
- Add/edit/delete income entries
- Month-wise income tracking
- Income source categorization
- Historical income analysis

### 💸 Expense Management
- **Comprehensive expense tracking** with categories
- **EMI integration** with duration and monthly payments
- **Filtering** by month and category
- **Expense history** and analytics

### 🏦 EMI Tracker
- **Active EMIs** with progress tracking
- **EMI history** for completed payments
- **Monthly installment** calculations
- **Payment status** monitoring

### 💡 Financial Suggestions
- **Smart purchase recommendations** based on financial health
- **Rule-based analysis** (EMI burden, savings rate, etc.)
- **Product suggestion history**
- **Risk assessment** (Good/Moderate/Risky)

### 📈 Reports & Analytics
- **Monthly financial reports** with PDF export
- **Income vs Expenses** analysis
- **Category-wise breakdown** charts
- **Top spending categories** identification
- **Share functionality** for reports

### 💾 Savings Overview
- **Current savings** tracking
- **Monthly savings trends** with charts
- **Savings history** table
- **Manual savings adjustment**

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Lexend Font
- **Charts**: Chart.js, React-Chartjs-2
- **Icons**: Heroicons
- **Database**: MongoDB with Mongoose
- **State Management**: React Context + useReducer
- **API**: Next.js API Routes

## 📁 Project Structure

```
budgetly/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes
│   │   │   ├── user/               # User management
│   │   │   ├── income/             # Income operations
│   │   │   ├── expenses/           # Expense operations
│   │   │   └── suggestions/        # Product suggestions
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Main page
│   ├── components/                 # React components
│   │   ├── Layout.tsx              # Main layout wrapper
│   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   ├── Dashboard.tsx           # Dashboard overview
│   │   ├── IncomeManager.tsx       # Income management
│   │   ├── ExpenseManager.tsx      # Expense management
│   │   ├── SavingsManager.tsx      # Savings tracking
│   │   ├── EMIManager.tsx          # EMI management
│   │   ├── ReportsManager.tsx      # Financial reports
│   │   └── SuggestionsManager.tsx  # Financial suggestions
│   ├── context/
│   │   └── DataContext.tsx         # Global state management
│   └── services/
│       └── api.ts                  # API service layer
├── lib/
│   └── mongoose.ts                 # MongoDB connection
├── models/
│   ├── User.ts                     # User schema
│   └── ProductSuggestion.ts        # Suggestion schema
└── public/                         # Static assets
```

## 🗄 Database Schema

### User Schema
```typescript
{
  _id: ObjectId,
  uid: string,                      // Firebase UID
  email: string,                    // User email
  name: string,                     // User name
  photoURL?: string,                // Profile photo
  savings: number,                  // Current savings
  location?: string,                // User location
  occupation?: string,              // User occupation
  months: {                         // Month-wise data
    [monthKey: string]: {
      income: number,
      expenses: [{
        label: string,
        amount: number,
        category: string,
        date: Date,
        type: "one-time" | "emi",
        emiDetails?: {
          duration: number,
          remainingMonths: number,
          monthlyAmount: number,
          startedOn: Date
        }
      }]
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

### ProductSuggestion Schema
```typescript
{
  _id: ObjectId,
  uid: string,                      // User ID
  productName: string,              // Product name
  price: number,                    // Product price
  emiAmount?: number,               // Monthly EMI
  duration?: number,                // EMI duration
  suggestionScore: "Good" | "Moderate" | "Risky",
  reason: string,                   // Suggestion reason
  suggestedAt: Date                 // Suggestion timestamp
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd budgetly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/budgetly
   ```

4. **Start MongoDB**
   - **Local MongoDB**: Start your local MongoDB service
   - **MongoDB Atlas**: Use your Atlas connection string

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### MongoDB Setup

#### Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Create database: `budgetly`

#### MongoDB Atlas (Recommended for Production)
1. Create MongoDB Atlas account
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env.local`

### Environment Variables

```env
# Required
MONGODB_URI=mongodb://localhost:27017/budgetly

# Optional (for Firebase Auth)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

## 📱 Usage

### Dashboard
- View financial overview with month selector
- Monitor income, expenses, savings, and EMIs
- Check financial health alerts
- Analyze spending trends

### Income Management
- Add new income entries with source and amount
- Edit existing income records
- View income history by month

### Expense Management
- Add expenses with categories
- Track EMI payments with duration
- Filter expenses by month and category
- View expense analytics

### EMI Tracker
- Monitor active EMIs with progress
- Track payment history
- Calculate remaining payments
- Manage EMI status

### Financial Suggestions
- Get purchase recommendations
- Analyze financial impact
- View suggestion history
- Save planned purchases

### Reports
- Generate monthly financial reports
- Export reports as PDF
- Share financial summaries
- View detailed analytics

## 🔒 Security

- **Input validation** on all API endpoints
- **Error handling** with proper HTTP status codes
- **Data sanitization** before database operations
- **Environment variable** protection

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms
- Set `MONGODB_URI` environment variable
- Build: `npm run build`
- Start: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

---

**Built with ❤️ using Next.js, MongoDB, and React**
