# Admin Account Setup Guide

## Overview

Admin accounts are required to:
- Approve/reject courses (General Admin)
- Verify payments (Payment Admin)
- View all users, contacts, and newsletter subscriptions
- Manage the platform

## Admin Account Types

1. **General Admin** (`adminType: "general"`)
   - Approve/reject courses
   - Block/unblock users
   - View all platform data

2. **Payment Admin** (`adminType: "payment"`)
   - Verify payment screenshots
   - Activate enrollments
   - Manage payment-related tasks

## Creating Admin Accounts

### Method 1: Using the Setup Script (Recommended)

Run the admin creation script:

```bash
cd backend
node src/scripts/createAdmin.js
```

This will create:
- **General Admin**: `admin@byteflow.com` / `admin123`
- **Payment Admin**: `payment@byteflow.com` / `payment123`

### Method 2: Via API Signup

You can create an admin account through the signup API:

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Name",
    "email": "admin@yourdomain.com",
    "password": "securepassword123",
    "userType": "admin"
  }'
```

Then create the Admin record manually in MongoDB or via a script.

### Method 3: Manual Database Creation

1. Create a User with `userType: "admin"`:
   ```javascript
   const user = new User({
     name: "Admin Name",
     email: "admin@yourdomain.com",
     password: hashedPassword, // Use bcrypt to hash
     userType: "admin"
   });
   ```

2. Create an Admin record:
   ```javascript
   const admin = new Admin({
     userId: user._id,
     adminType: "general" // or "payment"
   });
   ```

## Default Admin Credentials

After running the setup script, you can use:

### General Admin (Content Moderator)
- **Email:** `admin@byteflow.com`
- **Password:** `admin123`
- **Access:** Course moderation, user management

### Payment Admin
- **Email:** `payment@byteflow.com`
- **Password:** `payment123`
- **Access:** Payment verification, enrollment activation

⚠️ **Important:** Change these passwords in production!

## Changing Admin Passwords

### Via Frontend
1. Login as admin
2. Go to profile settings (if implemented)
3. Change password

### Via API
```bash
# First, login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@byteflow.com",
    "password": "admin123"
  }'

# Then update password (requires password update endpoint)
```

### Via Database (Direct)
1. Hash new password using bcrypt
2. Update User document in MongoDB

## Creating Custom Admin Accounts

### Using the Script

Edit `src/scripts/createAdmin.js` and add:

```javascript
await createAdmin(
  "Your Admin Name",
  "your-admin@yourdomain.com",
  "your-secure-password",
  "general" // or "payment"
);
```

### Using MongoDB Shell

```javascript
// Connect to MongoDB
use your_database_name

// Create admin user
db.users.insertOne({
  name: "Admin Name",
  email: "admin@yourdomain.com",
  password: "$2a$10$hashedPasswordHere", // Use bcrypt to hash
  userType: "admin"
})

// Create admin record
db.admins.insertOne({
  userId: ObjectId("user_id_here"),
  adminType: "general"
})
```

## Verifying Admin Accounts

### Check via API

```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@byteflow.com",
    "password": "admin123"
  }'

# Check admin status
curl -X GET http://localhost:5000/api/auth/admin \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check in MongoDB

```javascript
// Find all admin users
db.users.find({ userType: "admin" })

// Find admin records
db.admins.find().populate("userId")
```

## Frontend vs Backend Admins

### Frontend Hardcoded Admins (Legacy)
The frontend has hardcoded admin accounts that work **without backend**:
- `admin@byteflow.com` / `admin123`
- `payment@byteflow.com` / `payment123`

These are for **development/testing only** and won't work with backend API calls.

### Backend Admin Accounts (Production)
Admin accounts created in the backend database:
- Stored in MongoDB
- Work with all API endpoints
- Required for production use

**Recommendation:** Use backend admin accounts for production.

## Security Best Practices

1. ✅ **Change Default Passwords** - Never use default passwords in production
2. ✅ **Use Strong Passwords** - Minimum 12 characters, mix of letters, numbers, symbols
3. ✅ **Limit Admin Accounts** - Only create admin accounts for trusted users
4. ✅ **Regular Audits** - Review admin accounts periodically
5. ✅ **Use HTTPS** - Always use HTTPS in production
6. ✅ **JWT Expiration** - Tokens expire after 1 day (configured in backend)

## Troubleshooting

### "Access denied. Admin only" Error
- ✅ Verify user has `userType: "admin"` in database
- ✅ Check JWT token is valid and includes admin role
- ✅ Ensure Admin record exists in database

### Admin Can't Login
- ✅ Verify email and password are correct
- ✅ Check user exists in database
- ✅ Verify `userType` is set to "admin"
- ✅ Check backend logs for errors

### Admin Can't Access Admin Routes
- ✅ Verify JWT token is being sent in Authorization header
- ✅ Check token hasn't expired
- ✅ Verify middleware is checking admin status correctly

## Testing Admin Access

1. **Login as Admin:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@byteflow.com", "password": "admin123"}'
   ```

2. **Test Admin Endpoint:**
   ```bash
   curl -X GET http://localhost:5000/api/auth/admin \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Test Course Approval:**
   ```bash
   curl -X PUT http://localhost:5000/api/admin/courses/COURSE_ID/approve \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Next Steps

1. ✅ Run the admin creation script
2. ✅ Test admin login via API
3. ✅ Test admin functionality in frontend
4. ✅ Change default passwords
5. ✅ Create additional admin accounts as needed

---

**Need Help?**
- Check backend logs: `npm run dev` in backend directory
- Verify MongoDB connection
- Review `backend/src/middlewares/authMiddleware.js` for auth logic

