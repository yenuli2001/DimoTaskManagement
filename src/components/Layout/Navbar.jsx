import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { logout, currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-dimo-blue text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">DIMO Task Manager</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              {currentUser?.email} ({userRole})
            </span>
            <button
              onClick={handleLogout}
              className="bg-white text-dimo-blue px-4 py-2 rounded-lg hover:bg-gray-100 transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
