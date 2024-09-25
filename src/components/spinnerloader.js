import React, { useEffect, useState } from 'react';

export default function SPLoader() {
    const [showImg, setShowImg] = useState(true);
    const [text, setText] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowImg(false);
            setText('I waited for 3 seconds to be loaded, did you see the spinner?');
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div>
            {
                showImg ? (
                    <img src="./sp.svg" alt="Loading spinner" />
                ) : (
                    <h3>{text}</h3>
                )
            }
        </div>
    );
}
