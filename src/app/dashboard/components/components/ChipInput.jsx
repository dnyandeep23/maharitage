'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

const ChipInput = ({ value, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim() !== '') {
      onChange([...value, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemove = (itemToRemove) => {
    onChange(value.filter(item => item !== itemToRemove));
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 leading-6"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {value.map((item, index) => (
          <div key={index} className="flex items-center bg-green-100 rounded-full px-3 py-1 text-sm font-medium text-green-800">
            {item}
            <button type="button" onClick={() => handleRemove(item)} className="ml-2 text-green-800 hover:text-green-900">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChipInput;
