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
    <div className="space-y-4 rounded-lg border border-[#263a2d]/14 bg-[#fffaf0]/70 p-4">
        <h4 className="font-cinzel-decorative text-lg font-bold text-[#263a2d]">Add Reference</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
                <label htmlFor="title" className="archive-label block">Title</label>
                <input type="text" name="title" id="title" value={reference.title} onChange={handleChange} className="archive-input mt-1 block w-full rounded-full p-2 leading-6 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="author" className="archive-label block">Author</label>
                <input type="text" name="author" id="author" value={reference.author} onChange={handleChange} className="archive-input mt-1 block w-full rounded-full p-2 leading-6 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="year" className="archive-label block">Year</label>
                <input type="number" name="year" id="year" value={reference.year} onChange={handleChange} className="archive-input mt-1 block w-full rounded-full p-2 leading-6 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="url" className="archive-label block">URL</label>
                <input type="url" name="url" id="url" value={reference.url} onChange={handleChange} className="archive-input mt-1 block w-full rounded-full p-2 leading-6 sm:text-sm" />
            </div>
        </div>
      <button
        type="button"
        onClick={handleAdd}
        className="archive-button px-4 py-2 text-sm"
      >
        Add Reference
      </button>
    </div>
  );
};

export default ReferenceInput;
