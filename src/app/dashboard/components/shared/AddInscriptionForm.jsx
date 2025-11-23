"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import dynamic from "next/dynamic";
import ChipInput from "../components/ChipInput";
import ImageUpload from "../components/ImageUpload";
import { X } from "lucide-react";

import LoadingButton from "../components/LoadingButton";

const AddInscriptionForm = ({ handleSelectItem, handleSubmit }) => {
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [lastInscriptionId, setLastInscriptionId] = useState(null);
  const [inscriptionData, setInscriptionData] = useState({
    Inscription_id: "",
    discription: "",
    original_script: "",
    language_detected: "",
    translations: {
      english: null,
      hindi: null,
    },
  });
  const [images, setImages] = useState([]);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetch("/api/sites");
        const data = await response.json();
        setSites(data);
      } catch (error) {
        console.error("Error fetching sites:", error);
      }
    };
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      const fetchLastInscriptionId = async () => {
        try {
          const response = await fetch(
            `/api/sites/${selectedSite}/last-inscription-id`
          );
          const data = await response.json();
          setLastInscriptionId(data.last_id);
        } catch (error) {
          console.error("Error fetching last inscription ID:", error);
        }
      };
      fetchLastInscriptionId();
    }
  }, [selectedSite]);

  useEffect(() => {
    if (selectedSite && lastInscriptionId) {
      const lastIdNumber = parseInt(lastInscriptionId.split("_")[1], 10);
      const newIdNumber = (lastIdNumber + 1).toString().padStart(2, "0");
      const newInscriptionId = `Insc_${newIdNumber}`;
      setInscriptionData((prev) => ({
        ...prev,
        Inscription_id: newInscriptionId,
      }));
    }
  }, [selectedSite, lastInscriptionId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInscriptionData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return <LoadingButton />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Add New Inscription</h2>
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
            selectedSite,
            setInscriptionData,
            setImages,
            setMessage,
            setIsLoading
          )
        }
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="site"
              className="block text-sm font-medium text-gray-700"
            >
              Select Site
            </label>
            <select
              name="site"
              id="site"
              value={selectedSite}
              onChange={(e) => {
                if (e.target.value === "add_new_site") {
                  handleSelectItem("Add Site");
                } else {
                  setSelectedSite(e.target.value);
                }
              }}
              required
              className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
            >
              <option value="" disabled>
                Select a site
              </option>
              {sites.map((site) => (
                <option key={site.site_id} value={site.site_id}>
                  {site.site_name}
                </option>
              ))}
              <option value="add_new_site">+ Add New Site</option>
            </select>
          </div>
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
              className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6 "
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
        </div>
        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="submit"
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Add Inscription
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddInscriptionForm;
