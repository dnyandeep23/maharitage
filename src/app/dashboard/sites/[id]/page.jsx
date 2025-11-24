"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Loading from "../../../loading";
import { fetchWithInternalToken } from "../../../../lib/fetch";

const ModifySitePage = () => {
  const { id } = useParams();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchSite = async () => {
        try {
          const response = await fetchWithInternalToken(`/api/sites/${id}`);
          const data = await response.json();
          setSite(data);
        } catch (error) {
          console.error("Error fetching site:", error);
        }
        setLoading(false);
      };
      fetchSite();
    }
  }, [id]);

  const handleUpdate = (updatedSite) => {
    setSite(updatedSite);
  };

  if (loading) {
    return <Loading />;
  }

  if (!site) {
    return <div>Site not found</div>;
  }

  return <ModifySite site={site} onUpdate={handleUpdate} />;
};

export default ModifySitePage;
