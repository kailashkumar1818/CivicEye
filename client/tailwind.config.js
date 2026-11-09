/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        category: {
          pothole: '#f97316',        // orange-500
          garbage: '#22c55e',        // green-500
          broken_streetlight: '#eab308', // yellow-500
          damaged_road: '#ef4444',   // red-500
          other: '#6b7280',          // gray-500
        },
        status: {
          submitted: '#64748b',      // slate-500
          under_review: '#3b82f6',   // blue-500
          assigned: '#6366f1',       // indigo-500
          in_progress: '#f59e0b',    // amber-500
          resolved: '#10b981',       // emerald-500
          rejected: '#f43f5e',       // rose-500
        },
      },
    },
  },
  plugins: [],
};

