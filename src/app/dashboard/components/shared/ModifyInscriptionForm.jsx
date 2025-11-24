"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import dynamic from "next/dynamic";
import ImageUpload from "../components/ImageUpload";
import { X } from "lucide-react";

import Loading from "../../../loading";

const ModifyInscriptionForm = ({
  inscription: initialInscription,
  onUpdate,
  onCancel,
  siteId,
  handleSubmit,
}) => {
  const { user } = useAuth();
  const [inscriptionData, setInscriptionData] = useState(initialInscription);
  const [images, setImages] = useState([]);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInscriptionData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRemoveImage = (index) => {
    setInscriptionData((prev) => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Suggest Changes for Inscription</h2>
      {message && (
        <div
          className={`p-4 mb-4 text-sm rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}
      <form
        onSubmit={(e) =>
          handleSubmit(
            e,
            inscriptionData,
            images,
            siteId,
            setMessage,
            setIsLoading
          )
        }
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="Inscription_id"
              className="block text-sm font-medium text-gray-700"
            >
              Inscription ID
            </label>
            <input
              type="text"
              name="Inscription_id"
              id="Inscription_id"
              value={inscriptionData.Inscription_id}
              required
              className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6 bg-gray-100"
              disabled
            />
          </div>
          <div>
            <label
              htmlFor="discription"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              name="discription"
              id="discription"
              value={inscriptionData.discription}
              onChange={handleChange}
              rows="4"
              required
              className="mt-1 block w-full rounded-lg border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
            ></textarea>
          </div>
          <div>
            <label
              htmlFor="original_script"
              className="block text-sm font-medium text-gray-700"
            >
              Original Script
            </label>
            <input
              type="text"
              name="original_script"
              id="original_script"
              value={inscriptionData.original_script}
              onChange={handleChange}
              className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
            />
          </div>
          <div>
            <label
              htmlFor="language_detected"
              className="block text-sm font-medium text-gray-700"
            >
              Language Detected
            </label>
            <input
              type="text"
              name="language_detected"
              id="language_detected"
              value={inscriptionData.language_detected}
              onChange={handleChange}
              className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
            />
          </div>
          <div>
            <label
              htmlFor="images"
              className="block text-sm font-medium text-gray-700"
            >
              Images
            </label>
            <ImageUpload files={images} onFilesChange={setImages} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Current Images
            </label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {inscriptionData.image_urls &&
                inscriptionData.image_urls.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Inscription image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="bg-white py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Submit Suggestion
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ModifyInscriptionForm;
