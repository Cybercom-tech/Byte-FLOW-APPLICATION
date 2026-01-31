// Structure of the backend

backend/
│
├── src/
│   ├── config/
│   │   └── db.js               // database connectivity feature
│   │
│   ├── models/
│   │   ├── Admin.js            // Admin model
│   │   ├── Courses.js          // Complete structure of course data, relevent fields 
│   │   ├── Enrollment.js       // Enrollment model stores data related to the enrolled course, its     
│   │   │                       progress, upcoming class date etc
│   │   ├── Notification.js     // stores data of the message broadcasted by teacher and read/seen by 
│   │                           Students
│   │   ├── Student.js          // Student dashboard data, a pic for now only.
│   │   ├── Teacher.js          // Stores relevent teacher information, the Six step form teacher see 
│   │   │                        at his/her Dashboard. PAYMENT Object will be added later...
│   │   ├── User.js             // stores general user data, name, email, paswd, usertype.  Student, 
│   │                           teacher, and admin for now only payment admin will be added later.
│   │   
│   ├── controllers/
│   │   ├── authController.js   // Signup & Login logics, signup with userdata name, email,pswd, usertype 
│   │                            and directly gets logedIn. User gets through middleware 
│   │                            (/middlewares/authmiddleware.js). Automated token generated and
│   │                            verified, pswd hashed and user tokenized. 
│   │   └── adminController.js          //  empty now
│   │   ├── courseController.js         // CRUD Ops related to course
│   │   ├── notificationController.js   // three logic, broadcasts teacher notification, student can get 
│   │                                    all notfication and can read notifcations
│   │   ├──studentController.js     // students features i.e profile create (dashboard profile which for now just include his/her pic), enrollment in a course, GET  dashboard with necessary results like progress, total No of courses he is enrolled etc.
│   │   ├── teacherController.js    //  create teacher profile and can show profile data, CRUD operations on different fields of teacher info as per design, e.g. (CRUD) Operations Creat, Read, Update, and Delete on education, experience and other fields in teacher profile. 
│   │
│   ├── routes/
│   │   ├── authRoutes.js          // relevent routes like signup and login, logut is handled at frotend,
                                    i.e. removing the JWT token from the frontend
│   │   └── coursesRoutes.js      // related routes to course creation, updation and deletion of related in courses 
│   │   ├── notificationRoutes.js // routes to create notifications by teacher for now (broadcasting), seen and read by student routes.
│   │   ├── studentRoutes.js        //  routes to get profile, see all courses, can enroll in courses etc..
│   │   ├── teacher Routes.js       // routes to get profile, update relevant profile, fields, courses are created by teacher but using courseRoutes.js to keep clean and safe code.
│   │   ├──
│   ├── middlewares/
│   │   ├── authMiddleware.js   //  middleware is the barier/door looking at the users identity i.e bearer token/ authorizaiton, this helps secure entry into the platform 
│   │
│   └── server.js // Entry to the app
│
├── .env    // file to save sensitive information like JWT key, PORT Number etc
├── package.json



TEACHER MODEL 

Teacher
 ├── userId  (from User model)
 ├── profile
 │    ├── bio
 │    ├── phone
 │    ├── city
 │    ├── skills
 │    └── image
 │
 ├── education [ array ]
 │    ├── degree
 │    ├── institute
 │    ├── startYear
 │    └── endYear
 │
 ├── experience [ array ]
 │    ├── title
 │    ├── company
 │    ├── startDate
 │    └── endDate
 │
 ├── certificates [ array ]
 │    ├── name
 │    ├── issuer
 │    └── year
 │
 ├── courses [ array ]
 │    ├── courseId
 │    └── role (teacher / assistant)
 │
 ├── isVerified
 ├── createdAt
 └── updatedAt
