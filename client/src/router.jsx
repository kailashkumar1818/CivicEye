import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

// Public pages
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import PublicMap from './pages/public/PublicMap';
import Track from './pages/public/Track';

// Citizen pages (Protected)
import NewReport from './pages/citizen/NewReport';
import MyReports from './pages/citizen/MyReports';
import ReportDetail from './pages/citizen/ReportDetail';
import Profile from './pages/citizen/Profile';

// Admin pages (Admin Protected)
import Dashboard from './pages/admin/Dashboard';
import ReportsTable from './pages/admin/ReportsTable';
import ReportReview from './pages/admin/ReportReview';
import Analytics from './pages/admin/Analytics';
import Users from './pages/admin/Users';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // Public routes
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'map', element: <PublicMap /> },
      { path: 'track', element: <Track /> },

      // Citizen protected routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'report/new', element: <NewReport /> },
          { path: 'my-reports', element: <MyReports /> },
          { path: 'reports/:id', element: <ReportDetail /> },
          { path: 'profile', element: <Profile /> },
        ],
      },

      // Admin protected routes
      {
        path: 'admin',
        element: <AdminRoute />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'reports', element: <ReportsTable /> },
          { path: 'reports/:id', element: <ReportReview /> },
          { path: 'analytics', element: <Analytics /> },
          { path: 'users', element: <Users /> },
        ],
      },
    ],
  },
]);

export default router;
