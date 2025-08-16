'use client';
import React, { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { TbLayersSelected } from "react-icons/tb";
import { jwtDecode } from 'jwt-decode';
import io from 'socket.io-client';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
}

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
  comments: Comment[];
}

interface JwtPayload {
  sub: number;
  username?: string;
}

const socket = io('https://nestjs-task-production-09a2.up.railway.app/');

export default function UserProcessTable() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusValue, setStatusValue] = useState<string>('');
  const [viewCommentsTask, setViewCommentsTask] = useState<Task | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const [addCommentTask, setAddCommentTask] = useState<Task | null>(null);
  const [commentContent, setCommentContent] = useState('');

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

      const res = await fetch(`https://nestjs-task-production-09a2.up.railway.app/task/getall`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");

      const data: Task[] = await res.json();

      // Ensure comments is always an array
      const userTasks = data
        .filter(task => task.assignedUser.username === username)
        .map(task => ({ ...task, comments: task.comments || [] }));

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
  }, [viewCommentsTask]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const decoded = jwtDecode<JwtPayload>(token);
    const username = decoded.username;

    socket.on('task.created', (newTask: Task) => {
      if (newTask.assignedUser.username === username) {
        setTasks(prev => [{ ...newTask, comments: newTask.comments || [] }, ...prev]);
      }
    });

    socket.on('task.updated', (updatedTask: Task) => {
      if (updatedTask.assignedUser.username === username) {
        setTasks(prev =>
          prev.map(t => t.id === updatedTask.id
            ? { ...updatedTask, comments: updatedTask.comments || [] }
            : t
          )
        );
      }
    });

    socket.on('task.deleted', (data: { id: number }) => {
      setTasks(prev => prev.filter(task => task.id !== data.id));
    });

    return () => {
      socket.off('task.created');
      socket.off('task.updated');
      socket.off('task.deleted');
    };
  }, []);

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setStatusValue(task.status);
  };

  const handleUpdate = async () => {
    if (!editingTask) return;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No token found");

      const res = await fetch(`https://nestjs-task-production-09a2.up.railway.app/task/updatebyuser/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: statusValue }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update task");
      }

      const updatedTask: Task = await res.json();
      setTasks(prev =>
        prev.map(t => t.id === updatedTask.id
          ? { ...updatedTask, comments: updatedTask.comments || [] }
          : t
        )
      );
      setEditingTask(null);
    } catch (err: any) {
      showSnackbar(err.message || "Something went wrong", 'error');
    }
  };

  const handleAddComment = async () => {
    if (!addCommentTask || !commentContent.trim()) return;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No token found");

      const res = await fetch('https://nestjs-task-production-09a2.up.railway.app/comment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ taskId: addCommentTask.id, content: commentContent }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add comment');
      }

      const newComment: Comment = await res.json();

      setTasks(prev =>
        prev.map(task =>
          task.id === addCommentTask.id
            ? { ...task, comments: [...(task.comments || []), newComment] }
            : task
        )
      );

      showSnackbar('Comment added successfully', 'success');
      setAddCommentTask(null);
      setCommentContent('');
    } catch (err: any) {
      showSnackbar(err.message || 'Something went wrong', 'error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-4">
      <h3 className="text-lg font-bold mb-2">Your Tasks</h3>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">ID</th>
                <th className="border px-2 py-1">Title</th>
                <th className="border px-2 py-1">Description</th>
                <th className="border px-2 py-1">Priority</th>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Deadline</th>
                <th className="border px-2 py-1">Comments</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="border px-2 py-1">{task.id}</td>
                  <td className="border px-2 py-1">{task.title}</td>
                  <td className="border px-2 py-1">{task.description}</td>
                  <td className="border px-2 py-1">{task.priority}</td>
                  <td className="border px-2 py-1">{task.status}</td>
                  <td className="border px-2 py-1">{new Date(task.deadline).toLocaleDateString()}</td>
                  <td className="border px-2 py-1 flex gap-1">
                    <button
                      className="bg-gray-200 px-2 py-1 rounded flex items-center gap-1"
                      onClick={() => setViewCommentsTask(task)}
                    >
                      <TbLayersSelected /> View Comments
                    </button>
                    <button
                      className="bg-green-300 px-2 py-1 rounded"
                      onClick={() => setAddCommentTask(task)}
                    >
                      Add Comment
                    </button>
                  </td>
                  <td className="border px-2 py-1">
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                      onClick={() => handleEditClick(task)}
                    >
                      Edit Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Comments Modal */}
      {viewCommentsTask && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-1/3 max-h-[70vh] overflow-y-auto">
            <h4 className="text-xl font-semibold mb-4">
              Comments for: {viewCommentsTask.title}
            </h4>
            {viewCommentsTask?.comments?.length > 0 ? (
              <ul className="space-y-2">
                {viewCommentsTask.comments.map(comment => (
                  <li key={comment.id} className="flex items-center gap-2 border-b pb-1">
                    <TbLayersSelected className="text-blue-500" /> {comment.content}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No comments available</p>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setViewCommentsTask(null)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-1/3 relative">
            <h4 className="text-xl font-semibold mb-4">Edit Status: {editingTask.title}</h4>
            <div className="space-y-3">
              <select
                name="status"
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value)}
                className="border p-2 w-full"
              >
                <option value="todo">To Do</option>
                <option value="progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="flex justify-end mt-4 gap-3">
              <button onClick={() => setEditingTask(null)} className="bg-gray-300 px-4 py-2 rounded">
                Cancel
              </button>
              <button onClick={handleUpdate} className="bg-green-500 text-white px-4 py-2 rounded">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Comment Modal */}
      {addCommentTask && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-1/3">
            <h4 className="text-xl font-semibold mb-4">Add Comment to: {addCommentTask.title}</h4>
            <textarea
              className="border p-2 w-full"
              rows={4}
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Write your comment..."
            />
            <div className="flex justify-end mt-4 gap-3">
              <button
                onClick={() => setAddCommentTask(null)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Add
              </button>
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
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
