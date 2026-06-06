# 🚀 QuickEMS - Employee Management System

A modern, high-performance, and visually stunning Employee Management System built using the MERN stack (MongoDB, Express, React, Node.js). 

**QuickEMS** is designed with top-tier aesthetics, glassmorphism UI elements, dark mode support, customizable accent themes, and strict role-based access control.

---

## ✨ Features

### 👤 Role-Based Portals & Access Control
- **Administrator Portal**:
  - Full CRUD operations to add, view, update, and delete employees.
  - Manage salaries, positions, departments, and active statuses.
  - Approve or reject employee leave requests with admin notes.
  - Issue, track, and print employee payslips (with auto-generation).
  - Mark and manage daily attendance records.
- **Employee Portal**:
  - Personal dashboard showing attendance summaries, leave balances, and profile details.
  - Apply for leaves and track request statuses.
  - View and print monthly payslips.
  - Self-view attendance history records (blocked from viewing other employees).

### 🎨 Premium UI/UX & Theme Customization
- **Theme Switcher**: Seamlessly switch between Light, Dark, and System modes.
- **Accent Palettes**: Customize the app's branding on the fly (Indigo, Violet, Blue, Emerald, Rose, Amber).
- **Box-like Sidebar**: Re-designed navigation sidebar containing individual card-styled user profiles, solid active link blocks with drop shadows, and hover micro-animations.
- **Interactive Modals & Notifications**: Modern, animated form entries and confirmation flows using `react-hot-toast` notifications.

### 🔒 Security & Performance
- JWT-based authorization with credentials stored securely in HTTP-only/local storage.
- Password hashing using `bcrypt`.
- Database cascading: deleting an employee automatically clears their associated attendance records, leaves, and payslips.
- Fully production-ready serverless configuration for instant deployment on Vercel.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), React Router v7, Tailwind CSS, Axios, Lucide Icons, React Hot Toast
- **Backend**: Node.js, Express.js, Mongoose, JWT, bcrypt
- **Database**: MongoDB

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or a MongoDB Atlas URI)

### 1. Clone the repository
```bash
git clone https://github.com/Sg-2003/EMS-2026.git
cd EMS-2026
```

### 2. Configure Environment Variables
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ems
JWT_SECRET=your_jwt_secret_key
```

### 3. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 4. Run the Application
Start both the backend server and Vite frontend:
```bash
# In the server directory
npm run dev

# In the client directory
npm run dev
```
Open `http://localhost:5173` to access the application.

---

## 🚀 Production Deployment (Vercel)

The project is pre-configured to build and run as a single Vercel deployment using serverless functions:

1. Connect your GitHub repository to Vercel.
2. The project's root `vercel.json` will automatically build the React client (`/client`) and host the Express server (`/server/server.js`) under `/api`.
3. Add the following **Environment Variables** in Vercel:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure signing key for authorization tokens.

---

## 📄 License
This project is open-source and available under the MIT License.
