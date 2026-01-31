# Byteflow Backend API

Complete backend API for the Byteflow training platform.

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create `.env` File**
   ```env
   MONGO_URI=mongodb://localhost:27017/byteflow
   JWT_SECRET=your_secret_key_here
   PORT=5000
   ```

3. **Start Server**
   ```bash
   npm run dev
   ```

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 minutes
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed setup instructions
- **[ENV_SETUP.md](./ENV_SETUP.md)** - Environment variables guide
- **[BACKEND_COMPLETION_SUMMARY.md](./BACKEND_COMPLETION_SUMMARY.md)** - Complete API documentation

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Auth middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   └── server.js        # Main server file
├── .env                 # Environment variables (create this)
├── package.json         # Dependencies
└── README.md           # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Courses
- `GET /api/course/all-courses` - Get all courses
- `GET /api/course/:courseId` - Get single course
- `POST /api/course/create-course` - Create course (teacher)

### Students
- `POST /api/student/profile` - Create student profile
- `GET /api/student/student-dashboard` - Get dashboard
- `POST /api/student/enroll` - Enroll in course
- `GET /api/student/enrollments` - Get enrollments

### Teachers
- `POST /api/teacher/create-profile` - Create teacher profile
- `GET /api/teacher/students` - Get all students
- `GET /api/teacher/courses/:courseId/students` - Get course students

### Admin
- `GET /api/admin/pending-courses` - Get pending courses
- `PUT /api/admin/courses/:courseId/approve` - Approve course
- `PUT /api/admin/courses/:courseId/reject` - Reject course
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/enrollments/:enrollmentId/verify-payment` - Verify payment

### Messages
- `POST /api/messages/teacher/send` - Send message to students
- `POST /api/messages/teacher/zoom-link` - Send Zoom link
- `GET /api/messages/student/messages` - Get student messages

### Payments
- `POST /api/payment/verify` - Verify payment
- `GET /api/payment/status` - Get payment status
- `POST /api/payment/webhook` - Payment webhook

See [BACKEND_COMPLETION_SUMMARY.md](./BACKEND_COMPLETION_SUMMARY.md) for complete API documentation.

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📦 Dependencies

- express
- mongoose
- jsonwebtoken
- bcryptjs
- cors
- dotenv
- nodemon (dev)

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Environment variables for secrets
- CORS configuration

## 🧪 Testing

Test endpoints using:
- Postman
- cURL
- Browser fetch API
- See `docs/postman-tests.txt` for test examples

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `PORT` | Server port | No (default: 5000) |

## 🚨 Important Notes

- Never commit `.env` file to git
- Use strong JWT secret in production
- Configure CORS for production
- Set up MongoDB properly before starting

## 📞 Support

For issues or questions, refer to:
- `SETUP_GUIDE.md` - Setup troubleshooting
- `BACKEND_COMPLETION_SUMMARY.md` - API reference

## 🎯 Next Steps

1. ✅ Backend setup complete
2. Set up MongoDB (local or Atlas)
3. Create `.env` file
4. Start server: `npm run dev`
5. Test endpoints
6. Integrate with frontend

