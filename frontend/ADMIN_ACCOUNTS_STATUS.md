# Admin Accounts Status

## Current Status

### ❌ Backend Admin Accounts: NOT CREATED YET

Admin accounts need to be created in the MongoDB database. The backend supports admin users, but no admin accounts have been created yet.

### ✅ Frontend Hardcoded Admins: Available (Development Only)

The frontend has hardcoded admin accounts that work **without the backend**:
- `admin@byteflow.com` / `admin123` (General Admin)
- `payment@byteflow.com` / `payment123` (Payment Admin)

⚠️ **Note:** These only work for frontend-only features. They won't work with backend API calls.

## Quick Setup

### Step 1: Create Admin Accounts

Run the admin creation script:

```bash
cd backend
npm run create-admin
```

This will create:
- **General Admin**: `admin@byteflow.com` / `admin123`
- **Payment Admin**: `payment@byteflow.com` / `payment123`

### Step 2: Verify Admin Accounts

Test login via API:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@byteflow.com",
    "password": "admin123"
  }'
```

### Step 3: Test Admin Access

```bash
# Get your token from login response, then:
curl -X GET http://localhost:5000/api/auth/admin \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Admin Account Types

1. **General Admin** (`adminType: "general"`)
   - Approve/reject courses
   - Block/unblock users
   - View all contacts and newsletter subscriptions
   - Full platform access

2. **Payment Admin** (`adminType: "payment"`)
   - Verify payment screenshots
   - Activate enrollments
   - Manage payment-related tasks

## What You Need to Do

1. ✅ **Create Admin Accounts** - Run `npm run create-admin` in backend
2. ✅ **Test Login** - Verify admin can login via API
3. ✅ **Change Passwords** - Update default passwords for production
4. ✅ **Test Admin Features** - Test course approval, payment verification, etc.

## Documentation

- **`backend/ADMIN_SETUP.md`** - Complete admin setup guide
- **`backend/src/scripts/createAdmin.js`** - Admin creation script

## Security Notes

⚠️ **Important for Production:**
- Change default passwords immediately
- Use strong passwords (12+ characters)
- Limit admin account creation
- Regularly audit admin accounts

---

**Status:** ⚠️ **Admin accounts need to be created in the database**

