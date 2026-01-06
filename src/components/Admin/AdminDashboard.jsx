import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../Layout/Navbar";

const AdminDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [userName, setUserName] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [activeView, setActiveView] = useState("projects"); // "projects" or "employees"
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);

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
    const projectsQuery = query(collection(db, "projects"));
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectsData);
    });

    // Listen to employees
    const employeesQuery = query(
      collection(db, "users"),
      where("role", "==", "employee")
    );
    const unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
      const employeesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEmployees(employeesData);
    });

    // Listen to all tasks
    const tasksQuery = query(collection(db, "tasks"));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllTasks(tasksData);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeEmployees();
      unsubscribeTasks();
    };
  }, [currentUser]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate task summary for an employee
  const getEmployeeTaskSummary = (employeeId) => {
    const employeeTasks = allTasks.filter((task) =>
      task.assignedTo?.includes(employeeId)
    );

    return {
      total: employeeTasks.length,
      notStarted: employeeTasks.filter((t) => t.status === "not-started").length,
      inProgress: employeeTasks.filter((t) => t.status === "in-progress").length,
      completed: employeeTasks.filter((t) => t.status === "complete" && t.approved).length,
      hold: employeeTasks.filter((t) => t.status === "hold").length,
      pending: employeeTasks.filter((t) => t.status === "complete" && !t.approved).length,
    };
  };

  const handleMenuToggle = (e, projectId) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === projectId ? null : projectId);
  };

  const handleEditProject = (e, project) => {
    e.stopPropagation();
    setEditingProject(project);
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleDeleteProject = async (e, projectId, projectName) => {
    e.stopPropagation();
    setOpenMenuId(null);

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${projectName}"? This action cannot be undone.`
    );

    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "projects", projectId));
      } catch (error) {
        console.error("Error deleting project:", error);
        alert("Failed to delete project");
      }
    }
  };

  const handleEmployeeClick = (employeeId) => {
    navigate(`/admin/employee/${employeeId}/tasks`);
  };

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

        {/* Desktop View Toggle Buttons */}
        <div className="hidden md:flex justify-center mb-6 space-x-4">
          <button
            onClick={() => setActiveView("projects")}
            className={`px-6 py-3 rounded-lg font-medium transition duration-200 ${
              activeView === "projects"
                ? "bg-dimo-blue text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            All Projects
          </button>
          <button
            onClick={() => setActiveView("employees")}
            className={`px-6 py-3 rounded-lg font-medium transition duration-200 ${
              activeView === "employees"
                ? "bg-dimo-blue text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            All Employees
          </button>
        </div>

        {/* Mobile Swipe Indicator */}
        <div className="md:hidden mb-4 text-center">
          <p className="text-sm text-gray-500">
            Swipe left or right to switch views
          </p>
        </div>

        {/* Mobile Swipeable Container */}
        <div className="md:hidden overflow-x-auto snap-x snap-mandatory flex space-x-4 pb-4 scrollbar-hide">
          <div className="snap-center shrink-0 w-full">
            <ProjectsView
              projects={projects}
              navigate={navigate}
              handleMenuToggle={handleMenuToggle}
              handleEditProject={handleEditProject}
              handleDeleteProject={handleDeleteProject}
              openMenuId={openMenuId}
              menuRef={menuRef}
              setShowCreateModal={setShowCreateModal}
            />
          </div>
          <div className="snap-center shrink-0 w-full">
            <EmployeesView
              employees={employees}
              getEmployeeTaskSummary={getEmployeeTaskSummary}
              handleEmployeeClick={handleEmployeeClick}
            />
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          {activeView === "projects" ? (
            <ProjectsView
              projects={projects}
              navigate={navigate}
              handleMenuToggle={handleMenuToggle}
              handleEditProject={handleEditProject}
              handleDeleteProject={handleDeleteProject}
              openMenuId={openMenuId}
              menuRef={menuRef}
              setShowCreateModal={setShowCreateModal}
            />
          ) : (
            <EmployeesView
              employees={employees}
              getEmployeeTaskSummary={getEmployeeTaskSummary}
              handleEmployeeClick={handleEmployeeClick}
            />
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Edit Project Modal */}
      {showEditModal && editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => {
            setShowEditModal(false);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
};

// Projects View Component
const ProjectsView = ({
  projects,
  navigate,
  handleMenuToggle,
  handleEditProject,
  handleDeleteProject,
  openMenuId,
  menuRef,
  setShowCreateModal,
}) => {
  return (
    <>
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
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 cursor-pointer overflow-hidden relative"
            >
              {/* Three Dot Menu */}
              <div
                className="absolute top-2 right-2 z-10"
                ref={openMenuId === project.id ? menuRef : null}
              >
                <button
                  onClick={(e) => handleMenuToggle(e, project.id)}
                  className="bg-white text-gray-600 p-2 rounded-full hover:bg-gray-100 transition duration-200 shadow-md"
                  title="Options"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {openMenuId === project.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                    <button
                      onClick={(e) => handleEditProject(e, project)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      <span>Edit Project</span>
                    </button>
                    <button
                      onClick={(e) =>
                        handleDeleteProject(e, project.id, project.name)
                      }
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span>Delete Project</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-dimo-blue to-dimo-dark p-6">
                <h3 className="text-xl font-bold text-white pr-8">
                  {project.name}
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{project.employees?.length || 0} Employees</span>
                  <span className="text-dimo-blue font-medium">
                    View Details →
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-4">
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

// Employees View Component
const EmployeesView = ({
  employees,
  getEmployeeTaskSummary,
  handleEmployeeClick,
}) => {
  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">All Employees</h2>
        <p className="text-gray-600 mt-2">
          View task summaries for each employee
        </p>
      </div>

      {/* Employees Grid */}
      {employees.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No employees found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => {
            const summary = getEmployeeTaskSummary(employee.id);
            return (
              <div
                key={employee.id}
                onClick={() => handleEmployeeClick(employee.id)}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 cursor-pointer overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-dimo-blue to-dimo-dark p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-dimo-blue">
                        {employee.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {employee.name}
                      </h3>
                      <p className="text-sm text-blue-100">{employee.email}</p>
                    </div>
                  </div>
                </div>

                {/* Card Body - Task Summary */}
                <div className="p-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">
                    Task Summary
                  </h4>

                  <div className="space-y-3">
                    {/* Total Tasks */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Tasks:</span>
                      <span className="text-lg font-bold text-gray-900">
                        {summary.total}
                      </span>
                    </div>

                    {/* Not Started */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span className="text-sm text-gray-600">Not Started:</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {summary.notStarted}
                      </span>
                    </div>

                    {/* In Progress */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                        <span className="text-sm text-gray-600">In Progress:</span>
                      </div>
                      <span className="text-sm font-semibold text-blue-700">
                        {summary.inProgress}
                      </span>
                    </div>

                    {/* Completed */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        <span className="text-sm text-gray-600">Completed:</span>
                      </div>
                      <span className="text-sm font-semibold text-green-700">
                        {summary.completed}
                      </span>
                    </div>

                    {/* Pending Approval */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                        <span className="text-sm text-gray-600">Pending Approval:</span>
                      </div>
                      <span className="text-sm font-semibold text-orange-700">
                        {summary.pending}
                      </span>
                    </div>

                    {/* On Hold */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <span className="text-sm text-gray-600">On Hold:</span>
                      </div>
                      <span className="text-sm font-semibold text-yellow-700">
                        {summary.hold}
                      </span>
                    </div>
                  </div>

                  {/* View Details Link */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <span className="text-dimo-blue text-sm font-medium">
                      View All Tasks →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

const EditProjectModal = ({ project, onClose }) => {
  const [projectName, setProjectName] = useState(project.name);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateDoc(doc(db, "projects", project.id), {
        name: projectName,
      });
      onClose();
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="bg-dimo-blue text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold">Edit Project</h2>
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
              disabled={loading || !projectName}
              className="px-6 py-3 bg-dimo-blue text-white rounded-lg hover:bg-dimo-dark transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Project"}
            </button>
          </div>
        </form>
      </div>
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