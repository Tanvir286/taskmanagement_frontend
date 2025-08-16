'use client';
import React, { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import socket from '@/lib/socket'; // Make sure this is your configured Socket.IO client instance

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

interface User {
  id: number;
  username: string;
}

export default function AdminProcessTable() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<any>({});

  // Snackbar state
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
      const res = await fetch('http://localhost:4000/task/getall', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:4000/auth/getall', {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Failed to fetch users: ${res.status} ${res.statusText}`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  // Socket.io listeners for real-time updates
  useEffect(() => {

    socket.on('task.created', (newTask: Task) => {
    setTasks(prev => {
      if (prev.some(task => task.id === newTask.id)) return prev; 
      return [newTask, ...prev];
     });
    });

    socket.on('task.updated', (updatedTask: Task) => {
      setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
      showSnackbar(`Task updated: ${updatedTask.title}`, 'success');
    });

    socket.on('task.deleted', (data: { id: number }) => {
      setTasks(prev => prev.filter(task => task.id !== data.id));
      showSnackbar(`Task deleted (ID: ${data.id})`, 'error');
    });

    socket.on('task.updatedbyuser', (updatedTask) => {
      setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
    });


    return () => {
      socket.off('taskCreated');
      socket.off('taskUpdated');
      socket.off('taskDeleted');
    };
  }, []);

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      deadline: task.deadline.split('T')[0],
      user: task.assignedUser.username,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      if (!editingTask) return;
      const res = await fetch(`http://localhost:4000/task/update/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to update task');
      setEditingTask(null);
    } catch (err: any) {
      showSnackbar(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTask) return;
    try {
      const res = await fetch(`http://localhost:4000/task/delete/${deleteTask.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (!res.ok) throw new Error('Failed to delete task');
      setDeleteTask(null);
    } catch (err: any) {
      showSnackbar(err.message, 'error');
    }
  };

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

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-4">
      <h3 className="text-lg font-bold mb-2">Task List</h3>

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
              <th className="border px-2 py-1">Assigned User</th>
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
                <td className="border px-2 py-1">{task.assignedUser.username}</td>
                <td className="border px-2 py-1">
                  {new Date(task.deadline).toLocaleDateString()} ({getTimeLeft(task.deadline)})
                </td>
                <td className="border px-2 py-1 flex gap-2">
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                    onClick={() => handleEditClick(task)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => setDeleteTask(task)}
                  >
                    Delete
                  </button>
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
            <h4 className="text-xl font-semibold mb-4">
              Edit Task: {editingTask.title}
            </h4>
            <div className="space-y-3">
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Title" className="border p-2 w-full" />
              <input type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" className="border p-2 w-full" />
              <select name="priority" value={formData.priority} onChange={handleInputChange} className="border p-2 w-full">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <select name="status" value={formData.status} onChange={handleInputChange} className="border p-2 w-full">
                <option value="todo">To Do</option>
                <option value="progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select name="user" value={formData.user} onChange={handleInputChange} className="border p-2 w-full">
                {users.map(u => (
                  <option key={u.id} value={u.username}>{u.username}</option>
                ))}
              </select>
              <input type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} className="border p-2 w-full" />
            </div>
            <div className="flex justify-end mt-4 gap-3">
              <button onClick={() => setEditingTask(null)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
              <button onClick={handleUpdate} className="bg-green-500 text-white px-4 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTask && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-1/3 relative">
            <h4 className="text-xl font-semibold mb-4">Confirm Delete</h4>
            <p>Are you sure you want to delete task "{deleteTask.title}"?</p>
            <div className="flex justify-end mt-4 gap-3">
              <button onClick={() => setDeleteTask(null)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
              <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
