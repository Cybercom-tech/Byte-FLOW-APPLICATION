# 📦 Database Setup Guide

## For Project Recipients (New Users)

If you received this project and need to set up the database with existing data, follow these steps:

---

## ✅ Prerequisites

1. **MongoDB installed locally** - [Download MongoDB](https://www.mongodb.com/try/download/community)
2. **MongoDB service running** (should start automatically after installation)
3. **Node.js installed** - [Download Node.js](https://nodejs.org/)

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Install Dependencies

Navigate to the `backend` folder and install dependencies:

```bash
cd backend
npm install
```

### Step 2: Check MongoDB is Running

Make sure MongoDB is running. On Windows, check the service:

```powershell
Get-Service MongoDB
```

You should see: `Status: Running`

If not running, start it:

```powershell
net start MongoDB
```

### Step 3: Import the Database

Run the import script to load all the data:

```bash
node import-database.js
```

You should see:
```
✅ Connected to MongoDB
✅ Imported X documents...
🎉 Import Complete!
```

### Step 4: Start the Server

```bash
npm run dev
```

You should see:
```
MongoDB Connected: localhost
Server running on port 5000
```

---

## ✅ That's It!

Your backend is now running with all the data!

Test it by opening: **http://localhost:5000**

---

## 📁 What's in database-backup Folder?

The `database-backup` folder contains JSON files for each collection:

- `users.json` - User accounts
- `admins.json` - Admin accounts
- `courses.json` - Course data
- `messages.json` - Messages
- `students.json` - Student data
- `teachers.json` - Teacher data
- And more...

These files are automatically imported when you run `import-database.js`.

---

## 🔄 For Project Owner (Updating the Database Backup)

If you've made changes to your database and want to update the backup files:

```bash
node export-database.js
```

This will update all JSON files in the `database-backup` folder with your latest data.

Then commit and push the updated files to share with your team!

---

## ⚠️ Troubleshooting

### "Cannot connect to MongoDB"

- Make sure MongoDB is installed and running
- Check if the service is active: `Get-Service MongoDB`
- Try restarting MongoDB service

### "database-backup folder not found"

- Make sure you're in the `backend` directory
- The folder should be at `backend/database-backup/`
- If missing, ask the project owner for the database backup files

### "Port 5000 already in use"

- Change the port in `.env` file: `PORT=5001`
- Or stop the process using port 5000

---

## 💡 Pro Tips

- The `.env` file is already configured for local MongoDB
- Your data is completely local - no cloud connection needed
- MongoDB data is stored in `C:\data\db` on Windows
- The backup files make it easy to share and version control your database!

---

## 📚 Next Steps

Once your backend is running:

1. ✅ Test the API endpoints
2. ✅ Connect your frontend
3. ✅ Start building!

**Need help?** Check the main README.md for more information.

