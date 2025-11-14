"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import img from "../../assets/images/elephanta_slide.png";
import Header from "../component/Header";
import Footer from "../component/Footer";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import ImageModal from "../component/ImageModal";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import AIFloatingButton from "../component/AIFloatingButton";
import Link from "next/link";

const Breadcrumb = ({ siteName, inscriptionId, onBack }) => {
  return (
    <div className="flex items-center text-sm text-gray-500 mb-4">
      <button
        onClick={onBack}
        className="hover:text-green-700 text-green-900 font-semibold cursor-pointer"
      >
        {siteName}
      </button>
      {inscriptionId && (
        <>
          <span className="mx-2">&gt;</span>
          <span className="font-semibold cursor-pointer text-gray-400">
            {inscriptionId}
          </span>
        </>
      )}
    </div>
  );
};

const InscriptionDetail = ({ inscription, siteName, onBack, onImageClick }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [language, setLanguage] = useState("en");
  const [translatedDescription, setTranslatedDescription] = useState({
    en: inscription.discription,
    mr: "भाषांतर चालू आहे...",
  });
  const nextImage = () => {
    if (currentImage < inscription.image_urls.length - 1) {
      setCurrentImage(currentImage + 1);
    }
  };

  const prevImage = () => {
    if (currentImage > 0) {
      setCurrentImage(currentImage - 1);
    }
  };
  async function translateToMarathi(text) {
    if (!text || typeof text !== "string") {
      return "⚠️ अवैध मजकूर.";
    }

    try {
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=mr&dt=t&q=${encodeURIComponent(
          text
        )}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      // data[0] contains translation segments
      const translatedText = data?.[0]?.map((item) => item[0]).join(" ");

      return translatedText || "⚠️ भाषांतर उपलब्ध नाही.";
    } catch (error) {
      console.error("Google Translation Error:", error);
      return "⚠️ भाषांतर करण्यात अडचण आली.";
    }
  }

  useEffect(() => {
    const runTranslation = async () => {
      if (inscription?.discription) {
        const marathiText = await translateToMarathi(inscription.discription);
        setTranslatedDescription({
          en: inscription.discription,
          mr: marathiText,
        });
      }
    };
    runTranslation();
  }, [inscription]);

  if (!inscription) return null;

  return (
    <div>
      <Breadcrumb
        siteName={siteName}
        inscriptionId={inscription.Inscription_id}
        onBack={onBack}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="relative order-1">
          <div className="overflow-hidden rounded-lg">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentImage * 100}%)` }}
            >
              {inscription.image_urls.map((url, index) => (
                <div
                  key={index}
                  className="w-full shrink-0"
                  onClick={() => onImageClick(url)}
                >
                  <img
                    src={url}
                    alt={`Inscription image ${index + 1}`}
                    className="w-full h-64 sm:h-80 md:h-96 object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 flex justify-between w-full px-4">
            <button
              onClick={prevImage}
              disabled={currentImage === 0}
              className="bg-black/50 text-white p-2 rounded-full disabled:opacity-50"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={nextImage}
              disabled={currentImage === inscription.image_urls.length - 1}
              className="bg-black/50 text-white p-2 rounded-full disabled:opacity-50"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
        <div className="order-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold">
              {inscription.Inscription_id
                ? `Inscription ${
                    inscription.Inscription_id.split("_")[1] || ""
                  }`
                : "Unnamed Inscription"}
            </h2>

            <div className="flex gap-2">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded-full cursor-pointer  text-sm font-medium ${
                  language === "en"
                    ? "bg-linear-to-br from-green-600 to-green-900 text-white"
                    : "border-green-900 border text-green-800"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage("mr")}
                className={`px-3 py-1  rounded-full cursor-pointer text-sm font-medium ${
                  language === "mr"
                    ? "bg-linear-to-br from-green-600 to-green-900 text-white"
                    : "border-green-900 border text-green-800"
                }`}
              >
                Marathi
              </button>
            </div>
          </div>
          <p className="text-lg text-justify">
            {translatedDescription[language]}
          </p>
          <div className="mt-8">
            <h3 className="text-2xl font-bold">Details</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Original Script:</p>
                <p>{inscription.original_script}</p>
              </div>
              <div>
                <p className="font-semibold">Language Detected:</p>
                <p>{inscription.language_detected}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CaveClient({ site }) {
  const { user } = useAuth();
  const [current, setCurrent] = useState(0);
  const [inscriptionCurrent, setInscriptionCurrent] = useState(0);
  const [selectedInscription, setSelectedInscription] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [isInscriptionModalOpen, setIsInscriptionModalOpen] = useState(false);
  const [selectedInscriptionImage, setSelectedInscriptionImage] =
    useState(null);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleImageClick = (img) => {
    setSelectedImage(img);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const handleNextImage = () => {
    const currentIndex = site.Gallary?.findIndex(
      (img) => img === selectedImage
    );
    if (currentIndex < site.Gallary.length - 1) {
      setSelectedImage(site.Gallary[currentIndex + 1]);
    }
  };

  const handlePrevImage = () => {
    const currentIndex = site.Gallary?.findIndex(
      (img) => img === selectedImage
    );
    if (currentIndex > 0) {
      setSelectedImage(site.Gallary[currentIndex - 1]);
    }
  };

  const handleInscriptionImageClick = (img) => {
    setSelectedInscriptionImage(img);
    setIsInscriptionModalOpen(true);
  };

  const handleCloseInscriptionModal = () => {
    setIsInscriptionModalOpen(false);
    setSelectedInscriptionImage(null);
  };

  const handleNextInscriptionImage = () => {
    const inscription = site.Inscriptions.find(
      (i) => i.Inscription_id === selectedInscription
    );
    const currentIndex = inscription.image_urls.findIndex(
      (img) => img === selectedInscriptionImage
    );
    if (currentIndex < inscription.image_urls.length - 1) {
      setSelectedInscriptionImage(inscription.image_urls[currentIndex + 1]);
    }
  };

  const handlePrevInscriptionImage = () => {
    const inscription = site.Inscriptions.find(
      (i) => i.Inscription_id === selectedInscription
    );
    const currentIndex = inscription.image_urls.findIndex(
      (img) => img === selectedInscriptionImage
    );
    if (currentIndex > 0) {
      setSelectedInscriptionImage(inscription.image_urls[currentIndex - 1]);
    }
  };

  const nextSlide = () => {
    if (site.Gallary && current < site.Gallary.length - 3) {
      setCurrent(current + 1);
    }
  };

  const prevSlide = () => {
    if (current > 0) {
      setCurrent(current - 1);
    }
  };

  const nextInscription = () => {
    if (
      site.Inscriptions &&
      inscriptionCurrent < site.Inscriptions.length - 3
    ) {
      setInscriptionCurrent(inscriptionCurrent + 1);
    }
  };

  const prevInscription = () => {
    if (inscriptionCurrent > 0) {
      setInscriptionCurrent(inscriptionCurrent - 1);
    }
  };

  const handleInscriptionClick = (inscriptionId) => {
    if (user) {
      setSelectedInscription(inscriptionId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className=" w-full h-full text-black bg-green-50">
      <div className="">
        <Header theme="dark" />
      </div>
      <div className="relative w-screen h-[50vh] sm:h-[70vh] lg:h-[85vh]">
        <Image
          src={site.Gallary && site.Gallary.length > 0 ? site.Gallary[0] : img}
          alt={site.site_name || "Cave Image"}
          fill
          className="object-cover rounded-b-3xl sm:rounded-b-[155px]"
        />
        <div className="w-full h-full z-10 absolute top-0 right-0 bg-black/40 rounded-b-3xl sm:rounded-b-[155px]"></div>
        <div className="w-full h-full z-20 absolute top-0 right-0 flex justify-center items-center px-4">
          <h1
            className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-extrabold text-stroke text-center uppercase"
            style={{ fontfamily: "Inter" }}
          >
            {site.site_name}
          </h1>
        </div>
      </div>
      <div className="mt-16 sm:mt-20 mx-4 sm:mx-10 md:mx-28">
        {selectedInscription ? (
          <InscriptionDetail
            inscription={site.Inscriptions.find(
              (i) => i.Inscription_id === selectedInscription
            )}
            siteName={site.site_name}
            onBack={() => setSelectedInscription(null)}
            onImageClick={handleInscriptionImageClick}
          />
        ) : (
          <>
            <div>
              <p className="text-2xl sm:text-3xl font-bold">
                Explore {site.site_name} Gallery
              </p>
              <div className="mt-4">
                {isClient && (
                  <div className="overflow-hidden">
                    <div
                      className="flex transition-transform duration-700 ease-in-out"
                      style={{
                        transform: `translateX(-${current * 100}%)`,
                      }}
                    >
                      {site.Gallary && site.Gallary.length > 0 ? (
                        site.Gallary.map((inscript, index) => (
                          <div
                            key={index}
                            className="w-full md:w-1/2 lg:w-1/3 shrink-0 p-2 cursor-pointer"
                            onClick={() =>
                              handleImageClick(site.Gallary[index])
                            }
                          >
                            <img
                              src={site.Gallary[index]}
                              alt={`Gallery image ${index + 1}`}
                              className="w-full h-64 sm:h-80 object-cover rounded-2xl bg-gray-300"
                            />
                          </div>
                        ))
                      ) : (
                        <div className="w-full text-center font-extrabold text-5xl text-gray-400 py-10">
                          No inscriptions found at this location.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {site.Gallary && site.Gallary.length > 3 && (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={prevSlide}
                      disabled={current === 0}
                      className={`bg-transparent border px-6 p-2 rounded-full shadow-md cursor-pointer transition-all ease-in-out duration-700 ${
                        current === 0
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:border-lime-200 hover:bg-lime-200"
                      }`}
                    >
                      <ChevronLeft />
                    </button>
                    <div className="relative group">
                      <button
                        onClick={nextSlide}
                        disabled={
                          !site.Gallary || current >= site.Gallary.length - 3
                        }
                        className={`bg-transparent border px-6 p-2 rounded-full shadow-md cursor-pointer transition-all ease-in-out duration-700 ${
                          !site.Gallary || current >= site.Gallary.length - 3
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:border-lime-200 hover:bg-lime-200"
                        }`}
                      >
                        <ChevronRight />
                      </button>
                      {(!site.Inscriptions ||
                        current >= site.Gallary.length - 3) && (
                        <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          Gallery end
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-10">
              <p className="text-2xl sm:text-3xl font-bold">Info.</p>
              <div className="mt-6 text-lg text-justify flex flex-col gap-8">
                {site.Site_discription}
              </div>
            </div>
            <div className="mt-20 relative ">
              <div>
                <p className="text-2xl sm:text-3xl font-bold">
                  Inscriptions at {site.site_name}
                </p>
                <div className="mt-4">
                  {isClient && (
                    <div className="overflow-hidden">
                      <div
                        className="flex transition-transform duration-700 ease-in-out"
                        style={{
                          transform: `translateX(-${
                            inscriptionCurrent * 33.33
                          }%)`,
                        }}
                      >
                        {site.Inscriptions && site.Inscriptions.length > 0 ? (
                          site.Inscriptions.map((inscript, index) => (
                            <div
                              key={index}
                              className="w-full md:w-1/2 lg:w-1/3 shrink-0 p-2 cursor-pointer"
                              onClick={() =>
                                handleInscriptionClick(inscript.Inscription_id)
                              }
                            >
                              <img
                                src={inscript?.image_urls?.[0]}
                                alt={`Inscription ${index + 1}`}
                                className="w-full h-80 object-cover rounded-2xl bg-gray-300"
                              />
                            </div>
                          ))
                        ) : (
                          <div className="w-full text-center font-extrabold text-5xl text-gray-400 py-10">
                            No inscriptions found at this location.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {site.Inscriptions && site.Inscriptions.length > 0 && (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={prevInscription}
                        disabled={inscriptionCurrent === 0}
                        className={`bg-transparent border px-6 p-2 rounded-full shadow-md cursor-pointer transition-all ease-in-out duration-700 ${
                          inscriptionCurrent === 0
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:border-lime-200 hover:bg-lime-200"
                        }`}
                      >
                        <ChevronLeft />
                      </button>
                      <div className="relative group">
                        <button
                          onClick={nextInscription}
                          disabled={
                            !site.Inscriptions ||
                            inscriptionCurrent >= site.Inscriptions.length - 3
                          }
                          className={`bg-transparent border px-6 p-2 rounded-full shadow-md cursor-pointer transition-all ease-in-out duration-700 ${
                            !site.Inscriptions ||
                            inscriptionCurrent >= site.Inscriptions.length - 3
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:border-lime-200 hover:bg-lime-200"
                          }`}
                        >
                          <ChevronRight />
                        </button>
                        {(!site.Inscriptions ||
                          inscriptionCurrent >=
                            site.Inscriptions.length - 3) && (
                          <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            Inscriptions end
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl mt-10 font-bold">
                  Historical Context
                </p>
                <div className="mt-4 ml-2 sm:ml-8 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-base font-black ">
                    Period.{" "}
                    <span className="text-green-800">{site.period}</span>
                  </div>
                  <div className="flex items-center gap-2 text-base font-black ">
                    Ruler or Dynasty.{" "}
                    <span className="text-green-800">
                      {site.historical_context.ruler_or_dynasty}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-base font-black ">
                    Approximated Date.{" "}
                    <span className="text-green-800">
                      {site.historical_context.approx_date}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-base font-black ">
                    Related Figure.{" "}
                    <div className="flex flex-wrap gap-2 items-center text-green-800">
                      {site.historical_context?.related_figures &&
                      site.historical_context.related_figures.length > 0 ? (
                        site.historical_context.related_figures.map(
                          (fig, idx) => (
                            <div
                              key={idx}
                              className="px-3 py-1 bg-green-200 border border-green-800/10 rounded-full"
                            >
                              {fig}
                            </div>
                          )
                        )
                      ) : (
                        <div className="text-gray-500 italic">
                          No related figures
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 text-base font-black ">
                    <p className="w-full sm:w-[18%] shrink-0">
                      Cultural Significance.
                    </p>
                    <span className="text-green-800">
                      {site.historical_context.cultural_significance}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-10 text-green-800">
                <p className="text-2xl sm:text-3xl font-bold">
                  Verification Authority
                </p>
                <div className="mt-4 text-lg">
                  {site.verification_authority?.curated_by &&
                  site.verification_authority?.curated_by.length > 0 ? (
                    <ul className="  ">
                      {site.verification_authority?.curated_by.map(
                        (ref, index) => (
                          <li className="mb-2">{ref}</li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">
                      No references available.
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-10 text-green-800">
                <p className="text-2xl sm:text-3xl font-bold">Source</p>
                <div className="mt-4 text-lg">
                  {site.references && site.references.length > 0 ? (
                    <ul className=" text-green-800">
                      {site.references.map((ref, index) => (
                        <Link
                          href={ref.url}
                          className="hover:text-green-800"
                          key={index}
                        >
                          <li className="mb-2 ">
                            {ref.title} — {ref.author}, {ref.year}
                          </li>
                        </Link>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">
                      No references available.
                    </p>
                  )}
                </div>
              </div>
              {!user && (
                <div className="w-full h-full absolute top-1/6 flex rounded-t-[10%] justify-center items-start right-0 bg-linear-to-b from-green-50/70 via-green-50/100 z-20 to-green-50/100">
                  <div className="group relative">
                    <button
                      className="-mt-6 text-2xl font-bold border-green-600 hover:border-t-4 hover:border-b-0 cursor-pointer transition-all ease-in-out duration-500  bg-[#a5fc72] px-20 rounded-full border-b-6 py-4"
                      onClick={() => router.push("/login")}
                    >
                      Read More
                    </button>

                    <span
                      className="absolute top-[125%] left-1/2 -translate-x-1/2 min-w-72 z-999 bg-green-900 text-white text-center 
               rounded-lg py-2 opacity-0 group-hover:opacity-100 group-hover:visible invisible 
               transition-opacity duration-700  
               after:content-[''] after:absolute after:-top-2.5 after:left-1/2 after:-translate-x-1/2 
               after:border-[6px] after:border-solid 
               after:border-t-transparent after:border-x-transparent border-b-6  border-b-green-600 after:border-b-green-900"
                    >
                      Please log in to continue.
                      <br /> Click to go to the login page.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <div className="h-96 w-screen"></div>
      <div>
        <Footer />
      </div>
      {isModalOpen && (
        <ImageModal
          images={site.Gallary}
          selectedImage={selectedImage}
          onClose={handleCloseModal}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
        />
      )}
      {isInscriptionModalOpen && (
        <ImageModal
          images={
            site.Inscriptions.find(
              (i) => i.Inscription_id === selectedInscription
            )?.image_urls
          }
          selectedImage={selectedInscriptionImage}
          onClose={handleCloseInscriptionModal}
          onNext={handleNextInscriptionImage}
          onPrev={handlePrevInscriptionImage}
        />
      )}
      <AIFloatingButton />
    </div>
  );
}
