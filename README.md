# BAWABT ALMASKAN - Employee Labour Management System

🏢 **Company:** BAWABT ALMASKAN Real Estate  
📍 **Location:** Dubai, UAE  
💼 **Purpose:** Digital workforce management for construction and labour operations

A comprehensive web-based application to digitalize daily attendance tracking, overtime hours, site management, and monthly payroll calculation. Replaces manual labour cards with automated Google Sheets-based system.

## Features

### 👷 For Supervisors
- ✅ Mark daily attendance for all employees
- ✅ Record overtime hours
- ✅ Assign employees to work sites
- ✅ View attendance history
- ✅ Edit pending attendance records

### 👨‍💼 For Managers
- ✅ Complete employee management (add/edit/delete)
- ✅ Site management with location tracking
- ✅ Approve/reject attendance submissions
- ✅ Generate monthly payroll in AED
- ✅ Export professional PDF reports
- ✅ Excel data exports
- ✅ User account management
- ✅ Complete audit trail
- ✅ Mobile-responsive interface

## Tech Stack

### Frontend
- **React 18** with **Vite** - Fast, modern development
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **React Router v6** - Client-side routing
- **Zustand** - State management
- **Tanstack Query** - Server state management
- **date-fns** - Date manipulation
- **jsPDF** - PDF generation
- **xlsx** - Excel export
- **Lucide React** - Icons

### Backend
- **Node.js + Express** - REST API
- **Google Sheets API v4** - Database layer
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **express-validator** - Input validation

### Database
- **Google Sheets** - Primary data store
  - Sheet 1: Users
  - Sheet 2: Employees
  - Sheet 3: Attendance
  - Sheet 4: Sites
  - Sheet 5: Audit Logs

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Google Cloud Project with Sheets API enabled
- Service Account JSON credentials

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
JWT_SECRET=your_secure_jwt_secret_here
GOOGLE_SHEETS_ID=your_google_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

4. Start server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:5000
```

4. Start development server:
```bash
npm run dev
```

5. Open browser at `http://localhost:5173`

## Google Sheets Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable **Google Sheets API**

### 2. Create Service Account
1. Go to **IAM & Admin > Service Accounts**
2. Create service account
3. Generate JSON key
4. Copy credentials to `.env` file

### 3. Create Google Sheet
1. Create new Google Sheet
2. Copy Sheet ID from URL: `docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Share sheet with service account email (Editor access)
4. Rename tabs: `Users`, `Employees`, `Attendance`, `Sites`, `AuditLogs`

### 4. Initialize Headers
Run this once to set up sheet headers:
```bash
cd backend
npm run init-sheets
```

## 🔐 Admin Login

**Default Admin Account:**
- Email: `admin@bawabtalmaskan.com`
- Password: `admin`
- Role: Manager

### Create Admin User

```bash
cd backend
npm run create-admin
```

⚠️ **IMPORTANT:** Change the default password immediately after first login!

### Add Supervisors

1. Login as admin/manager
2. Go to "Supervisors" page
3. Click "Add Supervisor"
4. Fill in details and assign role

## 🚀 Deployment

### Frontend - Vercel (Recommended)

**Automatic Deployment:**
1. Push to GitHub
2. Import project in Vercel
3. Configure build settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variable:
   - `VITE_API_URL` = Your backend URL
5. Deploy ✅

**Manual Deployment:**
```bash
cd frontend
npm run build
vercel --prod
```

### Backend - Render/Railway/Heroku

**Render.com (Recommended):**
1. Push code to GitHub: `https://github.com/amjad4billionets/bawabt-almaskan-labour-management.git`
2. Create new Web Service in Render
3. Connect GitHub repository
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables (see `.env.example`)
6. Deploy ✅

**Environment Variables (Backend):**
```
PORT=5000
JWT_SECRET=your_secure_random_string_here
GOOGLE_SHEETS_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CORS_ORIGIN=https://your-frontend.vercel.app
NODE_ENV=production
```

### ✅ Vercel Compatibility

**Frontend:** ✅ **YES** - Perfect for Vercel  
**Backend:** ⚠️ **NOT RECOMMENDED** - Use Render/Railway instead

**Why?** Backend needs long-running Node.js server. Vercel is optimized for serverless functions. Use:
- **Vercel** for React frontend
- **Render/Railway** for Express backend

## Project Structure

```
employee-labour-manage/
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utils, API client
│   │   ├── hooks/          # Custom hooks
│   │   ├── store/          # Zustand stores
│   │   └── App.jsx         # Main app component
│   ├── public/
│   └── package.json
│
├── backend/                # Express API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Business logic
│   │   ├── services/       # Google Sheets service
│   │   ├── middleware/     # Auth, validation
│   │   └── server.js       # Entry point
│   └── package.json
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Employees (Manager only)
- `GET /api/employees` - List all employees
- `POST /api/employees` - Add new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance (Supervisor)
- `PUT /api/attendance/:id` - Edit attendance
- `POST /api/attendance/:id/approve` - Approve attendance (Manager)

### Sites (Manager only)
- `GET /api/sites` - List all sites
- `POST /api/sites` - Add new site
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Delete site

### Payroll (Manager only)
- `GET /api/payroll/:month/:year` - Calculate monthly payroll
- `GET /api/payroll/:month/:year/export` - Export as PDF/Excel

### Audit Logs (Manager only)
- `GET /api/audit` - View audit logs

## 🔒 Security Features

- ✅ JWT-based authentication (7-day sessions)
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Role-based access control (Manager/Supervisor)
- ✅ Input validation and sanitization
- ✅ Complete audit trail logging
- ✅ Secure session management
- ✅ CORS protection
- ✅ Google Sheets API security

## 🌍 Currency & Localization

- **Currency:** AED (UAE Dirham)
- **Date Format:** DD/MM/YYYY
- **Time Zone:** Asia/Dubai (UAE)
- **Language:** English

## 📊 Data Storage

- **Database:** Google Sheets (Cloud-based)
- **Authentication:** JWT tokens
- **File Storage:** Google Drive (for exports)
- **Backup:** Manual download from Google Sheets

## 🎨 UI Features

- ✅ Modern, professional design
- ✅ Mobile-responsive (works on phones/tablets)
- ✅ Company branding (BAWABT ALMASKAN)
- ✅ Expandable tables for mobile
- ✅ Icon-based compact views
- ✅ Professional PDF reports
- ✅ Dark mode friendly

## 📱 Mobile Optimization

- Responsive tables with expandable rows
- Touch-friendly buttons (44px minimum)
- Compact column headers
- Icon-based status indicators
- Mobile-first navigation

## 🔧 Maintenance

### Regular Backups

**Manual Backup (Recommended):**
1. Open Google Sheets
2. File → Download → Excel (.xlsx)
3. Save monthly backups

### Update Admin Password

1. Login as admin
2. Go to Settings/Profile
3. Change password
4. Use strong password (12+ characters)

## 📞 Support

**Company:** BAWABT ALMASKAN Real Estate  
**System:** Employee Labour Management  
**Version:** 1.0  
**GitHub:** https://github.com/amjad4billionets/bawabt-almaskan-labour-management

For technical support or feature requests, contact the development team.

## 📄 License

Proprietary - All rights reserved  
© 2025 BAWABT ALMASKAN Real Estate
