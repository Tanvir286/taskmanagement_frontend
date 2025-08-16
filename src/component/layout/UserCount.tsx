'use client';
import React, { useEffect, useState } from 'react';

export default function UserCount() {
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const res = await fetch('https://nestjs-task-production-09a2.up.railway.app/auth/getall');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setUserCount(data.length);
      } catch (err) {
        console.error('Error fetching user count:', err);
      }
    };

    fetchUserCount();
  }, []);

  return (
    <div className="flex items-center bg-white/80 backdrop-blur-md border-l-8 border-green-500 shadow-lg rounded-xl p-6 w-full max-w-sm m-2 transition transform hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex-1 text-left">
        <h2 className="text-xl font-semibold text-green-700 mb-2">👥 Users</h2>
        <p className="text-gray-500 text-sm">Total number of users</p>
      </div>
      <div className="bg-green-500 text-white font-bold text-2xl w-16 h-16 flex items-center justify-center rounded-full shadow-md">
        {userCount ?? "..."}
      </div>
    </div>
  );
}
