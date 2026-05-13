import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import Header from "./Header.jsx";
import Sidebar from "./Sidebar.jsx";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Render the protected component inside global layout with header, sidebar and main content
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {/* Header spans full width at top */}
      <Header />

      {/* Sidebar and main content below header */}
      <div
        className="flex flex-1 w-full min-h-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(135,206,235,0.95), rgba(173,216,230,0.9))",
        }}
      >
        <Sidebar />
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );
};

export default ProtectedRoute;
