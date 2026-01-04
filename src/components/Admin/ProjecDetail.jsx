import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import Navbar from "../Layout/Navbar";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projectDoc = await getDoc(doc(db, "projects", projectId));
        if (projectDoc.exists()) {
          setProject({ id: projectDoc.id, ...projectDoc.data() });
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-gray-600">Project not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/admin")}
          className="mb-6 text-dimo-blue hover:text-dimo-dark flex items-center space-x-2"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </button>

        {/* Project Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-dimo-blue">{project.name}</h1>
          <p className="text-gray-600 mt-2">
            Created on {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Employees Section */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Team Members</h2>

        {project.employees?.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">
              No employees assigned to this project
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {project.employees?.map((employee) => (
              <div
                key={employee.id}
                onClick={() =>
                  navigate(
                    `/admin/project/${projectId}/employee/${employee.id}`
                  )
                }
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 cursor-pointer p-6"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-dimo-blue to-dimo-dark rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {employee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {employee.name}
                    </h3>
                    <p className="text-sm text-gray-500">{employee.email}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="text-dimo-blue text-sm font-medium">
                    View Tasks →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
