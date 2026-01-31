# Quick Start Guide

## ✅ Step 1: Dependencies Installed

Dependencies have been installed successfully!

## 📝 Step 2: Create .env File

**IMPORTANT**: You need to create a `.env` file in the `backend` folder.

### Option A: Manual Creation

1. Create a new file named `.env` in the `backend` folder
2. Copy and paste this content:

```env
MONGO_URI=mongodb://localhost:27017/byteflow
JWT_SECRET=byteflow_jwt_secret_key_2024_change_in_production
PORT=5000
```

### Option B: Use the Template

See `ENV_SETUP.md` for detailed instructions and MongoDB Atlas setup.

## 🗄️ Step 3: Set Up MongoDB

### Quick Option: MongoDB Atlas (Recommended)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create a cluster
4. Create database user
5. Whitelist IP: `0.0.0.0/0` (for development)
6. Get connection string
7. Update `MONGO_URI` in `.env` with your Atlas connection string

### Local Option: Install MongoDB

1. Download from https://www.mongodb.com/try/download/community
2. Install and start MongoDB service
3. Use: `MONGO_URI=mongodb://localhost:27017/byteflow`

## 🚀 Step 4: Start the Server

Once your `.env` file is created and MongoDB is set up:

```bash
npm run dev
```

You should see:
```
MongoDB Connected: ...
Server running on port 5000
```

## ✅ Step 5: Test the Server

Open your browser and go to:
```
http://localhost:5000
```

You should see: **"Backend is running..."**

## 🧪 Step 6: Test API Endpoint

Test the signup endpoint using Postman, cURL, or your browser's fetch:

```javascript
fetch('http://localhost:5000/api/auth/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    userType: 'student'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

## 📚 Next Steps

1. ✅ Backend server is running
2. Update frontend to use API endpoints
3. Test all endpoints
4. Set up production environment

## 🆘 Troubleshooting

### "Cannot find module 'dotenv'"
- Run: `npm install`

### "MongoDB connection failed"
- Check if MongoDB is running
- Verify `MONGO_URI` in `.env` is correct
- For Atlas: Check IP whitelist and credentials

### "Port 5000 already in use"
- Change `PORT=5001` in `.env`
- Or kill the process using port 5000

### ".env file not found"
- Make sure `.env` is in the `backend` folder
- Check file name is exactly `.env` (not `.env.txt`)

## 📖 Full Documentation

- `SETUP_GUIDE.md` - Detailed setup instructions
- `ENV_SETUP.md` - Environment variables guide
- `BACKEND_COMPLETION_SUMMARY.md` - Complete API documentation

