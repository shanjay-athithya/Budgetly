# 🚀 Budgetly Setup Guide

## Quick Start

### 1. Environment Setup

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/budgetly
```

### 2. MongoDB Options

#### Option A: Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Create database: `budgetly`

#### Option B: MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account and cluster
3. Get connection string
4. Replace `MONGODB_URI` with your Atlas connection string

### 3. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000`

## 🔧 Database Schema

The app automatically creates these collections:

- **users** - User profiles and financial data
- **productsuggestions** - Financial suggestion history

## 📊 Sample Data

The app creates a demo user with sample data. You can:

1. Add income entries
2. Add expenses (one-time or EMI)
3. View financial analytics
4. Get purchase suggestions

## 🛠 Troubleshooting

### Connection Issues
- Check if MongoDB is running
- Verify connection string in `.env.local`
- Ensure network access (for Atlas)

### Data Not Loading
- Check browser console for errors
- Verify API routes are working
- Check MongoDB connection

## 🔒 Security Notes

- Never commit `.env.local` to version control
- Use environment variables in production
- Consider adding authentication middleware

## 📈 Next Steps

1. Add real user authentication
2. Implement data validation
3. Add backup strategies
4. Set up monitoring

---

**Need help?** Check the main README.md for detailed documentation. 