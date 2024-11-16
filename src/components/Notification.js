import React, { useEffect, useRef } from "react";
import "./notification.css";
import notificationSound from "../sounds/notification.wav"; // Adjust path to your .wav file

const Notification = ({ message, onClose }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize the Audio object once
    if (!audioRef.current) {
      audioRef.current = new Audio(notificationSound);
    }

    // Play sound only if audio context is allowed
    const playSound = async () => {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error("Audio playback failed:", error);
      }
    };

    playSound();
  }, []); // Empty dependency array to ensure it runs only on mount

  return (
    <div className="notification">
      {/* Yellow Bell Icon */}
      <span className="notification-icon" style={{ color: "yellow" }}>
        🔔
      </span>
      <span className="notification-message">{message}</span>
      <button className="notification-close" onClick={onClose}>
        ✖
      </button>
    </div>
  );
};

export default Notification;
