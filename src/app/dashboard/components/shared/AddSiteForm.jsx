"use client";

import React, { useState, useEffect, useReducer } from "react";
import dynamic from "next/dynamic";
import ChipInput from "../components/ChipInput";
import ReferenceInput from "../components/ReferenceInput";
import ImageUpload from "../components/ImageUpload";
import {
  Building2,
  Castle,
  FileText,
  Images,
  Landmark,
  Layers3,
  Map,
  MapPin,
  Mountain,
  ScrollText,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { fetchWithInternalToken } from "../../../../lib/fetch";

const MapPicker = dynamic(() => import("../components/MapPicker"), {
  ssr: false,
});

import LoadingButton from "../components/LoadingButton";

const initialState = {
  site_id: "",
  site_name: "",
  location: {
    latitude: "",
    longitude: "",
    district: "",
    state: "Maharashtra",
    country: "India",
  },
  site_discription: "",
  heritage_type: "",
  h_type: "",
  period: "",
  historical_context: {
    ruler_or_dynasty: "",
    approx_date: "",
    related_figures: [],
    cultural_significance: "",
  },
  architecture: {
    defensive_design: "",
    entry_gates: "",
    bastions: "",
    water_systems: "",
    materials: "",
    cave_architecture: "",
    excavation_style: "",
    sanctum_layout: "",
    structural_style: "",
  },
  cave_metadata: {
    cave_count: "",
    excavation_period: "",
    patronage: "",
    iconography: "",
  },
  temple_metadata: {
    deity_or_tradition: "",
    mandapa_details: "",
    shikhara_style: "",
    ritual_usage: "",
  },
  inscription_metadata: {
    script: "",
    language: "",
    material: "",
    inscription_date: "",
    transliteration_notes: "",
  },
  other_schema: {
    architecture: false,
    oral_history: false,
    artifacts: false,
    preservation_data: true,
    timelines: false,
    inscriptions: false,
    gallery: true,
    structural_metadata: false,
  },
  other_metadata: {
    oral_history: "",
    artifacts: "",
    timeline: "",
  },
  preservation_details: {
    current_condition: "",
    managing_authority: "",
    access_notes: "",
    risk_factors: "",
  },
  fort_classification: {
    terrain_type: "",
    strategic_role: "",
    elevation: "",
  },
  verification_authority: {
    curated_by: [],
  },
  references: [],
  gallary: [],
  inscriptions: [],
};

function siteReducer(state, action) {
  switch (action.type) {
    case "UPDATE_FIELD":
      return { ...state, [action.field]: action.value };
    case "UPDATE_NESTED_FIELD":
      return {
        ...state,
        [action.parent]: {
          ...state[action.parent],
          [action.field]: action.value,
        },
      };
    case "TOGGLE_SCHEMA_FIELD":
      return {
        ...state,
        other_schema: {
          ...state.other_schema,
          [action.field]: action.value,
        },
      };
    case "SET_SITE_ID_AND_NAME":
      return { ...state, site_id: action.site_id, site_name: action.site_name };
    case "RESET_SITE_ID_AND_NAME":
      return { ...state, site_id: "", site_name: "" };
    case "ADD_REFERENCE":
      return { ...state, references: [...state.references, action.reference] };
    case "REMOVE_REFERENCE":
      return {
        ...state,
        references: state.references.filter((_, i) => i !== action.index),
      };
    case "RESET_FORM":
      return initialState;
    default:
      return state;
  }
}

const AddSiteForm = ({ handleSubmit }) => {
  const [lastSiteId, setLastSiteId] = useState(null);
  const [siteData, dispatch] = useReducer(siteReducer, initialState);
  const [rawSiteName, setRawSiteName] = useState("");
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [optionalSections, setOptionalSections] = useState({
    inscriptions: false,
  });

  useEffect(() => {
    const fetchLastSiteId = async () => {
      try {
        const response = await fetchWithInternalToken("/api/sites/last-id");
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
      dispatch({
        type: "SET_SITE_ID_AND_NAME",
        site_id: newSiteId,
        site_name: normalizedName,
      });
    } else if (lastSiteId) {
      dispatch({ type: "RESET_SITE_ID_AND_NAME" });
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
        dispatch({
          type: "UPDATE_NESTED_FIELD",
          parent,
          field,
          value: value.split(",").map((item) => item.trim()),
        });
      } else {
        dispatch({ type: "UPDATE_NESTED_FIELD", parent, field: name, value });
      }
    } else if (isArray) {
      dispatch({
        type: "UPDATE_FIELD",
        field,
        value: value.split(",").map((item) => item.trim()),
      });
    } else {
      dispatch({ type: "UPDATE_FIELD", field: name, value });
      if (name === "heritage_type") {
        dispatch({ type: "UPDATE_FIELD", field: "h_type", value });
      }
    }
  };

  const handleSiteNameChange = (e) => {
    setRawSiteName(e.target.value);
  };

  const handleMapLocationChange = ({ lat, lng }) => {
    dispatch({
      type: "UPDATE_NESTED_FIELD",
      parent: "location",
      field: "latitude",
      value: lat,
    });
    dispatch({
      type: "UPDATE_NESTED_FIELD",
      parent: "location",
      field: "longitude",
      value: lng,
    });
  };

  const getInitialPosition = () => {
    const { latitude, longitude } = siteData.location;
    if (latitude && longitude) {
      return [parseFloat(latitude), parseFloat(longitude)];
    }
    return null;
  };

  if (isLoading) {
    return <LoadingButton />;
  }

  const selectedType = siteData.heritage_type || "";
  const isCaveEntry = /cave/i.test(selectedType);
  const isFortEntry = /fort/i.test(selectedType);
  const isTempleEntry = /temple/i.test(selectedType);
  const isInscriptionEntry = /inscription/i.test(selectedType);
  const isArchitectureEntry = /architecture/i.test(selectedType);
  const isOtherEntry = /other/i.test(selectedType);
  const inputClass =
    "archive-input mt-1 block w-full rounded-2xl px-[clamp(0.85rem,2vw,1rem)] py-[clamp(0.75rem,1.8vw,0.9rem)] text-[clamp(0.92rem,1.5vw,0.98rem)] leading-6";
  const textareaClass =
    "archive-input mt-1 block w-full rounded-2xl px-[clamp(0.85rem,2vw,1rem)] py-[clamp(0.75rem,1.8vw,0.9rem)] text-[clamp(0.92rem,1.5vw,0.98rem)] leading-7";
  const panelClass =
    "museum-card rounded-[1.25rem] p-[clamp(1rem,2.5vw,1.5rem)]";
  const sectionTitleClass =
    "mb-4 flex items-center gap-2 font-cinzel-decorative text-[clamp(1.05rem,2.4vw,1.35rem)] font-bold leading-tight text-[#123327]";

  const toggleOptionalSection = (key) => {
    setOptionalSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderTextField = (parent, field, label, placeholder = "", multiline = false) => (
    <div key={`${parent}-${field}`}>
      <label htmlFor={field} className="archive-label block">
        {label}
      </label>
      {multiline ? (
        <textarea
          name={field}
          id={field}
          value={siteData[parent][field]}
          onChange={(e) => handleChange(e, parent)}
          rows="3"
          placeholder={placeholder}
          className={textareaClass}
        />
      ) : (
        <input
          type="text"
          name={field}
          id={field}
          value={siteData[parent][field]}
          onChange={(e) => handleChange(e, parent)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </div>
  );

  const ToggleSection = ({ id, title, description, checked, onToggle, children }) => (
    <div className="rounded-2xl border border-[#123327]/10 bg-[#fffaf0]/56 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-extrabold text-[#123327]">{title}</h4>
          <p className="mt-1 text-xs leading-5 text-stone-600">{description}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={checked}
          className={`relative h-8 w-14 shrink-0 rounded-full border transition ${
            checked
              ? "border-[#123327]/30 bg-[#123327]"
              : "border-stone-300 bg-stone-200"
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
              checked ? "left-7" : "left-1"
            }`}
          />
          <span className="sr-only">{id}</span>
        </button>
      </div>
      {checked && <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-[clamp(1rem,3vw,2rem)] py-[clamp(1.5rem,4vw,2.5rem)] text-stone-900">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8a6a31]">
          Archival Intake
        </p>
        <h2 className="mt-2 font-cinzel-decorative text-[clamp(1.8rem,4vw,2.45rem)] font-bold leading-tight text-[#123327]">
          Register Heritage Record
        </h2>
        <p className="mt-3 max-w-3xl text-[clamp(0.92rem,1.8vw,1rem)] leading-7 text-stone-600">
          Create a structured site record with only the metadata that belongs to
          the selected heritage type. Optional archival layers stay hidden until
          the record needs them.
        </p>
      </div>
      {message && (
        <div
          className={`mb-5 rounded-2xl border p-4 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
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
            dispatch,
            setImages,
            setMessage,
            setIsLoading
          )
        }
        className="space-y-6"
      >
        <div className="grid grid-cols-1 gap-[clamp(1rem,2.5vw,1.5rem)] lg:grid-cols-[minmax(0,1.02fr)_minmax(20rem,0.98fr)]">
          <div className={panelClass}>
            <h3 className={sectionTitleClass}>
              <FileText className="h-5 w-5 text-[#8a6a31]" />
              Site Identity
            </h3>
            <div className="space-y-4">
            <div>
              <label
                htmlFor="site_id"
                className="archive-label block"
              >
                Site ID
              </label>
              <input
                type="text"
                name="site_id"
                id="site_id"
                value={siteData.site_id}
                required
                className={`${inputClass} opacity-70`}
                disabled
              />
            </div>
            <div>
              <label
                htmlFor="site_name"
                className="archive-label block"
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
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="site_discription"
                className="archive-label block"
              >
                Description
              </label>
              <textarea
                name="site_discription"
                id="site_discription"
                value={siteData.site_discription}
                onChange={handleChange}
                rows="4"
                required
                className={textareaClass}
              ></textarea>
            </div>
            <div>
              <label
                htmlFor="heritage_type"
                className="archive-label block"
              >
                Heritage Type
              </label>
              <select
                name="heritage_type"
                id="heritage_type"
                value={siteData.heritage_type}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select type</option>
                <option value="Cave">Cave</option>
                <option value="Fort">Fort</option>
                <option value="Inscription">Inscription</option>
                <option value="Temple">Temple</option>
                <option value="Architecture">Architecture</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="period"
                className="archive-label block"
              >
                Period
              </label>
              <input
                type="text"
                name="period"
                id="period"
                value={siteData.period}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            </div>
          </div>

          <div className={panelClass}>
            <h3 className={sectionTitleClass}>
              <MapPin className="h-5 w-5 text-[#8a6a31]" />
              Geographic Record
            </h3>
            <div className="space-y-4">
            <MapPicker
              onLocationChange={handleMapLocationChange}
              initialPosition={getInitialPosition()}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="latitude"
                  className="archive-label block"
                >
                  Latitude
                </label>
                <input
                  type="number"
                  name="latitude"
                  id="latitude"
                  value={siteData.location.latitude}
                  onChange={(e) => handleChange(e, "location")}
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="longitude"
                  className="archive-label block"
                >
                  Longitude
                </label>
                <input
                  type="number"
                  name="longitude"
                  id="longitude"
                  value={siteData.location.longitude}
                  onChange={(e) => handleChange(e, "location")}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="district"
                className="archive-label block"
              >
                District
              </label>
              <input
                type="text"
                name="district"
                id="district"
                value={siteData.location.district}
                onChange={(e) => handleChange(e, "location")}
                className={inputClass}
              />
            </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[clamp(1rem,2.5vw,1.5rem)] lg:grid-cols-2">
          <div className={panelClass}>
            <h3 className={sectionTitleClass}>
              <Castle className="h-5 w-5 text-[#8a6a31]" />
              Historical Context
            </h3>
            <div className="space-y-4">
            <div>
              <label
                htmlFor="ruler_or_dynasty"
                className="archive-label block"
              >
                Ruler/Dynasty
              </label>
              <input
                type="text"
                name="ruler_or_dynasty"
                id="ruler_or_dynasty"
                value={siteData.historical_context.ruler_or_dynasty}
                onChange={(e) => handleChange(e, "historical_context")}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="approx_date"
                className="archive-label block"
              >
                Approx. Date
              </label>
              <input
                type="text"
                name="approx_date"
                id="approx_date"
                value={siteData.historical_context.approx_date}
                onChange={(e) => handleChange(e, "historical_context")}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="related_figures"
                className="archive-label block"
              >
                Related Figures
              </label>
              <ChipInput
                value={siteData.historical_context.related_figures}
                onChange={(newValue) =>
                  dispatch({
                    type: "UPDATE_NESTED_FIELD",
                    parent: "historical_context",
                    field: "related_figures",
                    value: newValue,
                  })
                }
                placeholder="Add a figure"
              />
            </div>
            <div>
              <label
                htmlFor="cultural_significance"
                className="archive-label block"
              >
                Cultural Significance
              </label>
              <textarea
                name="cultural_significance"
                id="cultural_significance"
                value={siteData.historical_context.cultural_significance}
                onChange={(e) => handleChange(e, "historical_context")}
                rows="3"
                className={textareaClass}
              ></textarea>
            </div>
            </div>
          </div>

          <div className={panelClass}>
            <h3 className={sectionTitleClass}>
              <Shield className="h-5 w-5 text-[#8a6a31]" />
              Authority {isCaveEntry ? "" : "& Gallery"}
            </h3>
            <div className="space-y-4">
            <div>
              <label
                htmlFor="curated_by"
                className="archive-label block"
              >
                Curated By {"(Verification Authority)"}
              </label>
              <ChipInput
                value={siteData.verification_authority.curated_by}
                onChange={(newValue) =>
                  dispatch({
                    type: "UPDATE_NESTED_FIELD",
                    parent: "verification_authority",
                    field: "curated_by",
                    value: newValue,
                  })
                }
                placeholder="Add a curator"
              />
            </div>
            {!isCaveEntry && (
              <div>
                <label
                  htmlFor="gallary"
                  className="archive-label block"
                >
                  Gallery Images
                </label>
                <ImageUpload files={images} onFilesChange={setImages} />
              </div>
            )}
            </div>
          </div>
        </div>

        {isOtherEntry && (
          <div className={panelClass}>
            <h3 className={sectionTitleClass}>
              <Sparkles className="h-5 w-5 text-[#8a6a31]" />
              Dynamic Heritage Schema
            </h3>
            <p className="mb-4 text-sm leading-6 text-stone-600">
              Select the archival layers this record should store. The form will
              reveal only the sections relevant to that custom record.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["architecture", "Architecture"],
                ["oral_history", "Oral history"],
                ["artifacts", "Artifacts"],
                ["preservation_data", "Preservation"],
                ["timelines", "Timelines"],
                ["inscriptions", "Inscriptions"],
                ["gallery", "Gallery"],
                ["structural_metadata", "Structure"],
              ].map(([field, label]) => (
                <label
                  key={field}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    siteData.other_schema[field]
                      ? "border-[#123327]/28 bg-[#123327]/8 text-[#123327]"
                      : "border-stone-200 bg-white/45 text-stone-600"
                  }`}
                >
                  {label}
                  <input
                    type="checkbox"
                    checked={siteData.other_schema[field]}
                    onChange={(e) =>
                      dispatch({
                        type: "TOGGLE_SCHEMA_FIELD",
                        field,
                        value: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-[#123327]"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {isCaveEntry && (
          <div className="grid grid-cols-1 gap-[clamp(1rem,2.5vw,1.5rem)] xl:grid-cols-3">
            <div className={panelClass}>
              <h3 className={sectionTitleClass}>
                <Mountain className="h-5 w-5 text-[#8a6a31]" />
                Cave Metadata
              </h3>
              <div className="space-y-4">
                {renderTextField("cave_metadata", "cave_count", "Cave Count", "e.g. 29 excavations")}
                {renderTextField("cave_metadata", "excavation_period", "Excavation Period", "e.g. 2nd century BCE")}
                {renderTextField("cave_metadata", "patronage", "Patronage", "Dynasty, guild, or donor record")}
                {renderTextField("cave_metadata", "iconography", "Iconography", "Murals, sculptures, motifs", true)}
              </div>
            </div>

            <div className={panelClass}>
              <h3 className={sectionTitleClass}>
                <Building2 className="h-5 w-5 text-[#8a6a31]" />
                Cave Architecture
              </h3>
              <div className="space-y-4">
                {renderTextField("architecture", "cave_architecture", "Spatial Layout", "Chaitya, vihara, shrine sequence")}
                {renderTextField("architecture", "excavation_style", "Excavation Style", "Rock-cut method, facade type")}
                {renderTextField("architecture", "materials", "Rock / Materials")}
                {renderTextField("architecture", "structural_style", "Structural Style", "Pillars, cells, sanctum alignment")}
              </div>
            </div>

            <div className={panelClass}>
              <h3 className={sectionTitleClass}>
                <Images className="h-5 w-5 text-[#8a6a31]" />
                Cave Gallery
              </h3>
              <ImageUpload files={images} onFilesChange={setImages} />
              <div className="mt-4">
                <ToggleSection
                  id="cave-inscriptions"
                  title="Enable Inscriptions"
                  description="Reveal epigraphic fields only when this cave record includes inscriptions."
                  checked={optionalSections.inscriptions}
                  onToggle={() => toggleOptionalSection("inscriptions")}
                >
                  {renderTextField("inscription_metadata", "script", "Script")}
                  {renderTextField("inscription_metadata", "language", "Language")}
                  {renderTextField("inscription_metadata", "inscription_date", "Date")}
                  {renderTextField("inscription_metadata", "transliteration_notes", "Notes", "", true)}
                </ToggleSection>
              </div>
            </div>
          </div>
        )}

        {isFortEntry && (
          <div className="grid grid-cols-1 gap-[clamp(1rem,2.5vw,1.5rem)] xl:grid-cols-3">
            <div className={panelClass}>
            <h3 className={sectionTitleClass}>
              <Castle className="h-5 w-5 text-[#8a6a31]" />
              Fort Classification
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="terrain_type" className="archive-label block">
                  Terrain Type
                </label>
                <input
                  type="text"
                  name="terrain_type"
                  id="terrain_type"
                  value={siteData.fort_classification.terrain_type}
                  onChange={(e) => handleChange(e, "fort_classification")}
                  placeholder="Hill fort, sea fort, land fort"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="strategic_role" className="archive-label block">
                  Strategic Role
                </label>
                <input
                  type="text"
                  name="strategic_role"
                  id="strategic_role"
                  value={siteData.fort_classification.strategic_role}
                  onChange={(e) => handleChange(e, "fort_classification")}
                  placeholder="Watch post, capital, coastal defense"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="elevation" className="archive-label block">
                  Elevation
                </label>
                <input
                  type="text"
                  name="elevation"
                  id="elevation"
                  value={siteData.fort_classification.elevation}
                  onChange={(e) => handleChange(e, "fort_classification")}
                  className={inputClass}
                />
              </div>
            </div>
            </div>

          <div className={panelClass}>
            <h3 className={sectionTitleClass}>
              <Shield className="h-5 w-5 text-[#8a6a31]" />
              Architecture
            </h3>
            <div className="space-y-4">
              {[
                ["defensive_design", "Defensive Design"],
                ["materials", "Materials"],
              ].map(([field, label]) => (
                <div key={field}>
                  <label htmlFor={field} className="archive-label block">
                    {label}
                  </label>
                  <input
                    type="text"
                    name={field}
                    id={field}
                    value={siteData.architecture[field]}
                    onChange={(e) => handleChange(e, "architecture")}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className={panelClass}>
            <h3 className={sectionTitleClass}>
              <Map className="h-5 w-5 text-[#8a6a31]" />
              Strategic Sections
            </h3>
            <div className="space-y-4">
              {renderTextField("architecture", "entry_gates", "Gates")}
              {renderTextField("architecture", "bastions", "Bastions")}
              {renderTextField("architecture", "water_systems", "Water Systems")}
              <ToggleSection
                id="fort-inscriptions"
                title="Enable inscriptions"
                description="Fort inscriptions are optional and stay hidden unless this record includes epigraphic material."
                checked={optionalSections.inscriptions}
                onToggle={() => toggleOptionalSection("inscriptions")}
              >
                {renderTextField("inscription_metadata", "script", "Script")}
                {renderTextField("inscription_metadata", "language", "Language")}
                {renderTextField("inscription_metadata", "material", "Surface / Material")}
                {renderTextField("inscription_metadata", "transliteration_notes", "Notes", "", true)}
              </ToggleSection>
            </div>
          </div>
        </div>
        )}

        {(isTempleEntry || isInscriptionEntry || isArchitectureEntry || (isOtherEntry && (siteData.other_schema.architecture || siteData.other_schema.structural_metadata || siteData.other_schema.inscriptions))) && (
          <div className="grid grid-cols-1 gap-[clamp(1rem,2.5vw,1.5rem)] lg:grid-cols-2">
            {(isTempleEntry || isArchitectureEntry || siteData.other_schema.architecture || siteData.other_schema.structural_metadata) && (
              <div className={panelClass}>
                <h3 className={sectionTitleClass}>
                  <Landmark className="h-5 w-5 text-[#8a6a31]" />
                  Architectural Metadata
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {isTempleEntry && renderTextField("temple_metadata", "deity_or_tradition", "Deity / Tradition")}
                  {isTempleEntry && renderTextField("temple_metadata", "mandapa_details", "Mandapa Details")}
                  {isTempleEntry && renderTextField("temple_metadata", "shikhara_style", "Shikhara Style")}
                  {renderTextField("architecture", "materials", "Materials")}
                  {renderTextField("architecture", "structural_style", "Structural Style")}
                  {renderTextField("architecture", "sanctum_layout", "Spatial / Sanctum Layout")}
                </div>
              </div>
            )}

            {(isInscriptionEntry || siteData.other_schema.inscriptions) && (
              <div className={panelClass}>
                <h3 className={sectionTitleClass}>
                  <ScrollText className="h-5 w-5 text-[#8a6a31]" />
                  Inscription Metadata
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {renderTextField("inscription_metadata", "script", "Script")}
                  {renderTextField("inscription_metadata", "language", "Language")}
                  {renderTextField("inscription_metadata", "material", "Material")}
                  {renderTextField("inscription_metadata", "inscription_date", "Date")}
                  <div className="sm:col-span-2">
                    {renderTextField("inscription_metadata", "transliteration_notes", "Transliteration Notes", "", true)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {isOtherEntry && (siteData.other_schema.oral_history || siteData.other_schema.artifacts || siteData.other_schema.timelines) && (
          <div className={panelClass}>
            <h3 className={sectionTitleClass}>
              <FileText className="h-5 w-5 text-[#8a6a31]" />
              Cultural Record Layers
            </h3>
            <div className="grid gap-4 lg:grid-cols-3">
              {siteData.other_schema.oral_history &&
                renderTextField("other_metadata", "oral_history", "Oral History", "Community memory, source, or interview notes", true)}
              {siteData.other_schema.artifacts &&
                renderTextField("other_metadata", "artifacts", "Artifacts", "Objects, fragments, catalog notes", true)}
              {siteData.other_schema.timelines &&
                renderTextField("other_metadata", "timeline", "Timeline", "Chronological events or phases", true)}
            </div>
          </div>
        )}

        {(selectedType && (isFortEntry || isTempleEntry || isArchitectureEntry || isInscriptionEntry || isOtherEntry || siteData.other_schema?.preservation_data)) && (
          <div className={panelClass}>
            <h3 className={sectionTitleClass}>
              <Layers3 className="h-5 w-5 text-[#8a6a31]" />
              Preservation & Access
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["current_condition", "Current Condition"],
                ["managing_authority", "Managing Authority"],
                ["access_notes", "Access Notes"],
                ["risk_factors", "Risk Factors"],
              ].map(([field, label]) => (
                <div key={field}>
                  <label htmlFor={field} className="archive-label block">
                    {label}
                  </label>
                  <input
                    type="text"
                    name={field}
                    id={field}
                    value={siteData.preservation_details[field]}
                    onChange={(e) => handleChange(e, "preservation_details")}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* References */}
        <div className={panelClass}>
          <h3 className={sectionTitleClass}>References</h3>
          <ReferenceInput
            onAdd={(newReference) =>
              dispatch({ type: "ADD_REFERENCE", reference: newReference })
            }
          />
          <div className="space-y-2">
            {siteData.references.map((ref, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-2xl border border-[#123327]/10 bg-[#123327]/6 p-3"
              >
                <div>
                  <p className="font-semibold text-[#123327]">{ref.title}</p>
                  <p className="text-sm text-[#123327]/70">
                    {ref.author} ({ref.year})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "REMOVE_REFERENCE", index })}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center rounded-full border border-transparent bg-[#123327] px-6 py-3 text-sm font-bold text-[#fbf7ee] shadow-[0_18px_40px_rgba(18,51,39,0.18)] transition hover:bg-[#071b15] focus:outline-none focus:ring-2 focus:ring-[#b9924a]"
            >
              Submit Record
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddSiteForm;
