'use client';

import { useEffect, useState } from 'react';

const Toast = ({ message, type, onDone }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onDone) {
        onDone();
      }
    }, 3000); // Auto-hide after 3 seconds

    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div
      className={`fixed bottom-5 right-5 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300 ${bgColor}`}
    >
      {message}
    </div>
  );
};

export default Toast;