"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import dynamic from "next/dynamic";
import ChipInput from "../components/ChipInput";
import ReferenceInput from "../components/ReferenceInput";
import ImageUpload from "../components/ImageUpload";
import { X } from "lucide-react";

const MapPicker = dynamic(() => import("../components/MapPicker"), {
  ssr: false,
});

import Loading from "../../../../app/loading";

const AddSiteForm = ({ handleSubmit }) => {
  const { user } = useAuth();
  const [lastSiteId, setLastSiteId] = useState(null);
  const [siteData, setSiteData] = useState({
    site_id: "",
    site_name: "",
    location: {
      latitude: "",
      longitude: "",
      district: "",
      state: "Maharashtra",
      country: "India",
    },
    Site_discription: "",
    heritage_type: "",
    period: "",
    historical_context: {
      ruler_or_dynasty: "",
      approx_date: "",
      related_figures: [],
      cultural_significance: "",
    },
    verification_authority: {
      curated_by: [],
    },
    references: [],
    Gallary: [],
    Inscriptions: [],
  });
  const [rawSiteName, setRawSiteName] = useState("");
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchLastSiteId = async () => {
      try {
        const response = await fetch("/api/sites/last-id");
        const data = await response.json();
        setLastSiteId(data.last_id);
      } catch (error) {
        console.error("Error fetching last site ID:", error);
      }
    };
    fetchLastSiteId();
  }, []);

  const normalizeSiteName = (name) => {
    let normalized = name.toLowerCase().replace(/^the\s+/, "");
    if (normalized.endsWith("s")) {
      normalized = normalized.slice(0, -1);
    }
    return normalized
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    if (rawSiteName && lastSiteId) {
      const normalizedName = normalizeSiteName(rawSiteName);
      const namePrefix = normalizedName.substring(0, 3);
      const lastIdNumber = parseInt(lastSiteId.slice(-4), 10);
      const newIdNumber = (lastIdNumber + 1).toString().padStart(4, "0");
      const newSiteId = `${namePrefix.charAt(0).toUpperCase()}${namePrefix
        .slice(1)
        .toLowerCase()}${newIdNumber}`;
      setSiteData((prevData) => ({
        ...prevData,
        site_id: newSiteId,
        site_name: normalizedName,
      }));
    } else if (lastSiteId) {
      setSiteData((prevData) => ({ ...prevData, site_id: "", site_name: "" }));
    }
  }, [rawSiteName, lastSiteId]);

  const handleChange = (
    e,
    parent = null,
    isArray = false,
    fieldName = null
  ) => {
    const { name, value } = e.target;
    const field = fieldName || name;

    if (parent) {
      if (isArray) {
        setSiteData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [field]: value.split(",").map((item) => item.trim()),
          },
        }));
      } else {
        setSiteData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [name]: value,
          },
        }));
      }
    } else if (isArray) {
      setSiteData((prev) => ({
        ...prev,
        [field]: value.split(",").map((item) => item.trim()),
      }));
    } else {
      setSiteData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSiteNameChange = (e) => {
    setRawSiteName(e.target.value);
  };

  const handleMapLocationChange = ({ lat, lng }) => {
    setSiteData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        latitude: lat,
        longitude: lng,
      },
    }));
  };

  const getInitialPosition = () => {
    const { latitude, longitude } = siteData.location;
    if (latitude && longitude) {
      return [parseFloat(latitude), parseFloat(longitude)];
    }
    return null;
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Add New Site</h2>
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
            siteData,
            images,
            rawSiteName,
            setRawSiteName,
            setSiteData,
            setImages,
            setMessage,
            setIsLoading
          )
        }
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Site Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Site Information</h3>
            <div>
              <label
                htmlFor="site_id"
                className="block text-sm font-medium text-gray-700"
              >
                Site ID
              </label>
              <input
                type="text"
                name="site_id"
                id="site_id"
                value={siteData.site_id}
                required
                className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
                disabled
              />
            </div>
            <div>
              <label
                htmlFor="site_name"
                className="block text-sm font-medium text-gray-700"
              >
                Site Name
              </label>
              <input
                type="text"
                name="site_name"
                id="site_name"
                value={rawSiteName}
                onChange={handleSiteNameChange}
                required
                className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
              />
            </div>
            <div>
              <label
                htmlFor="Site_discription"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                name="Site_discription"
                id="Site_discription"
                value={siteData.Site_discription}
                onChange={handleChange}
                rows="4"
                required
                className="mt-1 block w-full rounded-lg border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
              ></textarea>
            </div>
            <div>
              <label
                htmlFor="heritage_type"
                className="block text-sm font-medium text-gray-700"
              >
                Heritage Type
              </label>
              <input
                type="text"
                name="heritage_type"
                id="heritage_type"
                value={siteData.heritage_type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
              />
            </div>
            <div>
              <label
                htmlFor="period"
                className="block text-sm font-medium text-gray-700"
              >
                Period
              </label>
              <input
                type="text"
                name="period"
                id="period"
                value={siteData.period}
                onChange={handleChange}
                className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location</h3>
            <MapPicker
              onLocationChange={handleMapLocationChange}
              initialPosition={getInitialPosition()}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="latitude"
                  className="block text-sm font-medium text-gray-700"
                >
                  Latitude
                </label>
                <input
                  type="number"
                  name="latitude"
                  id="latitude"
                  value={siteData.location.latitude}
                  onChange={(e) => handleChange(e, "location")}
                  className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
                />
              </div>
              <div>
                <label
                  htmlFor="longitude"
                  className="block text-sm font-medium text-gray-700"
                >
                  Longitude
                </label>
                <input
                  type="number"
                  name="longitude"
                  id="longitude"
                  value={siteData.location.longitude}
                  onChange={(e) => handleChange(e, "location")}
                  className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="district"
                className="block text-sm font-medium text-gray-700"
              >
                District
              </label>
              <input
                type="text"
                name="district"
                id="district"
                value={siteData.location.district}
                onChange={(e) => handleChange(e, "location")}
                className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Historical Context */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Historical Context</h3>
            <div>
              <label
                htmlFor="ruler_or_dynasty"
                className="block text-sm font-medium text-gray-700"
              >
                Ruler/Dynasty
              </label>
              <input
                type="text"
                name="ruler_or_dynasty"
                id="ruler_or_dynasty"
                value={siteData.historical_context.ruler_or_dynasty}
                onChange={(e) => handleChange(e, "historical_context")}
                className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
              />
            </div>
            <div>
              <label
                htmlFor="approx_date"
                className="block text-sm font-medium text-gray-700"
              >
                Approx. Date
              </label>
              <input
                type="text"
                name="approx_date"
                id="approx_date"
                value={siteData.historical_context.approx_date}
                onChange={(e) => handleChange(e, "historical_context")}
                className="mt-1 block w-full rounded-full border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
              />
            </div>
            <div>
              <label
                htmlFor="related_figures"
                className="block text-sm font-medium text-gray-700"
              >
                Related Figures
              </label>
              <ChipInput
                value={siteData.historical_context.related_figures}
                onChange={(newValue) =>
                  setSiteData((prev) => ({
                    ...prev,
                    historical_context: {
                      ...prev.historical_context,
                      related_figures: newValue,
                    },
                  }))
                }
                placeholder="Add a figure"
              />
            </div>
            <div>
              <label
                htmlFor="cultural_significance"
                className="block text-sm font-medium text-gray-700"
              >
                Cultural Significance
              </label>
              <textarea
                name="cultural_significance"
                id="cultural_significance"
                value={siteData.historical_context.cultural_significance}
                onChange={(e) => handleChange(e, "historical_context")}
                rows="3"
                className="mt-1 block w-full rounded-lg border-green-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 leading-6"
              ></textarea>
            </div>
          </div>

          {/* Other Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Other Details</h3>
            <div>
              <label
                htmlFor="curated_by"
                className="block text-sm font-medium text-gray-700"
              >
                Curated By {"(Verification Authority)"}
              </label>
              <ChipInput
                value={siteData.verification_authority.curated_by}
                onChange={(newValue) =>
                  setSiteData((prev) => ({
                    ...prev,
                    verification_authority: {
                      ...prev.verification_authority,
                      curated_by: newValue,
                    },
                  }))
                }
                placeholder="Add a curator"
              />
            </div>
            <div>
              <label
                htmlFor="Gallary"
                className="block text-sm font-medium text-gray-700"
              >
                Gallery Images
              </label>
              <ImageUpload files={images} onFilesChange={setImages} />
            </div>
          </div>
        </div>

        {/* References */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">References</h3>
          <ReferenceInput
            onAdd={(newReference) =>
              setSiteData((prev) => ({
                ...prev,
                references: [...prev.references, newReference],
              }))
            }
          />
          <div className="space-y-2">
            {siteData.references.map((ref, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-green-100 p-2 rounded-full"
              >
                <div>
                  <p className="font-semibold text-green-800">{ref.title}</p>
                  <p className="text-sm text-green-600">
                    {ref.author} ({ref.year})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSiteData((prev) => ({
                      ...prev,
                      references: prev.references.filter((_, i) => i !== index),
                    }))
                  }
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="submit"
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Add Site
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddSiteForm;
