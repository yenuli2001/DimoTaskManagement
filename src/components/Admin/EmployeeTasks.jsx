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

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No tasks assigned yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {task.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Created:{" "}
                          {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
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
                          <span className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            ✓ Approved
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(task.targetDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {task.status === "complete" && !task.approved && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApprove(task.id)}
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(task.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {task.approved && (
                          <button
                            onClick={() => handleDeleteTask(task.id, task.name)}
                            className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
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
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    </div>
  );
};

const CreateTaskModal = ({ projectId, employeeId, employeeName, onClose }) => {
  const [taskData, setTaskData] = useState({
    name: "",
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
      await addDoc(collection(db, "tasks"), {
        name: taskData.name,
        projectId,
        assignedTo: selectedEmployees,
        createdAt: new Date().toISOString(),
        targetDate: taskData.targetDate,
        status: "not-started",
        approved: false,
        rejectionReason: null,
        holdReason: null,
        statusHistory: [
          {
            status: "not-started",
            changedBy: "admin",
            changedAt: new Date().toISOString(),
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
      <div className="bg-white rounded-lg max-w-2xl w-full">
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

          <div className="mb-6">
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
