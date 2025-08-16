"use client";

import React, { useEffect, useState } from "react";

interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  deadline: string;
}

const TaskDashboardPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch("http://localhost:4000/task/getall");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data: Task[] = await res.json();
      setTasks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="flex items-center bg-white/80 backdrop-blur-md border-l-8 border-blue-500 shadow-lg rounded-xl p-6 w-full max-w-sm m-2 transition transform hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex-1 text-left">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">📝 Tasks</h2>
        <p className="text-gray-500 text-sm">Total number of tasks</p>
      </div>
      <div className="bg-blue-500 text-white font-bold text-2xl w-16 h-16 flex items-center justify-center rounded-full shadow-md">
        {loading ? "..." : error ? "!" : tasks.length}
      </div>
    </div>
  );
};

export default TaskDashboardPage;
