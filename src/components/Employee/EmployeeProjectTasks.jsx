import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../Layout/Navbar";

const EmployeeProjectTasks = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);

  useEffect(() => {
    // Fetch project details
    const fetchProject = async () => {
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      if (projectDoc.exists()) {
        setProject({ id: projectDoc.id, ...projectDoc.data() });
      }
    };

    fetchProject();

    // Listen to tasks assigned to this employee in this project
    const q = query(
      collection(db, "tasks"),
      where("projectId", "==", projectId),
      where("assignedTo", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(tasksData);
    });

    return unsubscribe;
  }, [projectId, currentUser]);

  const getStatusColor = (status) => {
    switch (status) {
      case "complete":
        return "bg-green-100 text-green-800 border-green-300";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/employee")}
          className="mb-6 text-dimo-blue hover:text-dimo-dark flex items-center space-x-2"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </button>

        {/* Project Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-dimo-blue">{project?.name}</h1>
          <p className="text-gray-600 mt-2">My Tasks</p>
        </div>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">
              No tasks assigned to you in this project
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/employee/task/${task.id}`)}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {task.name}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Created:</span>
                          <span>
                            {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Target:</span>
                          <span>
                            {new Date(task.targetDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {task.status.replace("-", " ").toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {task.approved && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                        ✓ Approved by Admin
                      </span>
                    </div>
                  )}

                  {task.rejectionReason && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-red-800">
                          Rejection Reason:
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          {task.rejectionReason}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-dimo-blue text-sm font-medium">
                      View Details →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProjectTasks;
