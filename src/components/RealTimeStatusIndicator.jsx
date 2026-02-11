import React, { useState, useEffect } from "react";

export default function RealTimeStatusIndicator() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <div className={`text-xs font-medium flex items-center gap-1.5 ${online ? "text-green-600" : "text-red-500"}`}>
      <span className={`inline-block w-2 h-2 rounded-full ${online ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
      {online ? "connected" : "disconnected"}
    </div>
  );
}
