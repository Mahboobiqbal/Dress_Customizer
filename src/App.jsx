import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Landing from "./pages/Landing.jsx";
import Studio from "./pages/Studio.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Settings from "./pages/Settings.jsx";
import RecentChats from "./pages/RecentChats.jsx";
import Designs from "./pages/Designs.jsx";
import DesignDetail from "./pages/DesignDetail.jsx";
import Profile from "./pages/Profile.jsx";
import ToastProvider from "./components/ToastProvider.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/studio"
          element={
            <ProtectedRoute>
              <Studio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/:convId"
          element={
            <ProtectedRoute>
              <Studio />
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
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recent-chats"
          element={
            <ProtectedRoute>
              <RecentChats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designs"
          element={
            <ProtectedRoute>
              <Designs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/designs/:id"
          element={
            <ProtectedRoute>
              <DesignDetail />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
