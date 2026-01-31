# LeadPage Training Website – Full Overview

This document describes everything that can be done on the site, separated by role: **Student**, **Teacher**, **Payment Admin**, and **General Admin**, including login details and step-by-step flows.

---

## Table of Contents

1. [Student – What You Can Do](#1-student--what-you-can-do)
2. [Teacher – What You Can Do](#2-teacher--what-you-can-do)
3. [Payment Admin – What You Can Do](#3-payment-admin--what-you-can-do)
4. [General Admin – What You Can Do](#4-general-admin--what-you-can-do)
5. [Credentials Summary](#5-credentials-summary)

---

## 1. Student – What You Can Do

### How to Get Started

- **Sign up:** Go to **Training** → **Login/Sign Up** (`/training/auth`). Choose **Sign Up**, enter name, email, password, and select **Student**. Submit to register and auto-login.
- **Login:** Same page, use **Login** with your email and password.

---

### Browsing & Enrolling in Courses

| Action | Where | How |
|--------|--------|-----|
| **Browse catalog** | `/training/catalog` (Training → Catalog) | View all courses (default + teacher-created approved courses). Use search and filters. |
| **View course details** | Click a course → `/training/course/:id` | See title, description, instructor, curriculum, reviews, rating. |
| **Enroll in a course** | From course detail page | Click **Enroll Now** → you are taken to **Checkout** for that course. |

---

### Checkout & Payment (Enrollment)

- **Page:** `/training/checkout/:id` (e.g. `/training/checkout/1`).
- **Steps:**
  1. Confirm your name and email (pre-filled if logged in).
  2. Choose **Bank Transfer** as payment method.
  3. Enter bank details if needed (e.g. bank name, account number).
  4. **Upload a payment screenshot** (proof of transfer) – required for manual verification.
  5. Optionally enter transaction ID.
  6. Submit.
- **After submit:** Enrollment is created with status **pending**. You see a success message; the course will appear in your dashboard only after a **Payment Admin** verifies the payment.
- **Notifications:** When payment is verified you get a **payment_approved** notification; if it is rejected you get **payment_rejected** with a reason.

---

### Student Dashboard

- **Page:** `/training/student` (header: **My Dashboard** when logged in as student).
- **What you see:**
  - **My Enrolled Courses:** All courses you are enrolled in (active and pending).
  - **Progress:** Progress bar per course (0–100%). You can update progress from the course detail page (e.g. marking sections complete).
  - **Course completion:** When progress reaches 100%, the course is marked complete and you may be prompted to leave a review.
- **Actions:**
  - Click a course to open its **Course Detail** page (content, curriculum, progress).
  - **Chat** with the teacher via the floating **Chat** widget (see below).

---

### Reviews – Where and How

- **Who can review:** Only **students** who have **completed** a course (100% progress) taught by that teacher.
- **Where to review:** On the **Teacher Profile** page: `/training/teacher/:id` (e.g. open instructor name from a course → their profile).
- **Steps:**
  1. Go to the teacher’s profile.
  2. Open the **Reviews** tab.
  3. If you have completed at least one course by this teacher, you see **“Write a Review”** and a list of **completed courses** you can review.
  4. Select the **course** you want to review.
  5. Choose **rating** (e.g. 1–5 stars).
  6. Write **review text**.
  7. Submit. You can only submit **one review per course** per teacher; you can edit or delete your own review later from the same place.
- **Where reviews appear:** On the **Course Detail** page for that course (reviews section) and on the teacher’s **Reviews** tab.

---

### Chatting (Student ↔ Teacher)

- **Where:** Floating **Chat** widget (bottom-right of the screen when you are logged in as a student).
- **How it works:**
  1. Open the chat widget.
  2. **Select a course** from your enrolled courses.
  3. You see the **conversation with the teacher** for that course (incoming and your sent messages).
  4. Type a message and send. The teacher receives it and can reply from their dashboard/chat.
- **Scope:** One conversation per course; each course has its own thread with the course instructor.

---

### Notifications (Student)

- **Where:** Bell icon in the **header** (top-right).
- **Types you may get:**  
  `payment_approved`, `payment_rejected`, `student_assigned` (after verification), reminders, announcements.
- **Action:** Click the bell to open the dropdown; click a notification to mark it read.

---

## 2. Teacher – What You Can Do

### How to Get Started

- **Sign up:** `/training/auth` → Sign Up → choose **Teacher**. After signup you may be guided to **Teacher Onboarding** (`/training/onboarding`) to complete your profile.
- **Login:** Same page with email and password.

---

### Teacher Dashboard

- **Page:** `/training/teacher-dashboard` (header: **Dashboard** when logged in as teacher).
- **Tabs / features:**
  - **My courses:** List of courses you teach (created by you and approved, or assigned to you).
  - **Per course:** List of **enrolled students**, **Zoom link** (set and share), **send messages** to students, **view student progress**, and **toggle section completion** for students.
  - **Messages:** View and reply to messages from students (per course / per student).
- **Zoom:** You can set meeting link, meeting ID, password, date/time and send to students for a course.

---

### Managing Your Courses (Create, Edit, Submit for Approval)

- **Page:** `/training/teacher-courses` (header: **Manage Courses** for teachers).
- **Create a course:**
  1. Click **Create Course** (or similar).
  2. Fill in title, description, curriculum/sections, etc.
  3. Save. The course is created but **not** visible in the public catalog until a **General Admin** approves it.
- **Edit / Delete:** From the same page you can edit or delete your own courses (before or after approval, depending on implementation).
- **Submit for approval:** Teacher-created courses go into **pending** state; a **General Admin** reviews them in **Course Moderation** and approves or rejects. You get a notification when approved (`course_approved`) or rejected (with reason).

---

### Teacher Profile (Public)

- **Page:** `/training/teacher/:id` – your public profile (e.g. when students click your name from a course).
- **Content:** Name, title, bio, courses you teach, **Reviews** tab (reviews from students who completed your courses). You cannot review yourself; only students see the review form.

---

### Chatting (Teacher ↔ Students)

- **Where:** Same floating **Chat** widget, used as **teacher**.
- **How:**
  1. Open the chat.
  2. Select a **course** (or see list of students/conversations per course).
  3. View messages from students and reply. You can also send **broadcast** or **targeted** messages to students from the **Teacher Dashboard** (messages tab / send message).

---

### Notifications (Teacher)

- **Where:** Bell icon in header.
- **Types:** `course_approved`, `course_rejected`, `student_assigned` (new student enrolled after payment verification), reminders, announcements.

---

## 3. Payment Admin – What You Can Do

Payment Admin **only** handles payment verification and related enrollment actions. They do **not** manage users, courses, or certificates.

### Login

- **Page:** `/training/admin-auth`.
- **Step:** Select **“Payment Admin”**, then log in with Payment Admin credentials (see [Credentials](#5-credentials-summary)).

---

### Payment Management (Verify / Reject Payments)

- **Page:** `/training/payment-management` (link shown in header when logged in as Payment Admin).
- **What you see:** List of enrollments that have **payment screenshots** (or payment info): pending, verified (active), and rejected.
- **Filters:** e.g. All, Pending, Confirmed, Rejected.
- **For each enrollment:** Student name, course, amount, payment method, **screenshot** (image), transaction ID, date.
- **Actions:**
  - **Verify payment:** Confirm the payment → enrollment status becomes **active**; student gets access to the course and a **payment_approved** notification; teacher gets **student_assigned**.
  - **Reject payment:** Reject with a **reason** → enrollment is cancelled/rejected; student gets **payment_rejected** notification with the reason.
- **Where from:** You land here after login; the list is loaded from the backend (all relevant enrollments with payment data). You do **not** need to go to Course Moderation or User Management (those are for General Admin).

---

### Notifications (Payment Admin)

- **Types:** e.g. `new_payment` – when a student submits payment (e.g. screenshot) for an enrollment, so you know to go to **Payment Management** and verify or reject.

---

## 4. General Admin – What You Can Do

General Admin handles **content moderation**, **users**, and **certificates**. They do **not** verify payments (that is Payment Admin). Optionally they may have a payment **overview** (read-only).

### Login

- **Page:** `/training/admin-auth`.
- **Step:** Select **“General Admin”**, then log in with General Admin credentials (see [Credentials](#5-credentials-summary)).

---

### Course Moderation (Approve / Reject Teacher Courses)

- **Page:** `/training/course-moderation`.
- **What you see:** List of **pending** courses (submitted by teachers) waiting for approval.
- **For each course:** Title, description, teacher, preview/details.
- **Actions:**
  - **Approve:** Course becomes **approved** and appears in the **catalog**; teacher gets **course_approved** notification.
  - **Reject:** Enter a **reason** → teacher gets **course_rejected** notification with that reason.
- **Where from:** Header link **“Course Moderation”** (or similar) when logged in as General Admin. Only teacher-created courses that are pending appear here; default/catalog courses are not moderated here.

---

### User Management (View, Block/Unblock)

- **Page:** `/training/user-management`.
- **What you see:** List of all **users** (students and teachers; admins are typically excluded from the list).
- **Filters:** All, Student, Teacher, Banned.
- **Search:** By name or email.
- **Actions:**
  - **Block (ban) user:** Toggle to block a student or teacher. Blocked users cannot log in and get a “banned” message.
  - **Unblock:** Toggle again to unblock.
- **Where from:** Header link **“User Management”** when logged in as General Admin.

---

### Certificate Management (Mark Certificates Sent)

- **Page:** `/training/certificate-management`.
- **What you see:** List of **certificate requests** – enrollments where the student has **completed** the course (100%) and is eligible for a certificate.
- **Filters:** Pending, Sent, All.
- **Search:** By student name, email, or course title.
- **Actions:**
  - **Mark as sent:** For each request you can mark the certificate as sent (e.g. after you email or mail it). This updates the record so it shows under “Sent” and avoids duplicate handling.
- **Where from:** Header link **“Certificate Management”** when logged in as General Admin. General admins are also notified when a student completes a course (`certificate_required`) so they know to prepare/send certificates.

---

### Payment Overview (If Available)

- **Page:** `/training/payment-overview` (if shown for General Admin).
- **Purpose:** Read-only overview of payments/enrollments (e.g. for reporting). **Verify/Reject** is done only in **Payment Management** by Payment Admin.

---

### Notifications (General Admin)

- **Types:** `course_submitted` (new course to moderate), `certificate_required` (student completed course – certificate needed), and other platform alerts. Shown in the header bell.

---

## 5. Credentials Summary

Use these **only** in development/testing. Change them in production.

### Payment Admin

- **Login page:** `/training/admin-auth` → select **Payment Admin**.
- **Email:** `payment@byteflow.com`  
  (alternative: `paymentadmin`)
- **Password:** `payment123`  
  (alternative: `payment`)
- **Created by:** Run in backend: `node src/scripts/createAdmin.js` (creates both admin accounts in the database).

### General Admin

- **Login page:** `/training/admin-auth` → select **General Admin**.
- **Email:** `admin@byteflow.com`  
  (alternatives: `admin`, `moderator@byteflow.com`)
- **Password:** `admin123`  
  (alternative: `admin`)
- **Created by:** Same script: `node src/scripts/createAdmin.js`.

---

## Quick Reference – Who Can Do What

| Feature | Student | Teacher | Payment Admin | General Admin |
|--------|---------|---------|----------------|----------------|
| Browse catalog | ✅ | ✅ | ❌ | ❌ |
| Enroll & checkout | ✅ | ❌ | ❌ | ❌ |
| Student dashboard, progress | ✅ | ❌ | ❌ | ❌ |
| Write review (after completion) | ✅ | ❌ | ❌ | ❌ |
| Chat with teacher/students | ✅ | ✅ | ❌ | ❌ |
| Create/edit courses, submit for approval | ❌ | ✅ | ❌ | ✅ (create/edit) |
| Teacher dashboard, Zoom, messages | ❌ | ✅ | ❌ | ❌ |
| Verify / reject payments | ❌ | ❌ | ✅ | ❌ |
| Course moderation (approve/reject) | ❌ | ❌ | ❌ | ✅ |
| User management (block/unblock) | ❌ | ❌ | ❌ | ✅ |
| Certificate management (mark sent) | ❌ | ❌ | ❌ | ✅ |
| Payment overview (read-only) | ❌ | ❌ | ❌ | ✅ |

---

## Routes Summary

| Route | Role | Purpose |
|------|------|--------|
| `/training` | All | Training welcome/landing |
| `/training/auth` | All | Login / Sign up (student & teacher) |
| `/training/admin-auth` | Admin | Admin login (Payment or General) |
| `/training/catalog` | All | Course catalog |
| `/training/course/:id` | All | Course detail, enroll (student) |
| `/training/checkout/:id` | Student | Checkout & payment (e.g. bank + screenshot) |
| `/training/student` | Student | Student dashboard (enrollments, progress) |
| `/training/teacher/:id` | All | Teacher public profile, reviews |
| `/training/teacher-dashboard` | Teacher | Dashboard (courses, students, Zoom, messages) |
| `/training/teacher-courses` | Teacher | Manage/create/edit courses |
| `/training/onboarding` | Teacher | Teacher onboarding/profile |
| `/training/payment-management` | Payment Admin | Verify/reject payments |
| `/training/payment-overview` | General Admin | Payment overview (read-only) |
| `/training/course-moderation` | General Admin | Approve/reject teacher courses |
| `/training/user-management` | General Admin | Users list, block/unblock |
| `/training/certificate-management` | General Admin | Certificate requests, mark sent |

---

*Last updated to match the current codebase: roles, routes, and features as implemented for Student, Teacher, Payment Admin, and General Admin.*
