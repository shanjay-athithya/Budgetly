# 🔧 MongoDB Atlas Setup Guide

## Fix IP Whitelist Issue

The error you're seeing is because your current IP address isn't whitelisted in MongoDB Atlas.

### Step 1: Get Your Current IP Address

Visit: https://whatismyipaddress.com/

### Step 2: Add IP to MongoDB Atlas Whitelist

1. **Login to MongoDB Atlas**
   - Go to https://cloud.mongodb.com
   - Sign in with your credentials

2. **Navigate to Network Access**
   - Click on your cluster
   - Go to "Network Access" in the left sidebar

3. **Add IP Address**
   - Click "Add IP Address"
   - Choose one of these options:
     - **Add Current IP Address** (recommended for development)
     - **Allow Access from Anywhere** (use `0.0.0.0/0` - less secure)
     - **Add IP Address** (manually enter your IP)

4. **For Development (Recommended)**
   - Click "Add Current IP Address"
   - This will automatically detect and add your IP

5. **For Production**
   - Use specific IP addresses
   - Or use `0.0.0.0/0` to allow all IPs (less secure)

### Step 3: Create Environment File

Create `.env.local` in your project root:

```env
MONGODB_URI=mongodb+srv://shanjay_athithya:T1o2u3r%40@budgetly.z5sxhcx.mongodb.net/budgetly?retryWrites=true&w=majority

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAWmBeLl9CHefcAftkQPBht31g1OWr-83o
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=budgetly-aadf4.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=budgetly-aadf4
NEXT_PUBLIC_FIREBASE_APP_ID=1:212151126914:web:ce82288ebfc9e86fd01d9b
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-14E8MV0NWP
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=212151126914
```

### Step 4: Test Connection

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Visit the app:**
   - Go to http://localhost:3000
   - Sign in with Google
   - The app should now connect to MongoDB

### Troubleshooting

#### Still Getting Connection Errors?

1. **Check IP Address**
   - Make sure you added the correct IP
   - Your IP might have changed if you're on a dynamic connection

2. **Check Connection String**
   - Verify the MongoDB URI is correct
   - Make sure username/password are properly encoded

3. **Check Atlas Status**
   - Ensure your Atlas cluster is running
   - Check if there are any maintenance windows

4. **Try Different IP Options**
   - If you're on a dynamic IP, consider using `0.0.0.0/0`
   - Or add multiple IP addresses

#### Security Best Practices

1. **For Development:**
   - Use "Add Current IP Address"
   - Remove IP when not needed

2. **For Production:**
   - Use specific IP addresses
   - Avoid `0.0.0.0/0` unless necessary
   - Use VPC peering for better security

3. **Regular Maintenance:**
   - Review and clean up unused IP addresses
   - Update IP addresses when they change

### Alternative: Use Local MongoDB

If Atlas continues to give issues, you can use local MongoDB:

1. **Install MongoDB Community Edition**
2. **Start MongoDB service**
3. **Update .env.local:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/budgetly
   ```

---

**Need help?** Check the MongoDB Atlas documentation or contact support. 