"use client";
import React from 'react';
import { FileText } from 'lucide-react';

const ApiDocs = ({ handleNavigation }) => {
    return (
        <section className="py-20 bg-green-50">
            <div className="container mx-auto px-4 text-center">
                <div className="max-w-3xl mx-auto">
                    <div className="text-green-600 mb-6 flex justify-center">
                        <FileText className="w-16 h-16" />
                    </div>
                    <h2
                        className="text-4xl font-bold text-gray-800 mb-6"
                        style={{
                            fontFamily: "'Playfair Display', 'Times New Roman', serif",
                            letterSpacing: '0.02em'
                        }}
                    >
                        Access API Documentation
                    </h2>
                    <p
                        className="text-gray-600 mb-10 text-lg leading-relaxed"
                        style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
                    >
                        Integrate Maharashtra's heritage data into your applications with our comprehensive API.
                    </p>
                    <button
                        onClick={() => handleNavigation('/api-docs')}
                        className="bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-lg transition-colors duration-200 inline-flex items-center text-lg font-medium shadow-lg hover:shadow-xl"
                        style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
                    >
                        Visit Docs
                        <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );
}

export default ApiDocs;
