'use client';

import React, { useState } from 'react';

const ReferenceInput = ({ onAdd }) => {
  const [reference, setReference] = useState({ title: '', author: '', year: '', url: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReference(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    if (reference.title && reference.author && reference.year && reference.url) {
      onAdd(reference);
      setReference({ title: '', author: '', year: '', url: '' });
    }
  };

  return (
    <div className="space-y-4 border border-gray-300 p-4 rounded-md">
        <h4 className="text-md font-semibold">Add Reference</h4>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" name="title" id="title" value={reference.title} onChange={handleChange} className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6" />
            </div>
            <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700">Author</label>
                <input type="text" name="author" id="author" value={reference.author} onChange={handleChange} className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6" />
            </div>
            <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
                <input type="number" name="year" id="year" value={reference.year} onChange={handleChange} className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6" />
            </div>
            <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700">URL</label>
                <input type="url" name="url" id="url" value={reference.url} onChange={handleChange} className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6" />
            </div>
        </div>
      <button
        type="button"
        onClick={handleAdd}
        className="px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        Add Reference
      </button>
    </div>
  );
};

export default ReferenceInput;
