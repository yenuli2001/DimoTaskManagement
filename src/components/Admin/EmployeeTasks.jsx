import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import Navbar from "../Layout/Navbar";

const EmployeeTasks = () => {
  const { projectId, employeeId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    // Fetch project details
    const fetchProject = async () => {
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      if (projectDoc.exists()) {
        setProject({ id: projectDoc.id, ...projectDoc.data() });
      }
    };

    // Fetch employee details
    const fetchEmployee = async () => {
      const employeeDoc = await getDoc(doc(db, "users", employeeId));
      if (employeeDoc.exists()) {
        setEmployee({ id: employeeDoc.id, ...employeeDoc.data() });
      }
    };

    fetchProject();
    fetchEmployee();

    // Listen to tasks for this employee in this project
    const q = query(
      collection(db, "tasks"),
      where("projectId", "==", projectId),
      where("assignedTo", "array-contains", employeeId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(tasksData);
    });

    return unsubscribe;
  }, [projectId, employeeId]);

  const handleApprove = async (taskId) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        approved: true,
        rejectionReason: null,
        statusHistory: arrayUnion({
          status: "approved",
          changedBy: "admin",
          changedAt: new Date().toISOString(),
          note: "Task approved by admin",
        }),
      });
    } catch (error) {
      console.error("Error approving task:", error);
    }
  };

  const handleReject = async (taskId) => {
    const reason = prompt("Please enter rejection reason:");
    if (reason) {
      try {
        await updateDoc(doc(db, "tasks", taskId), {
          status: "not-started",
          approved: false,
          rejectionReason: reason,
          statusHistory: arrayUnion({
            status: "rejected",
            changedBy: "admin",
            changedAt: new Date().toISOString(),
            note: `Rejected: ${reason}`,
          }),
        });
      } catch (error) {
        console.error("Error rejecting task:", error);
      }
    }
  };

  const handleDeleteTask = async (taskId, taskName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the task "${taskName}"? This action cannot be undone.`
    );

    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "tasks", taskId));
      } catch (error) {
        console.error("Error deleting task:", error);
        alert("Failed to delete task");
      }
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/admin/project/${projectId}`)}
          className="mb-6 text-dimo-blue hover:text-dimo-dark flex items-center space-x-2"
        >
          <span>←</span>
          <span>Back to Project</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold text-dimo-blue">{project?.name}</h1>
          <p className="text-lg text-gray-700 mt-2">
            Tasks for: <span className="font-semibold">{employee?.name}</span>
          </p>
        </div>

        {/* Create Task Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-dimo-blue text-white px-6 py-3 rounded-lg hover:bg-dimo-dark transition duration-200 flex items-center space-x-2"
          >
            <span className="text-xl">+</span>
            <span>Add New Task</span>
          </button>
        </div>

        {/* Tasks Cards */}
        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No tasks assigned yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-dimo-blue to-dimo-dark p-4">
                  <h3 className="text-lg font-bold text-white truncate">
                    {task.name}
                  </h3>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Created Date */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Created:
                    </span>
                    <span className="text-sm text-gray-900">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Status:
                    </span>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${
                            task.status === "complete"
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                          ${
                            task.status === "in-progress"
                              ? "bg-blue-100 text-blue-800"
                              : ""
                          }
                          ${
                            task.status === "not-started"
                              ? "bg-gray-100 text-gray-800"
                              : ""
                          }
                          ${
                            task.status === "hold"
                              ? "bg-yellow-100 text-yellow-800"
                              : ""
                          }
                        `}
                      >
                        {task.status.replace("-", " ").toUpperCase()}
                      </span>
                      {task.approved && (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hold Reason - Only if task is on hold */}
                  {task.status === "hold" && task.holdReason && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-yellow-800 mb-1">
                        Reason for Hold:
                      </p>
                      <p className="text-sm text-yellow-700 italic">
                        {task.holdReason}
                      </p>
                    </div>
                  )}

                  {/* Target Date */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Target Date:
                    </span>
                    <span className="text-sm text-gray-900">
                      {new Date(task.targetDate).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 pt-3">
                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Edit Button - Always visible */}
                      <button
                        onClick={() => handleEditTask(task)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded hover:bg-blue-50 transition text-sm"
                        title="Edit task"
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
                        <span>Edit</span>
                      </button>

                      {/* Approve/Reject buttons for complete tasks */}
                      {task.status === "complete" && !task.approved && (
                        <>
                          <button
                            onClick={() => handleApprove(task.id)}
                            className="flex-1 bg-green-500 text-white px-3 py-1.5 rounded hover:bg-green-600 transition text-sm font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(task.id)}
                            className="flex-1 bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 transition text-sm font-medium"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* Delete button for approved tasks */}
                      {task.approved && (
                        <button
                          onClick={() => handleDeleteTask(task.id, task.name)}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-800 px-3 py-1.5 rounded hover:bg-red-50 transition text-sm"
                          title="Delete task"
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
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          projectId={projectId}
          employeeId={employeeId}
          employeeName={employee?.name}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <EditTaskModal
          task={editingTask}
          projectId={projectId}
          onClose={() => {
            setShowEditModal(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};

const EditTaskModal = ({ task, projectId, onClose }) => {
  // Format date from ISO string to YYYY-MM-DD
  const formatDateForInput = (isoString) => {
    return new Date(isoString).toISOString().split('T')[0];
  };

  const [taskData, setTaskData] = useState({
    name: task.name,
    createdDate: formatDateForInput(task.createdAt),
    targetDate: task.targetDate,
  });
  const [loading, setLoading] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState(task.assignedTo || []);

  useEffect(() => {
    // Fetch project to get all employees
    const fetchProject = async () => {
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        setAllEmployees(projectData.employees || []);
      }
    };
    fetchProject();
  }, [projectId]);

  const toggleEmployee = (empId) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(empId)) {
        return prev.filter((id) => id !== empId);
      } else {
        return [...prev, empId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedEmployees.length === 0) {
      alert("Please select at least one employee");
      return;
    }

    setLoading(true);

    try {
      // Convert the selected creation date to ISO string format
      const createdAtISO = new Date(taskData.createdDate).toISOString();

      await updateDoc(doc(db, "tasks", task.id), {
        name: taskData.name,
        createdAt: createdAtISO,
        targetDate: taskData.targetDate,
        assignedTo: selectedEmployees,
        statusHistory: arrayUnion({
          status: "edited",
          changedBy: "admin",
          changedAt: new Date().toISOString(),
          note: "Task details updated by admin",
        }),
      });
      onClose();
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-dimo-blue text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold">Edit Task</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Name
            </label>
            <input
              type="text"
              value={taskData.name}
              onChange={(e) =>
                setTaskData({ ...taskData, name: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dimo-blue focus:border-transparent outline-none"
              placeholder="Enter task name"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Employees
            </label>
            <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
              {allEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => toggleEmployee(emp.id)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-200 last:border-b-0 ${
                    selectedEmployees.includes(emp.id) ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{emp.name}</span>
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedEmployees.includes(emp.id)
                          ? "bg-dimo-blue border-dimo-blue"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedEmployees.includes(emp.id) && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedEmployees.length} employee(s) selected
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Creation Date
              </label>
              <input
                type="date"
                value={taskData.createdDate}
                onChange={(e) =>
                  setTaskData({ ...taskData, createdDate: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dimo-blue focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Date
              </label>
              <input
                type="date"
                value={taskData.targetDate}
                onChange={(e) =>
                  setTaskData({ ...taskData, targetDate: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dimo-blue focus:border-transparent outline-none"
                required
              />
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
              disabled={loading || selectedEmployees.length === 0}
              className="px-6 py-3 bg-dimo-blue text-white rounded-lg hover:bg-dimo-dark transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateTaskModal = ({ projectId, employeeId, employeeName, onClose }) => {
  // Get today's date in YYYY-MM-DD format for default values
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [taskData, setTaskData] = useState({
    name: "",
    createdDate: getTodayDate(),
    targetDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([employeeId]);

  useEffect(() => {
    // Fetch project to get all employees
    const fetchProject = async () => {
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        setAllEmployees(projectData.employees || []);
      }
    };
    fetchProject();
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert the selected date to ISO string format
      const createdAtISO = new Date(taskData.createdDate).toISOString();

      await addDoc(collection(db, "tasks"), {
        name: taskData.name,
        projectId,
        assignedTo: selectedEmployees,
        createdAt: createdAtISO,
        targetDate: taskData.targetDate,
        status: "not-started",
        approved: false,
        rejectionReason: null,
        holdReason: null,
        statusHistory: [
          {
            status: "not-started",
            changedBy: "admin",
            changedAt: createdAtISO,
            note: "Task created",
          },
        ],
      });
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (empId) => {
    setSelectedEmployees((prev) => {
      if (prev.includes(empId)) {
        return prev.filter((id) => id !== empId);
      } else {
        return [...prev, empId];
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-dimo-blue text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold">Create New Task</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Name
            </label>
            <input
              type="text"
              value={taskData.name}
              onChange={(e) =>
                setTaskData({ ...taskData, name: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dimo-blue focus:border-transparent outline-none"
              placeholder="Enter task name"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Employees
            </label>
            <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
              {allEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => toggleEmployee(emp.id)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-200 last:border-b-0 ${
                    selectedEmployees.includes(emp.id) ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{emp.name}</span>
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedEmployees.includes(emp.id)
                          ? "bg-dimo-blue border-dimo-blue"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedEmployees.includes(emp.id) && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Creation Date
              </label>
              <input
                type="date"
                value={taskData.createdDate}
                onChange={(e) =>
                  setTaskData({ ...taskData, createdDate: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dimo-blue focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Date
              </label>
              <input
                type="date"
                value={taskData.targetDate}
                onChange={(e) =>
                  setTaskData({ ...taskData, targetDate: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dimo-blue focus:border-transparent outline-none"
                required
              />
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
              disabled={loading || selectedEmployees.length === 0}
              className="px-6 py-3 bg-dimo-blue text-white rounded-lg hover:bg-dimo-dark transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeTasks;