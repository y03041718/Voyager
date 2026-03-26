/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Explore from './pages/Explore';
import Itinerary from './pages/Itinerary';
import MyGuides from './pages/MyGuides';
import TripPlanner from './pages/TripPlanner';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { SelectionProvider } from './SelectionContext';
import { AuthProvider, useAuth } from './AuthContext';
import { TeamProvider } from './TeamContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-surface">
      {isAuthenticated && <Navbar />}
      <main className={isAuthenticated ? "pb-20 md:pb-0 md:pt-16" : ""}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Explore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/itinerary"
            element={
              <ProtectedRoute>
                <Itinerary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/itinerary/:id"
            element={
              <ProtectedRoute>
                <Itinerary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guides"
            element={
              <ProtectedRoute>
                <MyGuides />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plan"
            element={
              <ProtectedRoute>
                <TripPlanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TeamProvider>
        <SelectionProvider>
          <Router>
            <AppContent />
          </Router>
        </SelectionProvider>
      </TeamProvider>
    </AuthProvider>
  );
}
