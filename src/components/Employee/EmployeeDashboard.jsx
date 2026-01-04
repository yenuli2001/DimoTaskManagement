import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../Layout/Navbar";

const EmployeeDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [userName, setUserName] = useState("");
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Get user name
    const getUserName = async () => {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        setUserName(userDoc.data().name);
      }
    };
    getUserName();

    // Listen to all projects
    const q = query(collection(db, "projects"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((project) =>
          project.employees?.some((emp) => emp.id === currentUser.uid)
        );
      setProjects(projectsData);
    });

    return unsubscribe;
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-dimo-blue">
            Welcome back, {userName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here are the projects you're working on
          </p>
        </div>

        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">My Projects</h2>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">
              You are not assigned to any projects yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/employee/project/${project.id}`)}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 cursor-pointer overflow-hidden"
              >
                <div className="bg-gradient-to-r from-dimo-blue to-dimo-dark p-6">
                  <h3 className="text-xl font-bold text-white">
                    {project.name}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{project.employees?.length || 0} Team Members</span>
                    <span className="text-dimo-blue">View Tasks →</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
