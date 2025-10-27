import React from 'react';

const Loading = () => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold" style={{ fontFamily: 'Cinzel Decorative', }}>
          MahaRitage
        </h1>
        <p className="text-xl mt-4">Loading...</p>
      </div>
    </div>
  );
};

export default Loading;
