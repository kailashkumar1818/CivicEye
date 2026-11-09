import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/70 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      <Navbar />
      <main className={`flex-grow ${isMapPage ? 'h-[calc(100vh-4rem)] flex flex-col overflow-hidden' : ''}`}>
        <Outlet />
      </main>
      {!isMapPage && <Footer />}
    </div>
  );
}

