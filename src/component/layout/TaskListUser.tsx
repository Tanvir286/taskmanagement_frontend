'use client';
import React, { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import io from 'socket.io-client';

interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  deadline: string;
  assignedUser: {
    id: number;
    username: string;
  };
}

interface JwtPayload {
  sub: number;
  username?: string;
}

// Socket.io client
const socket = io('http://localhost:4000');

export default function TaskUserList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusValue, setStatusValue] = useState<string>('');

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No token found");

      const decoded = jwtDecode<JwtPayload>(token);
      const username = decoded.username;

      const res = await fetch(`http://localhost:4000/task/getall`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");

      const data: Task[] = await res.json();
      const userTasks = data.filter(task => task.assignedUser.username === username);
      setTasks(userTasks);
    } catch (err: any) {
      setError(err.message);
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // ================= Socket.IO =================
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const decoded = jwtDecode<JwtPayload>(token);
    const userId = decoded.sub;
    const username = decoded.username;

    // Listen to task created
    socket.on('task.created', (newTask: Task) => {
      if (newTask.assignedUser.username === username) {
        setTasks(prev => [newTask, ...prev]);
        showSnackbar(`New task assigned: ${newTask.title}`, 'success');
      }
    });

    // Listen to task updated
    socket.on('task.updated', (updatedTask: Task) => {
      if (updatedTask.assignedUser.username === username) {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        showSnackbar(`Task updated: ${updatedTask.title}`, 'success');
      }
    });

    // Listen to task deleted
     socket.on('task.deleted', (data: { id: number }) => {
      setTasks(prev => prev.filter(task => task.id !== data.id));
      showSnackbar(`Task deleted (ID: ${data.id})`, 'error');
    });

    return () => {
      socket.off('task.created');
      socket.off('task.updated');
      socket.off('task.deleted');
    };
  }, []);

  const getTimeLeft = (deadline: string) => {
    const now = new Date().getTime();
    const end = new Date(deadline).getTime();
    const diff = end - now;
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setStatusValue(task.status);
  };

  const handleUpdate = async () => {
    if (!editingTask) return;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No token found");

      const res = await fetch(`http://localhost:4000/task/updatebyuser/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: statusValue }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update task");
      }

      const updatedTask: Task = await res.json();
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      
      setEditingTask(null);
    } catch (err: any) {
      showSnackbar(err.message || "Something went wrong", 'error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-4">
      <h3 className="text-lg font-bold mb-2">Your Tasks</h3>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">ID</th>
              <th className="border px-2 py-1">Title</th>
              <th className="border px-2 py-1">Priority</th>
              <th className="border px-2 py-1">Status</th>
              <th className="border px-2 py-1">Deadline</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr className="hover:bg-gray-50" key={task.id}>
                <td className="border px-2 py-1">{task.id}</td>
                <td className="border px-2 py-1">{task.title}</td>
                <td className="border px-2 py-1">{task.priority}</td>
                <td className="border px-2 py-1">{task.status}</td>
                <td className="border px-2 py-1">{new Date(task.deadline).toLocaleDateString()} ({getTimeLeft(task.deadline)})</td>
                <td className="border px-2 py-1">
                  <button className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => handleEditClick(task)}>Edit Status</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-1/3 relative">
            <h4 className="text-xl font-semibold mb-4">Edit Status: {editingTask.title}</h4>
            <div className="space-y-3">
              <select name="status" value={statusValue} onChange={(e) => setStatusValue(e.target.value)} className="border p-2 w-full">
                <option value="todo">To Do</option>
                <option value="progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="flex justify-end mt-4 gap-3">
              <button onClick={() => setEditingTask(null)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
              <button onClick={handleUpdate} className="bg-green-500 text-white px-4 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
