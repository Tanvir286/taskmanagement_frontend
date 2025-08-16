"use client";

import { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import { Snackbar, Alert, Button } from "@mui/material";
import socket from "@/lib/socket"; 
import UserCount from "../../../component/layout/UserCount";
import UserList from "../../../component/layout/UserList";
import UserTotalTaskList from "@/component/section/user/UserTotalTaskList";
import UserProcessTable from "@/component/section/user/UserProcessTable";


interface JwtPayload {
  username: string;
  email: string;
  sub: string;
  role: string;
  exp: number;
  iat?: number;
}

const Userpage = () => {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  // Notification state
  const [notifications, setNotifications] = useState<{ message: string; time: string }[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Card 
  const [activeCard, setActiveCard] = useState<"tasks" | "users" | null>(null);

  // Get user 
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

  useEffect(() => {
    // Join a common board/room
    socket.emit("join-board", "all-boards");

    // Task Created
    socket.on("task.created", (task) => {
      const message = `New task: ${task.title} (Assigned to ${task.assignedUser?.username || "N/A"})`;
      setNotifications((prev) => [{ message, time: new Date().toLocaleTimeString() }, ...prev]);
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    });

    // Task Updated
    socket.on("task.updated", (task) => {
      const message = `Task "${task.title}" (ID: ${task.id}) has been updated by an admin.`;
      setNotifications((prev) => [{ message, time: new Date().toLocaleTimeString() }, ...prev]);
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    });

    // Task Deleted
    socket.on("task.deleted", ({ id }) => {
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

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/auth/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 shadow-lg text-white relative">
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <img src="/images/logo.png" alt="TaskFlow Logo" className="w-30 h-14 rounded" />
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-6 relative">
          {/* Notifications */}
          <div
            className="relative cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <FaBell className="text-xl hover:scale-110 transition" />
            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-xs px-2 py-0.5 rounded-full animate-pulse">
                {notifications.length}
              </span>
            )}
          </div>

          {/* Notification Dropdown */}
          {dropdownOpen && (
            <div className="absolute top-12 right-0 w-80 bg-white shadow-lg rounded-lg overflow-hidden z-50 border border-green-100">
              <div className="bg-green-500 text-white px-4 py-2 font-semibold border-b border-green-400">
                Notifications
              </div>
              <div className="max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-gray-500 p-4 text-sm text-center">No notifications</p>
                ) : (
                  notifications.map((n, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 border-b border-gray-100 hover:bg-green-50 transition"
                    >
                      <p className="text-sm text-green-800 font-medium">{n.message}</p>
                      <span className="text-xs text-green-600">{n.time}</span>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div
                  className="text-center text-red-500 py-2 text-sm cursor-pointer hover:bg-gray-100 transition font-medium"
                  onClick={() => setNotifications([])}
                >
                  Clear All
                </div>
              )}
            </div>
          )}

          {/* Role */}
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full shadow">
            {user?.role || "User"}
          </span>

          {/* User Profile */}
          <div className="flex items-center space-x-2 cursor-pointer hover:bg-white/10 px-2 py-1 rounded-lg transition">
            <img
              src="/images/user.jpeg"
              alt="User"
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <span className="font-medium">{user?.username || "Guest"}</span>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="ml-4 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-full shadow"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Snackbar notification */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="success"
            onClose={() => setSnackbarOpen(false)}
            sx={{
              backgroundColor: "#4caf50",
              color: "#fff",
              fontWeight: "bold",
              boxShadow: "0 4px 10px rgba(76, 175, 80, 0.4)",
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </header>

      {/* Page title */}
      <div className="px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Control Center</h2>
          <p className="text-gray-500">System overview and Task management</p>
        </div>
      </div>

      {/* Top Cards */}
      <div className="flex space-x-4 px-6">
        <div onClick={() => setActiveCard("tasks")} className="cursor-pointer">
          <UserTotalTaskList />
        </div>
        <div onClick={() => setActiveCard("users")} className="cursor-pointer">
          <UserCount />
        </div>
      </div>

      {/* Conditional Lists */}
      <div className="px-6 py-4">
        {activeCard === "tasks" && <UserProcessTable/>}
        {activeCard === "users" && <UserList />}
      </div>
    </div>
  );
};

export default Userpage;
