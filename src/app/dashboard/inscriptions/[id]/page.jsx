"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Loading from "../../../loading";
import { fetchWithInternalToken } from "../../../../lib/fetch";

const ModifyInscriptionPage = () => {
  const { id } = useParams();
  const [inscription, setInscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchInscription = async () => {
        try {
          const response = await fetchWithInternalToken(`/api/inscriptions/${id}`);
          const data = await response.json();
          setInscription(data);
        } catch (error) {
          console.error("Error fetching inscription:", error);
        }
        setLoading(false);
      };
      fetchInscription();
    }
  }, [id]);

  const handleUpdate = (updatedInscription) => {
    setInscription(updatedInscription);
  };

  if (loading) {
    return <Loading />;
  }

  if (!inscription) {
    return <div>Inscription not found</div>;
  }

  return (
    <ModifyInscription
      inscription={inscription}
      onUpdate={handleUpdate}
      siteId={inscription.site_id}
    />
  );
};

export default ModifyInscriptionPage;
