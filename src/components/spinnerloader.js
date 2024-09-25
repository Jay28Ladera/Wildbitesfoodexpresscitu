import React, { useEffect, useState } from 'react';
import spinner from '../assets/sp.svg'; // Adjust the path as needed
import './spinnerloader.css';

export default function SPLoader() {
    const [showImg, setShowImg] = useState(true);
    const [text, setText] = useState('Loading...'); // Default loading text

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowImg(false);
            setText('Please wait...'); // Set text to display after the image
        }, 1000); // Change the timeout to a reasonable duration (1 second)

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="loader-container">
            {
                showImg ? (
                    <img src={spinner} alt="Loading spinner" />
                ) : (
                    <h3>{text}</h3>
                )
            }
        </div>
    );
}
