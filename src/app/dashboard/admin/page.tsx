"use client";

import React, { useEffect, useState } from "react";
import CreateTaskForm from "../../../component/layout/CreateTaskForm";
import { FaBell } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import {jwtDecode } from "jwt-decode";
import { Button, Snackbar, Alert } from "@mui/material";
import UserCount from "../../../component/layout/UserCount";
import UserList from "../../../component/layout/UserList";
import socket from "@/lib/socket";
import AdminTotalTaskList from "@/component/section/admin/AdminTotalTaskList";
import AdminProcessTable from "@/component/section/admin/AdminProcessTable";

interface JwtPayload {
  username: string;
  email: string;
  sub: string;
  role: string;
  exp: number;
  iat?: number;
}

const AdminDashboard = () => {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<"tasks" | "users" | null>(null);

  // Notification state
  const [notifications, setNotifications] = useState<{ message: string; time: string }[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

useEffect(() => {
  // Join a common board/room
  socket.emit("join-board", "all-boards");

  // Task Created
  socket.on("task.created", (task) => {
    console.log(" Task created event received:", task);
    const message = `New task: ${task.title} (Assigned to ${task.assignedUser?.username || "N/A"})`;
    setNotifications((prev) => [{ message, time: new Date().toLocaleTimeString() }, ...prev]);
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  });

  // Task Updated
  socket.on("task.updated", (task) => {
    console.log("Task updated event received:", task);
    const message = `Task "${task.title}" (ID: ${task.id}) has been updated by an admin.`;
    setNotifications((prev) => [{ message, time: new Date().toLocaleTimeString() }, ...prev]);
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  });

  // Task Deleted
  socket.on("task.deleted", ({ id }) => {
    console.log("Task deleted event received:", id);
    const message = `Task with ID ${id} has been deleted by an admin.`;
    setNotifications((prev) => [{ message, time: new Date().toLocaleTimeString() }, ...prev]);
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  });


   // Task Update by User
   socket.on("task.updatedbyuser", (task) => {
      const message = `Task "${task.title}" (ID: ${task.id}) has been updated by ${task.updatedBy?.username || "N/A"}.`;
      setNotifications((prev) => [
        { message, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    });


  // Cleanup
  return () => {
    socket.off("task.created");
    socket.off("task.updated");
    socket.off("task.deleted");
  };
}, []);


  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        setUser({ username: decoded.username, role: decoded.role });
      } catch (error) {
        console.error("Invalid token", error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/auth/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 shadow-lg text-white relative">
        <div className="flex items-center space-x-3">
          <img src="/images/logo.png" alt="TaskFlow Logo" className="w-30 h-14 rounded" />
        </div>

        <div className="flex items-center space-x-6 relative">
          {/* Notification Bell */}
          <div
            className="relative cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <FaBell className="text-xl hover:scale-110 transition" />
            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-xs px-2 py-0.5 rounded-full">
                {notifications.length}
              </span>
            )}
          </div>

          {/* Notification Dropdown */}
          {dropdownOpen && (
            <div className="absolute top-12 right-0 w-80 bg-white shadow-lg rounded-lg overflow-hidden z-50">
              <div className="bg-gray-100 px-4 py-2 font-semibold border-b">
                Notifications
              </div>
              <div className="max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 p-4 text-sm">No notifications</p>
                ) : (
                  notifications.map((n, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 border-b hover:bg-green-50 transition"
                    >
                      <p className="text-sm text-green-800 font-medium">{n.message}</p>
                      <span className="text-xs text-green-600">{n.time}</span>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div
                  className="text-center text-red-500 py-2 text-sm cursor-pointer hover:bg-gray-100"
                  onClick={() => setNotifications([])}
                >
                  Clear All
                </div>
              )}
            </div>
          )}

          {/* User Role */}
          <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full shadow">
            {user?.role || "Administrator"}
          </span>

          {/* User Avatar & Logout */}
          <div className="flex items-center space-x-2 cursor-pointer hover:bg-white/10 px-2 py-1 rounded-lg transition">
            <img src="/images/admin.jpg" alt="Admin" className="w-10 h-10 rounded-full border-2 border-white" />
            <span className="font-medium">{user?.username || "John Admin"}</span>
            <Button
              onClick={handleLogout}
              variant="contained"
              color="error"
              size="small"
              sx={{ ml: 2 }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Page title */}
      <div className="px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Admin Control Center</h2>
          <p className="text-gray-500">System overview and user management</p>
        </div>
        <Button
          variant="contained"
          color="primary"
          startIcon={<FiPlus />}
          onClick={() => setOpen(true)}
        >
          Create Task
        </Button>
      </div>

      {/* Top Cards */}
      <div className="flex space-x-4 px-6">
        <div onClick={() => setActiveCard("tasks")} className="cursor-pointer">
          <AdminTotalTaskList />
        </div>
        <div onClick={() => setActiveCard("users")} className="cursor-pointer">
          <UserCount />
        </div>
      </div>

      {/* Conditional Lists */}
      <div className="px-6 py-4">
        {activeCard === "tasks" && <AdminProcessTable />}
        {activeCard === "users" && <UserList />}
      </div>

      {/* Create Task Modal */}
      <CreateTaskForm open={open} onClose={() => setOpen(false)} />

      {/* Snackbar notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }} // bottom-center
      >
        <Alert
          severity="success"
          onClose={() => setSnackbarOpen(false)}
          sx={{
            backgroundColor: "#4caf50", // green background
            color: "#fff",
            fontWeight: "bold",
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AdminDashboard;
