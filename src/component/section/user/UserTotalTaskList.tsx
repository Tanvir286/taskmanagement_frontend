"use client";

import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import socket from "@/lib/socket"; 

interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  deadline: string;
  assignedUser?: { id: number; username: string }; 
}

interface JwtPayload {
  sub: string; 
  username: string;
  role: string;
  exp: number;
  iat?: number;
}

const UserTotalTaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No token found");

      const decoded = jwtDecode<JwtPayload>(token);
      const userId = decoded.sub;

      const res = await fetch(`http://localhost:4000/task/getuser/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`, 
        },
      });

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

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const decoded = jwtDecode<JwtPayload>(token);
    const userId = decoded.sub;

    socket.on("task.created", (newTask: Task) => {
      if (newTask.assignedUser?.id == Number(userId)) {
        setTasks((prev) => {
          if (prev.some((task) => task.id === newTask.id)) return prev;
          return [newTask, ...prev];
        });
      }
    });

    socket.on("task.deleted", (data: { id: number }) => {
      setTasks((prev) => prev.filter((task) => task.id !== data.id));
    });

    return () => {
      socket.off("task.created");
      socket.off("task.deleted");
    };
  }, []);

  return (
    <div className="flex items-center bg-white/80 backdrop-blur-md border-l-8 border-green-500 shadow-lg rounded-xl p-6 w-full max-w-sm m-2 transition transform hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex-1 text-left">
        <h2 className="text-xl font-semibold text-green-700 mb-2">📝 My Tasks</h2>
        <p className="text-gray-500 text-sm">Total number of my tasks</p>
      </div>
      <div className="bg-green-500 text-white font-bold text-2xl w-16 h-16 flex items-center justify-center rounded-full shadow-md">
        {loading ? "..." : error ? "!" : tasks.length}
      </div>
    </div>
  );
};

export default UserTotalTaskList;
