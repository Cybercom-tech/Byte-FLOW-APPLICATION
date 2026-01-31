# Environment Variables Setup

## Create .env File

Create a file named `.env` in the `backend` folder with the following content:

```env
# MongoDB Connection String
# For local MongoDB:
MONGO_URI=mongodb://localhost:27017/byteflow

# For MongoDB Atlas (cloud):
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/byteflow?retryWrites=true&w=majority

# JWT Secret Key (generate a strong random string)
JWT_SECRET=byteflow_jwt_secret_key_2024_change_in_production

# Server Port
PORT=5000
```

## Generate Secure JWT Secret

To generate a secure JWT secret, run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and replace the `JWT_SECRET` value in your `.env` file.

## MongoDB Setup Options

### Option 1: Local MongoDB

1. Download and install MongoDB Community Edition
2. Start MongoDB service
3. Use: `MONGO_URI=mongodb://localhost:27017/byteflow`

### Option 2: MongoDB Atlas (Free Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a cluster (free tier available)
4. Create database user
5. Whitelist IP (0.0.0.0/0 for development)
6. Get connection string
7. Use the connection string as your `MONGO_URI`

## Important Notes

- **Never commit `.env` file to git** (it's already in .gitignore)
- Change `JWT_SECRET` to a strong random string in production
- For production, use environment-specific MongoDB connection strings
- Keep your JWT secret secure and never share it

