import { useState } from 'react'
import './App.css'

import React from 'react';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">Hello, RUNOOB!</h1>
        <p className="mt-4 text-gray-600">菜鸟教程，学的不仅是技术，更是梦想！</p>
        <button className="mt-6 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700">
         点我试试
        </button>
      </div>
    </div>
  );
};

export default App;
