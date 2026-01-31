# Backend Setup Guide

## Prerequisites

1. **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
2. **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (cloud)

## Step 1: Install Dependencies

Navigate to the backend directory and install dependencies:

```bash
cd "backend"
npm install
```

## Step 2: Set Up MongoDB

### Option A: Local MongoDB

1. Install MongoDB Community Edition
2. Start MongoDB service:
   - **Windows**: MongoDB should start automatically as a service
   - **Mac/Linux**: `sudo systemctl start mongod` or `brew services start mongodb-community`
3. Verify MongoDB is running: `mongosh` or `mongo`

### Option B: MongoDB Atlas (Cloud - Recommended for Development)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free tier available)
4. Create a database user
5. Whitelist your IP address (or use 0.0.0.0/0 for development)
6. Get your connection string
7. Update `.env` file with your Atlas connection string:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/byteflow?retryWrites=true&w=majority
   ```

## Step 3: Configure Environment Variables

1. The `.env` file has been created with default values
2. Update the following in `.env`:
   - `MONGO_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A strong random string (generate one for production)
   - `PORT` - Server port (default: 5000)

### Generate a Strong JWT Secret

Run this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as your `JWT_SECRET` in the `.env` file.

## Step 4: Start the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
node src/server.js
```

The server should start on `http://localhost:5000` (or your configured PORT).

You should see:
```
MongoDB Connected: ...
Server running on port 5000
```

## Step 5: Test the API

### Using Browser

Open: `http://localhost:5000`

You should see: "Backend is running..."

### Using Postman or cURL

Test the signup endpoint:

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "userType": "student"
  }'
```

## Common Issues

### MongoDB Connection Error

**Error**: `MongoDB connection failed`

**Solutions**:
1. Check if MongoDB is running: `mongosh` or check MongoDB service
2. Verify `MONGO_URI` in `.env` is correct
3. For Atlas: Check IP whitelist and credentials
4. Check firewall settings

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solutions**:
1. Change `PORT` in `.env` to a different port (e.g., 5001)
2. Or kill the process using port 5000:
   - Windows: `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`
   - Mac/Linux: `lsof -ti:5000 | xargs kill`

### Module Not Found

**Error**: `Cannot find module '...'`

**Solution**: Run `npm install` again

## API Base URL

For frontend integration, use:
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Next Steps

1. ✅ Backend is set up and running
2. Update frontend to use API endpoints (see `FRONTEND_INTEGRATION.md`)
3. Test all endpoints with Postman
4. Set up CORS for production

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/byteflow` |
| `JWT_SECRET` | Secret key for JWT tokens | `your_secret_key_here` |
| `PORT` | Server port | `5000` |
| `CORS_ORIGIN` | Allowed frontend origin (optional) | `http://localhost:5173` |

