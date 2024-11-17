import React, { useEffect } from "react";
import "./NotificationComponent.css";

function NotificationComponent({ message, onClose }) {
  useEffect(() => {
    // Play sound on notification display
    const audio = new Audio(require("../assets/sounds/notification.wav")); // Import sound file
    audio.volume = 0.5; // Set volume to 50%
    audio.play();

    // Set timer to close notification after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, [onClose]);

  return (
    <div className="notification-container">
      <div className="notification">
        <span className="notification-icon">&#128276;</span> {/* Bell Icon */}
        <p>{message}</p>
      </div>
    </div>
  );
}

export default NotificationComponent;
