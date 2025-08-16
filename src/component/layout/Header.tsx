"use client";

import { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";

// JWT decode করার function
function parseJwt(token: string) {
  try {
    const base64Payload = token.split(".")[1]; // payload অংশ বের করা
    const payload = atob(base64Payload); // base64 decode
    console.log(payload);
    return JSON.parse(payload); // JSON এ রূপান্তর
  } catch (err) {
    console.error("Invalid token", err);
    return null;
  }
}

const Header = () => {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const decoded = parseJwt(token);
      if (decoded) {
        setUser({
          username: decoded.username,
          role: decoded.role,
        });
      }
    }
  }, []);

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 shadow-lg text-white">
      {/* Logo Section */}
      <div className="flex items-center space-x-3">
        <img src="/images/logo.png" alt="TaskFlow Logo" className="w-30 h-14 rounded" />
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-6">
        {/* Notifications */}
        <div className="relative cursor-pointer">
          <FaBell className="text-xl hover:scale-110 transition" />
          <span className="absolute -top-2 -right-2 bg-red-600 text-xs px-2 py-0.5 rounded-full">
            5
          </span>
        </div>

        {/* Role */}
        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full shadow">
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
        </div>
      </div>
    </header>
  );
};

export default Header;
