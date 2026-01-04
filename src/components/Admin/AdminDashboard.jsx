import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../Layout/Navbar";

const AdminDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

    // Listen to projects
    const q = query(collection(db, "projects"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
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
            Manage your projects and tasks efficiently
          </p>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">All Projects</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-dimo-blue text-white px-6 py-3 rounded-lg hover:bg-dimo-dark transition duration-200 flex items-center space-x-2"
          >
            <span className="text-xl">+</span>
            <span>Create New Project</span>
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">
              No projects yet. Create your first project to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/admin/project/${project.id}`)}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 cursor-pointer overflow-hidden"
              >
                <div className="bg-gradient-to-r from-dimo-blue to-dimo-dark p-6">
                  <h3 className="text-xl font-bold text-white">
                    {project.name}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{project.employees?.length || 0} Employees</span>
                    <span className="text-dimo-blue">View Details →</span>
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

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

const CreateProjectModal = ({ onClose }) => {
  const [projectName, setProjectName] = useState("");
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const employeesData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((user) => user.role === "employee");
      setEmployees(employeesData);
    });

    return unsubscribe;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "projects"), {
        name: projectName,
        employees: selectedEmployees,
        createdAt: new Date().toISOString(),
      });
      onClose();
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (employee) => {
    setSelectedEmployees((prev) => {
      const exists = prev.find((e) => e.id === employee.id);
      if (exists) {
        return prev.filter((e) => e.id !== employee.id);
      } else {
        return [
          ...prev,
          { id: employee.id, name: employee.name, email: employee.email },
        ];
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-dimo-blue text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold">Create New Project</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dimo-blue focus:border-transparent outline-none"
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Employees ({selectedEmployees.length} selected)
            </label>
            <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
              {employees.length === 0 ? (
                <p className="p-4 text-gray-500 text-center">
                  No employees available
                </p>
              ) : (
                employees.map((employee) => (
                  <div
                    key={employee.id}
                    onClick={() => toggleEmployee(employee)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-200 last:border-b-0 transition ${
                      selectedEmployees.find((e) => e.id === employee.id)
                        ? "bg-blue-50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">
                          {employee.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {employee.email}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedEmployees.find((e) => e.id === employee.id)
                            ? "bg-dimo-blue border-dimo-blue"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedEmployees.find(
                          (e) => e.id === employee.id
                        ) && <span className="text-white text-xs">✓</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading || !projectName || selectedEmployees.length === 0
              }
              className="px-6 py-3 bg-dimo-blue text-white rounded-lg hover:bg-dimo-dark transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
