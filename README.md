# 🚗 Traffic Reporter

Traffic accident management and analysis system for impact journalism, developed for DOE Prensa ®.

## 📋 Description

Traffic Reporter is a Progressive Web Application (PWA) designed for collecting, visualizing, and analyzing traffic accident data. It enables journalists and analysts to register accidents, visualize them on interactive maps, generate detailed statistics, and export reports in PDF format.

## ✨ Key Features

### 🔐 Authentication and Role-Based Access Control
- **Google Authentication**: Secure login via Google OAuth
- **User Roles**:
  - **Admin**: Full access (registration, editing, user management)
  - **Visitor**: Read-only access (data visualization and statistics)
- **User Management**: Administrative panel to create and manage users

### 📝 Accident Registration
- Complete form with data validation
- Automatic geolocation and manual map selection
- Multiple image upload with preview
- Severity classification (Fatal, Serious Injuries, Minor Injuries, No Injuries)
- Involved vehicles tracking (Car, Motorcycle, Truck, Van, Bicycle, Pedestrian, Animal)
- Road type classification (Avenue, Street, Boulevard)

### 🗺️ Map Visualization
- Interactive map powered by Leaflet
- Color-coded markers by severity
- Detailed popups for each accident
- Export interactive map to standalone HTML
- Navigation from accident list to map location

### 📊 Statistical Analysis

#### Aggregated Data
- Statistics by severity
- Analysis by vehicle type
- Distribution by road type
- Temporal statistics (hour, day, month, year)
- Advanced filters (date range, vehicle, severity, road type)
- PDF export with bar charts

#### Trends
- Temporal evolution of accidents (line chart)
- Severity trends over time (stacked bar chart)
- Vehicle comparison trends (multi-line chart)
- Interactive visualizations with Chart.js

### 📄 Data Export
- **Statistics PDF**: Complete export with charts
- **Interactive HTML Map**: Standalone map with all markers

### 📱 PWA (Progressive Web App)
- Installable on mobile and desktop device
- Custom installation prompt

## 🛠️ Technologies Used

### Frontend
- **React 18** - UI library
- **TypeScript** - Static typing
- **Vite** - Build tool and dev server

### Maps and Visualization
- **Leaflet** - Interactive maps
- **React-Leaflet** - Leaflet integration for React
- **Chart.js** - Charts and visualizations
- **react-chartjs-2** - Chart.js wrapper for React

### Backend and Database
- **Firebase Authentication** - Google authentication
- **Cloud Firestore** - Real-time NoSQL database
- **Firebase Storage** - Image storage

### Export and Utilities
- **html2pdf.js** - PDF generation
- **SweetAlert2** - Elegant alerts and notifications
- **date-fns** - Date manipulation

### Styling
- **CSS Variables** - Consistent design system
- **BEM Methodology** - CSS class naming convention

## 📦 Installation and Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd TrafficReporter
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication → Google Sign-In
4. Create a Firestore database
5. Set up Storage for images

### 4. Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Build for Production
```bash
npm run build
```

Optimized files will be generated in the `dist/` folder


## 👥 User Management

### Roles and Permissions
- **Admin**: 
  - ✅ Register and edit accidents
  - ✅ Manage users
  - ✅ Access all tabs
  - ✅ Export data

- **Visitor**:
  - ✅ View accident history
  - ✅ View map
  - ✅ View statistics
  - ❌ Cannot register accidents
  - ❌ Cannot manage users

## 🎨 Design Features

- **CSS Variables System**: Consistent colors, spacing, and typography
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **BEM Methodology**: Clear and maintainable class naming
- **Elegant Alerts**: SweetAlert2 for notifications
- **Lightbox**: Full-screen image viewer

## 🔒 Security

- Google OAuth authentication
- Server-side Firestore security rules
- Role validation for every operation
- Only @gmail.com emails allowed
- Image size limit (5MB)

## 📱 PWA Features

- Installable on devices
- Offline functionality (service worker)
- Adaptive icons for iOS and Android
- Custom splash screens
- Smart installation prompt

---

**Developed with ❤️ to improve road safety through data journalism**
