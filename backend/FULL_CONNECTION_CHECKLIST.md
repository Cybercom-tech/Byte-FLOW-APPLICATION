# 🔌 Full Connection Checklist

## ✅ What's Already Done:

1. ✅ Backend code complete
2. ✅ Dependencies installed
3. ✅ `.env` file created with MongoDB connection
4. ✅ Frontend running (Vite on port 3001)

## 🚀 What You Need to Do Now:

### Step 1: Start Backend Server

**Open a NEW terminal window** and navigate to the backend folder:

```bash
cd backend
npm run dev
```

**You should see:**
```
MongoDB Connected: cluster0.h8wzobu.mongodb.net
Server running on port 5000
```

### Step 2: Verify Backend is Running

Open browser: `http://localhost:5000`

**Expected:** "Backend is running..."

### Step 3: Test API Endpoint

Test the signup endpoint:

```javascript
// In browser console or Postman
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

**Expected:** Success response with token and user data

### Step 4: Frontend-Backend Connection ✅

**Frontend has been updated to use backend API!**

✅ API configuration file created (`src/config/api.js`)
✅ API service utility created (`src/utils/api.js`)  
✅ Auth utility updated to use backend API (`src/utils/auth.js`)
✅ Course enrollment utility updated (`src/utils/courseEnrollment.js`)
✅ Course management utility updated (`src/utils/courseManagement.js`)
✅ Notifications utility updated (`src/utils/notifications.js`)
✅ Payment verification utility updated (`src/utils/paymentVerification.js`)

All utilities now make API calls to the backend instead of using localStorage.

## 📋 Complete Checklist:

### Backend:
- [x] Code complete
- [x] Dependencies installed
- [x] `.env` file created
- [ ] **Backend server started** ← YOU ARE HERE
- [ ] MongoDB connection verified
- [ ] API endpoints tested

### Frontend:
- [x] Frontend running (port 3000)
- [x] API configuration added
- [x] Auth utility updated to use API
- [x] All utilities updated to use API
- [x] CORS configured (backend allows all origins in dev)

## 🎯 Current Status:

**Backend:** Needs to be started  
**Frontend:** Running on port 3000  
**Connection:** ✅ Frontend utilities connected to backend API

## 🚀 Quick Start Commands:

### Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

### Terminal 2 (Frontend - already running):
```bash
# Already running on http://localhost:3000
```

## 🔍 Verify Full Connection:

1. **Backend running:** `http://localhost:5000` → "Backend is running..."
2. **Frontend running:** `http://localhost:3000` → Your app
3. **API working:** Test signup/login from frontend
4. **Database connected:** Check MongoDB Atlas dashboard

## 📝 Next Steps After Backend Starts:

1. Test API endpoints with Postman
2. Update frontend utilities to use API
3. Test full flow: Signup → Login → Enroll → Dashboard
4. Verify data persists in MongoDB

---

**Start the backend server now and verify the connection!** 🚀

