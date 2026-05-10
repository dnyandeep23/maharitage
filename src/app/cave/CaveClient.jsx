"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "../component/Header";
import Footer from "../component/Footer";
import ImageModal from "../component/ImageModal";
import AIFloatingButton from "../component/AIFloatingButton";
import { useAuth } from "../../contexts/AuthContext";
import { fetchWithInternalToken } from "../../lib/fetch";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  CalendarDays,
  Castle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gem,
  Image as ImageIcon,
  Landmark,
  Languages,
  MapPin,
  Milestone,
  ScrollText,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import "../fonts.css";

const FIELD_LABELS = {
  approx_date: "Approximate Date",
  cultural_significance: "Cultural Significance",
  defensive_design: "Defensive Design",
  event_name: "Event",
  original_script: "Original Script",
  related_figures: "Related Figures",
  ruler_or_dynasty: "Ruler or Dynasty",
};

const IMPORTANT_KEYS = new Set([
  "name",
  "title",
  "id",
  "description",
  "details",
  "images",
  "image_urls",
]);

const IMAGE_KEYS = new Set(["image", "image_url", "image_urls", "images"]);

const revealMotion = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

const slideMotion = {
  hidden: { opacity: 0, x: -28 },
  show: { opacity: 1, x: 0 },
};

const normalizeType = (value) => String(value || "").trim().toLowerCase();

const titleize = (value = "") =>
  String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const labelFor = (key) => FIELD_LABELS[key] || titleize(key);

const getSiteDescription = (site) =>
  site?.site_description || site?.site_discription || site?.description || "";

const getInscriptionId = (inscription) =>
  inscription?.inscription_id || inscription?.Inscription_id || inscription?.Inscription_Id || "";

const getInscriptionDescription = (inscription) =>
  inscription?.description || inscription?.discription || inscription?.Discription || "";

const getHeroImage = (site, gallery) =>
  site?.banner_image ||
  site?.banner_url ||
  site?.hero_image ||
  site?.hero_url ||
  site?.cover_image ||
  site?.cover_url ||
  site?.thumbnail ||
  gallery?.[0] ||
  "";

const asArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
};

const isImageKey = (key = "") => IMAGE_KEYS.has(key);

const isImageUrl = (value) =>
  typeof value === "string" &&
  (/^https?:\/\//i.test(value) || /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i.test(value));

const collectImageUrls = (value) => {
  if (!value) return [];
  if (isImageUrl(value)) return [value];
  if (Array.isArray(value)) return value.flatMap(collectImageUrls);
  if (typeof value === "object") {
    return Object.entries(value).flatMap(([key, nestedValue]) =>
      isImageKey(key) ? collectImageUrls(nestedValue) : []
    );
  }
  return [];
};

const formatObjectValue = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return Object.entries(value)
    .filter(([key, item]) => !isImageKey(key) && item !== null && item !== undefined && item !== "")
    .map(([key, item]) => {
      const readable = Array.isArray(item)
        ? item.filter(Boolean).join(", ")
        : typeof item === "object"
          ? formatObjectValue(item)
          : String(item);
      return readable ? `${labelFor(key)}: ${readable}` : null;
    })
    .filter(Boolean)
    .join(" · ");
};

const renderPrimitive = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value === "object") return formatObjectValue(value);
  return String(value);
};

const MotionSection = ({ children, className = "" }) => (
  <motion.section
    variants={revealMotion}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.18 }}
    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.section>
);

const LoadingImage = ({
  className = "",
  imgClassName = "",
  loading = "lazy",
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`relative overflow-hidden bg-stone-200 ${className}`}
    >
      {/* Smooth skeleton without flash */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 transition-opacity duration-700 ${
          loaded
            ? "pointer-events-none opacity-0"
            : "animate-pulse opacity-100"
        }`}
      />

      <img
        {...props}
        loading={loading}
        decoding="async"
        ref={(node) => {
          if (node?.complete && !loaded) setLoaded(true);
        }}
        onLoad={(event) => {
          setLoaded(true);
          props.onLoad?.(event);
        }}
        onError={(event) => {
          setLoaded(true);
          props.onError?.(event);
        }}
        className={`h-full w-full object-cover will-change-transform transition-[opacity,transform] duration-700 ease-out ${
          loaded
            ? "opacity-100 scale-100"
            : "opacity-0 scale-[1.01]"
        } ${imgClassName}`}
      />
    </div>
  );
};
const SectionHeader = ({ eyebrow, title, description, icon: Icon }) => (
  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="max-w-3xl">
      {eyebrow && (
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-stone-500">
          {Icon && <Icon className="h-4 w-4" />}
          <span>{eyebrow}</span>
        </div>
      )}
      <h2 className="font-cinzel-decorative text-3xl font-bold text-stone-950 sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">{description}</p>
      )}
    </div>
  </div>
);

const EmptyState = ({ children }) => (
  <div className="museum-card-premium px-5 py-10 text-center text-stone-500 sm:px-6 sm:py-12">
    {children}
  </div>
);

const NarrativeText = ({ children, tone = "cave" }) => {
  if (!children) return null;

  return (
    <div
      className={`museum-card-premium p-5 sm:p-8 ${
        tone === "fort"
          ? "text-stone-800"
          : "text-stone-800"
      }`}
    >
      <p className="max-w-none text-base leading-8 text-left sm:text-lg sm:leading-9 sm:text-justify sm:first-letter:float-left sm:first-letter:mr-3 sm:first-letter:font-cinzel-decorative sm:first-letter:text-6xl sm:first-letter:font-bold sm:first-letter:leading-[0.85] sm:first-letter:text-stone-900">
        {children}
      </p>
    </div>
  );
};

const DataPill = ({ icon: Icon, label, value, tone = "cave" }) => {
  const content = renderPrimitive(value);
  if (!content) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
        tone === "fort"
          ? "border-amber-200 bg-amber-50/80"
          : "border-[#d8c7a8] bg-[#f7f0e4]/80"
      }`}
    >
      {Icon && <Icon className={`mt-0.5 h-5 w-5 ${tone === "fort" ? "text-amber-800" : "text-[#566044]"}`} />}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{label}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-stone-900">{content}</p>
      </div>
    </div>
  );
};

const IconButton = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-300/70 bg-white/90 text-stone-900 shadow-sm backdrop-blur transition hover:bg-stone-950 hover:text-white disabled:pointer-events-none disabled:opacity-40 ${className}`}
  >
    {children}
  </button>
);

const Hero = ({ site, gallery, isFort }) => {
  const heroImage = getHeroImage(site, gallery);
  const typeLabel = isFort ? "Fort Archive" : "Cave Archive";
  const secondaryCount = isFort
    ? Object.keys(site.architectural_features || {}).length
    : asArray(site.inscriptions).length;
  const toneClasses = isFort
    ? "from-stone-950/72 via-stone-950/26 to-amber-950/8"
    : "from-stone-950/70 via-stone-950/24 to-emerald-950/10";
  const heroObjectPosition = isFort ? "object-[center_48%]" : "object-[center_36%]";

  return (
   <section className="relative min-h-[100svh] overflow-hidden bg-stone-950 text-white">
  {/* Background Image Layer */}
  {heroImage ? (
    <div className="absolute inset-0 z-0">
      <LoadingImage
        src={heroImage}
        alt={site.site_name || "Heritage site"}
        loading="eager"
        fetchPriority="high"
        className="h-full w-full"
        imgClassName={`${heroObjectPosition} h-full w-full object-cover scale-[1.03] saturate-[1.05] contrast-[1.02] brightness-[0.82]`}
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    </div>
  ) : (
    <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_30%_15%,#57534e,transparent_36%),linear-gradient(135deg,#1c1917,#292524)]" />
  )}

  {/* Cinematic Overlay Stack */}
  <div className="absolute inset-0 z-[1] bg-gradient-to-br from-stone-950/62 via-stone-950/24 to-black/44" />

  {/* Left cinematic readability gradient */}
  <div className="absolute inset-0 z-[2] bg-gradient-to-r from-black/65 via-black/20 to-transparent" />

  {/* Top atmospheric fade */}
  <div className="absolute inset-x-0 top-0 z-[2] h-44 bg-gradient-to-b from-black/45 via-black/10 to-transparent" />

  {/* Bottom transition blend */}
  <div className="absolute inset-x-0 bottom-0 z-[2] h-52 bg-gradient-to-t from-[#F8F3EA] via-[#f7f3ea]/40 to-transparent" />

  {/* Subtle vignette for cinematic depth */}
  {/* <div className="absolute inset-0 z-[2] bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.32)_100%)]" /> */}

  {/* Main Content */}
  <div className="relative z-20 flex min-h-[100svh] items-center px-5 pb-24 pt-36 sm:px-10 sm:pt-40 lg:px-16">
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.12 } } }}
      className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center"
    >
      {/* Left Content */}
      <div className="max-w-5xl">
        <motion.div
          variants={slideMotion}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-white/85 backdrop-blur-md"
        >
          {isFort ? (
            <Shield className="h-4 w-4" />
          ) : (
            <ScrollText className="h-4 w-4" />
          )}
          {typeLabel}
        </motion.div>

        <motion.h1
          variants={slideMotion}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl text-balance font-cinzel-decorative text-4xl font-extrabold leading-[0.98] tracking-normal text-white min-[380px]:text-5xl sm:text-7xl lg:text-8xl"
          style={{
            textShadow:
              "0 8px 30px rgba(0,0,0,0.55), 0 2px 10px rgba(0,0,0,0.35)",
          }}
        >
          {site.site_name}
        </motion.h1>

        <motion.div
          variants={revealMotion}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 flex max-w-4xl flex-wrap gap-3"
        >
          <DataPill
            icon={MapPin}
            label="Location"
            value={site.location}
            tone={isFort ? "fort" : "cave"}
          />

          <DataPill
            icon={CalendarDays}
            label="Period"
            value={site.period}
            tone={isFort ? "fort" : "cave"}
          />
        </motion.div>
      </div>

      {/* Summary Card */}
      <motion.div
        variants={revealMotion}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="museum-dark-panel p-5 text-white"
      >
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/65">
          Record Summary
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-inner">
            <p className="text-3xl font-bold">{gallery.length}</p>
            <p className="mt-1 text-sm text-white/70">
              Gallery assets
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-inner">
            <p className="text-3xl font-bold">{secondaryCount}</p>
            <p className="mt-1 text-sm text-white/70">
              {isFort
                ? "Architecture sections"
                : "Inscriptions"}
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-white/75">
          {isFort
            ? "A strategic architectural record rendered from the live heritage dataset."
            : "An archaeological site record rendered from the live heritage dataset."}
        </p>
      </motion.div>
    </motion.div>
  </div>
</section>
  );
};

const GallerySection = ({ gallery, siteName, onImageClick }) => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const visibleCount = Math.min(gallery.length, 3);
  const maxIndex = Math.max(gallery.length - visibleCount, 0);

  useEffect(() => {
    setIndex((value) => Math.min(value, maxIndex));
  }, [maxIndex]);

  const visible = useMemo(
    () => gallery.slice(index, index + visibleCount),
    [gallery, index, visibleCount]
  );

  const canPrev = index > 0;
  const canNext = index < maxIndex;

  const handlePrev = () => {
    if (!canPrev) return;

    setDirection(-1);
    setIndex((value) => Math.max(value - 1, 0));
  };

  const handleNext = () => {
    if (!canNext) return;

    setDirection(1);
    setIndex((value) => Math.min(value + 1, maxIndex));
  };

  const cardTransition = {
    layout: {
      duration: 0.72,
      ease: [0.22, 1, 0.36, 1],
    },
    flexGrow: {
      duration: 0.72,
      ease: [0.22, 1, 0.36, 1],
    },
    opacity: {
      duration: 0.28,
      ease: "easeOut",
    },
  };

  return (
    <MotionSection>
      <SectionHeader
        eyebrow="Visual archive"
        title={`Gallery of ${siteName}`}
        description="Field photographs and archive visuals preserved with the site record."
        icon={ImageIcon}
      />

      {gallery.length ? (
        <>
          <div className="archive-scroll -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:hidden">
            {gallery.map((url, itemIndex) => (
              <button
                type="button"
                key={`${url}-mobile-${itemIndex}`}
                onClick={() => onImageClick(url)}
                className="touch-card premium-image-frame group relative h-[360px] w-[84vw] shrink-0 snap-center bg-stone-200 text-left"
              >
                <LoadingImage
                  src={url}
                  alt={`${siteName} gallery ${itemIndex + 1}`}
                  className="absolute inset-0 h-full w-full"
                  imgClassName="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-black/8 to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-full bg-white/92 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-stone-800 backdrop-blur-sm">
                  Plate {itemIndex + 1}
                </span>
              </button>
            ))}
          </div>
          {/* Gallery */}
          <div className="relative hidden overflow-hidden rounded-[2.35rem] sm:block">
            <motion.div
              layout
              className="flex h-[360px] gap-4 sm:h-[440px] sm:gap-5 lg:h-[520px]"
            >
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                {visible.map((url, itemIndex) => {
                  const isActive = itemIndex === 0;
                  const plateNumber = index + itemIndex + 1;

                  return (
                    <motion.button
                      type="button"
                      key={`${url}-${plateNumber}`}
                      onClick={() => onImageClick(url)}
                      layout
                      initial={{
                        x: direction > 0 ? 42 : -42,
                        opacity: 0,
                      }}
                      animate={{
                        x: 0,
                        opacity: 1,
                        flexGrow: isActive ? 1.75 : 1,
                      }}
                      exit={{
                        x: direction > 0 ? -42 : 42,
                        opacity: 0,
                      }}
                      transition={cardTransition}
                      whileHover={{
                        y: -4,
                      }}
                      className="group relative h-full min-w-0 basis-0 overflow-hidden rounded-[2.2rem] bg-stone-200 text-left shadow-[0_10px_40px_rgba(0,0,0,0.08)] will-change-[flex-grow,transform]"
                      style={{ flexShrink: 1 }}
                    >
                      {/* Image */}
                      <LoadingImage
                        src={url}
                        alt={`${siteName} gallery ${plateNumber}`}
                        className="absolute inset-0 h-full w-full"
                        imgClassName="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />

                      {/* Overlay */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-t transition-colors duration-500 ${
                          isActive
                            ? "from-black/58 via-black/8 to-transparent"
                            : "from-black/45 via-black/5 to-transparent"
                        }`}
                      />

                      {/* Active Highlight */}
                      <motion.div
                        aria-hidden="true"
                        initial={false}
                        animate={{ opacity: isActive ? 1 : 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="absolute inset-0 ring-1 ring-white/20"
                      />

                      {/* Plate Label */}
                      <motion.span
                        layout="position"
                        initial={false}
                        className="absolute bottom-4 left-4 rounded-full bg-white/92 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-stone-800 backdrop-blur-sm sm:bottom-5 sm:left-5 sm:px-4 sm:text-xs"
                      >
                        Plate {plateNumber}
                      </motion.span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Navigation */}
          {gallery.length > 3 && (
            <div className="mt-7 flex items-center justify-end gap-3">
              <IconButton
                onClick={handlePrev}
                disabled={!canPrev}
                aria-label="Previous gallery images"
              >
                <ChevronLeft className="h-5 w-5" />
              </IconButton>

              <IconButton
                onClick={handleNext}
                disabled={!canNext}
                aria-label="Next gallery images"
              >
                <ChevronRight className="h-5 w-5" />
              </IconButton>
            </div>
          )}
        </>
      ) : (
        <EmptyState>
          No gallery images found.
        </EmptyState>
      )}
    </MotionSection>
  );
};

const InscriptionCard = ({ inscription, index, onClick }) => {
  const inscriptionId = getInscriptionId(inscription);
  const description = getInscriptionDescription(inscription);
  const image = inscription?.image_urls?.[0];

  return (
    <button
      type="button"
      onClick={() => onClick(inscriptionId)}
      className="museum-card-premium group text-left transition hover:-translate-y-1"
    >
      <div className="relative h-64 overflow-hidden bg-stone-200">
        {image ? (
          <LoadingImage
            src={image}
            alt={inscriptionId || `Inscription ${index + 1}`}
            className="h-full w-full"
            imgClassName="transition duration-700 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400">
            <ScrollText className="h-10 w-10" />
          </div>
        )}
        <div className="absolute left-4 top-4 rounded-full bg-[#263a2d] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
          Inscription {index + 1}
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-bold text-stone-950">
          {inscriptionId || "Unnamed Inscription"}
        </h3>
        {description && (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{description}</p>
        )}
        <div className="mt-5 flex items-center gap-2 text-sm font-bold text-[#566044]">
          <BookOpen className="h-4 w-4" />
          Study record
        </div>
      </div>
    </button>
  );
};

const InscriptionsSection = ({ site, onInscriptionClick }) => {
  const inscriptions = asArray(site.inscriptions);

  return (
    <MotionSection>
      <SectionHeader
        eyebrow="Epigraphic record"
        title={`Inscriptions at ${site.site_name}`}
        description="Each entry is shown only when it exists in the dataset, preserving the archaeological reading flow."
        icon={ScrollText}
      />
      {inscriptions.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {inscriptions.map((inscription, index) => (
            <InscriptionCard
              key={getInscriptionId(inscription) || index}
              inscription={inscription}
              index={index}
              onClick={onInscriptionClick}
            />
          ))}
        </div>
      ) : (
        <EmptyState>No inscriptions found at this location.</EmptyState>
      )}
    </MotionSection>
  );
};

const FieldValue = ({ value }) => {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) {
    const nonImageItems = value.filter((item) => !isImageUrl(item));
    if (!nonImageItems.length) return null;

    return (
      <div className="flex flex-wrap gap-2">
        {nonImageItems.filter(Boolean).map((item, index) => (
          <span key={index} className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700">
            {renderPrimitive(item)}
          </span>
        ))}
      </div>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([key]) => !isImageKey(key));
    if (!entries.length) return null;

    return (
      <div className="space-y-3">
        {entries.map(([key, nestedValue]) => (
          <div key={key}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">{labelFor(key)}</p>
            <p className="mt-1 text-sm leading-6 text-stone-700">{renderPrimitive(nestedValue)}</p>
          </div>
        ))}
      </div>
    );
  }
  return <p className="text-base leading-7 text-stone-700">{value}</p>;
};

const FeatureCard = ({ title, value, onImageClick }) => {
  if (!value) return null;

  if (typeof value === "string") {
    return (
      <motion.article
        variants={revealMotion}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="museum-card-premium p-6"
      >
        <h3 className="flex items-center gap-2 text-xl font-bold text-stone-950">
          <Building2 className="h-5 w-5 text-amber-800" />
          {title}
        </h3>
        <p className="mt-4 text-base leading-8 text-stone-700 text-justify">{value}</p>
      </motion.article>
    );
  }

  if (Array.isArray(value)) {
    return (
      <motion.article
        variants={revealMotion}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="museum-card-premium p-6"
      >
        <h3 className="flex items-center gap-2 text-xl font-bold text-stone-950">
          <Building2 className="h-5 w-5 text-amber-800" />
          {title}
        </h3>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          {value.map((item, index) => {
            if (typeof item === "string") {
              return (
                <motion.div
                  key={index}
                  variants={revealMotion}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.04 }}
                  className="rounded-2xl border border-white/60 bg-[#fff9ed]/76 p-4 text-sm leading-6 text-stone-700"
                >
                  {item}
                </motion.div>
              );
            }
            if (!item || typeof item !== "object") return null;
            const itemTitle = item.name || item.title || item.id || `${title} ${index + 1}`;
            const itemDescription = item.description || item.details;
            const images = collectImageUrls(item);
            const extras = Object.entries(item).filter(([key]) => !IMPORTANT_KEYS.has(key));

            return (
              <motion.div
                key={index}
                variants={revealMotion}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.16 }}
                transition={{ duration: 0.55, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[1.5rem] border border-white/60 bg-[#fff9ed]/76 p-5"
              >
                <p className="font-bold text-stone-950">{itemTitle}</p>
                {itemDescription && <p className="mt-2 text-sm leading-6 text-stone-700">{itemDescription}</p>}
                {extras.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {extras.map(([key, nestedValue]) => (
                      <div key={key}>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">{labelFor(key)}</p>
                        <FieldValue value={nestedValue} />
                      </div>
                    ))}
                  </div>
                )}
                {images.length > 0 && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {images.slice(0, 4).map((url, imageIndex) => (
                      <button type="button" key={url} onClick={() => onImageClick(url)} className="group overflow-hidden rounded-2xl bg-stone-200 shadow-sm">
                        <LoadingImage
                          src={url}
                          alt={`${itemTitle} ${imageIndex + 1}`}
                          className="h-72 w-full"
                          imgClassName="transition duration-700 group-hover:scale-105"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.article>
    );
  }

  if (typeof value === "object") {
    const images = collectImageUrls(value);
    const entries = Object.entries(value).filter(([key]) => !isImageKey(key));

    return (
      <motion.article
        variants={revealMotion}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="museum-card-premium p-6"
      >
        <h3 className="flex items-center gap-2 text-xl font-bold text-stone-950">
          <Building2 className="h-5 w-5 text-amber-800" />
          {title}
        </h3>
        {entries.length > 0 && (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {entries.map(([key, nestedValue]) => (
            <div key={key} className="rounded-2xl border border-white/60 bg-[#fff9ed]/76 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">{labelFor(key)}</p>
              <div className="mt-2">
                <FieldValue value={nestedValue} />
              </div>
            </div>
            ))}
          </div>
        )}
        {images.length > 0 && (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {images.map((url, index) => (
              <button
                type="button"
                key={`${url}-${index}`}
                onClick={() => onImageClick(url)}
                className="group overflow-hidden rounded-[1.5rem] bg-stone-200 shadow-sm"
              >
                <LoadingImage
                  src={url}
                  alt={`${title} ${index + 1}`}
                  className="h-80 w-full lg:h-[420px]"
                  imgClassName="transition duration-700 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        )}
      </motion.article>
    );
  }

  return null;
};

const ChronologySection = ({ chronology }) => {
  const items = Array.isArray(chronology)
    ? chronology
    : Object.entries(chronology || {}).map(([key, value]) => ({
        dynasty: key,
        details: value,
      }));

  if (!items.length) return null;

  return (
    <MotionSection>
      <SectionHeader
        eyebrow="Sovereignty"
        title="Ruling Powers Chronology"
        description="Political control and dynastic layers as recorded in the dataset."
        icon={Castle}
      />
      <div className="relative space-y-5 before:absolute before:bottom-6 before:left-5 before:top-6 before:w-px before:bg-amber-300">
        {items.map((entry, index) => (
          <motion.article
            key={index}
            variants={slideMotion}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.24 }}
            transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="relative grid gap-4 pl-14 md:grid-cols-[220px_1fr]"
          >
            <div className="absolute left-0 top-2 flex h-10 w-10 items-center justify-center rounded-full border border-amber-300 bg-white text-amber-900 shadow-sm">
              <CrownIcon />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
                {entry.period || entry.year || `Phase ${index + 1}`}
              </p>
              {(entry.dynasty || entry.ruler || entry.name) && (
                <h3 className="mt-1 text-xl font-bold text-stone-950">
                  {entry.dynasty || entry.ruler || entry.name}
                </h3>
              )}
            </div>
            <div className="museum-card-premium p-5">
              <FieldValue value={entry.details || entry.description || entry} />
            </div>
          </motion.article>
        ))}
      </div>
    </MotionSection>
  );
};

const CrownIcon = () => <Gem className="h-4 w-4" />;

const HistoricalEventsSection = ({ events }) => {
  const items = Array.isArray(events)
    ? events
    : Object.entries(events || {}).map(([key, value]) => ({
        year: key,
        description: value,
      }));

  if (!items.length) return null;

  return (
    <MotionSection>
      <SectionHeader
        eyebrow="Campaigns and turning points"
        title="Historical Events"
        description="Strategic moments, battles, occupations, and recorded incidents from MongoDB."
        icon={Milestone}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((event, index) => (
          <motion.article
            key={index}
            variants={revealMotion}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.18 }}
            transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="museum-card-premium p-6"
          >
            {(event.year || event.period || event.date) && (
              <span className="inline-flex rounded-full bg-stone-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
                {event.year || event.period || event.date}
              </span>
            )}
            {(event.event_name || event.title || event.name) && (
              <h3 className="mt-4 text-xl font-bold text-stone-950">
                {event.event_name || event.title || event.name}
              </h3>
            )}
            <div className="mt-4">
              <FieldValue value={event.description || event.details || event} />
            </div>
          </motion.article>
        ))}
      </div>
    </MotionSection>
  );
};

const FortSections = ({ site, onImageClick }) => {
  const features = site.architectural_features;

  return (
    <div className="space-y-20">
      {features && Object.keys(features).length > 0 && (
        <MotionSection>
          <SectionHeader
            eyebrow="Architecture and defence"
            title={`Architectural Features of ${site.site_name}`}
            description="Fort pages replace inscriptions with architectural, strategic, and dynastic material from the same MongoDB record."
            icon={Landmark}
          />
          <div className="grid gap-5">
            {Object.entries(features).map(([key, value]) => (
              <FeatureCard key={key} title={labelFor(key)} value={value} onImageClick={onImageClick} />
            ))}
          </div>
        </MotionSection>
      )}
      <ChronologySection chronology={site.ruling_powers_chronology} />
      <HistoricalEventsSection events={site.historical_events} />
    </div>
  );
};

const HistoricalContextSection = ({ site, tone }) => {
  const context = site.historical_context || {};
  const figures = asArray(context.related_figures);

  return (
    <MotionSection>
      <SectionHeader
        eyebrow="Historical context"
        title="Context and Significance"
        description="Core chronology and cultural interpretation connected to the site."
        icon={FileText}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <DataPill icon={CalendarDays} label="Period" value={site.period} tone={tone} />
        <DataPill icon={Users} label="Ruler or Dynasty" value={context.ruler_or_dynasty} tone={tone} />
        <DataPill icon={Milestone} label="Approximate Date" value={context.approx_date} tone={tone} />
      </div>
      {figures.length > 0 && (
        <div className="museum-card-premium mt-5 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Related Figures</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {figures.map((figure, index) => (
              <span key={index} className="rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-800">
                {figure}
              </span>
            ))}
          </div>
        </div>
      )}
      {context.cultural_significance && (
        <div className="museum-card-premium mt-5 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Cultural Significance</p>
          <p className="mt-4 text-base leading-8 text-stone-700 text-justify">{context.cultural_significance}</p>
        </div>
      )}
    </MotionSection>
  );
};

const SourcesSection = ({ site, tone }) => {
  const curatedBy = asArray(site.verification_authority?.curated_by);
  const references = asArray(site.references);

  return (
    <MotionSection>
      <SectionHeader
        eyebrow="Scholarly apparatus"
        title="Authority and Sources"
        description="Curation and bibliographic details attached to the record."
        icon={BookOpen}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="museum-card-premium p-6">
          <h3 className="text-xl font-bold text-stone-950">Verification Authority</h3>
          {curatedBy.length ? (
            <ul className="mt-5 space-y-3">
              {curatedBy.map((ref, index) => (
                <li key={index} className="flex gap-3 text-sm leading-6 text-stone-700">
                  <Sparkles className={`mt-1 h-4 w-4 shrink-0 ${tone === "fort" ? "text-amber-800" : "text-[#566044]"}`} />
                  {ref}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-stone-500">No references available.</p>
          )}
        </div>
        <div className="museum-card-premium p-6">
          <h3 className="text-xl font-bold text-stone-950">Sources</h3>
          {references.length ? (
            <ul className="mt-5 space-y-3">
              {references.map((ref, index) => {
                const content = `${ref.title || "Untitled source"}${ref.author ? `, ${ref.author}` : ""}${ref.year ? ` (${ref.year})` : ""}`;
                return (
                  <li key={index} className="text-sm leading-6 text-stone-700">
                    {ref.url ? (
                      <Link href={ref.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-stone-300 underline-offset-4 transition hover:text-stone-950">
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-5 text-stone-500">No references available.</p>
          )}
        </div>
      </div>
    </MotionSection>
  );
};

const LoginGate = ({ onLogin, tone }) => (
  <div className="museum-card-premium sticky bottom-6 z-20 mx-auto mt-10 max-w-3xl p-4">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-stone-500">Archive access</p>
        <p className="mt-1 text-base font-semibold text-stone-900">Log in to continue reading the full record.</p>
      </div>
      <button
        type="button"
        onClick={onLogin}
        className={`rounded-full px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 ${
          tone === "fort" ? "bg-amber-800 hover:bg-amber-900" : "bg-[#263a2d] hover:bg-[#101b15]"
        }`}
      >
        Read More
      </button>
    </div>
  </div>
);

const Breadcrumb = ({ siteName, inscriptionId, onBack }) => (
  <div className="mb-8 flex items-center gap-3 text-sm text-stone-500">
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-2 font-bold text-[#263a2d] transition hover:text-stone-950"
    >
      <ArrowLeft className="h-4 w-4" />
      {siteName}
    </button>
    {inscriptionId && (
      <>
        <span>/</span>
        <span className="font-semibold text-stone-700">{inscriptionId}</span>
      </>
    )}
  </div>
);

const InscriptionDetail = ({ inscription, siteName, onBack, onImageClick }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [language, setLanguage] = useState("en");
  const description = getInscriptionDescription(inscription);
  const images = asArray(inscription?.image_urls);
  const inscriptionId = getInscriptionId(inscription);
  const [translatedDescription, setTranslatedDescription] = useState({
    en: description,
    mr: "भाषांतर चालू आहे...",
  });

  useEffect(() => {
    setTranslatedDescription({ en: description, mr: "भाषांतर चालू आहे..." });

    const translateToMarathi = async (text) => {
      if (!text || typeof text !== "string") return "भाषांतरासाठी मजकूर उपलब्ध नाही.";

      try {
        const response = await fetchWithInternalToken(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=mr&dt=t&q=${encodeURIComponent(text)}`
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        return data?.[0]?.map((item) => item[0]).join(" ") || "भाषांतर उपलब्ध नाही.";
      } catch (error) {
        console.error("Google Translation Error:", error);
        return "भाषांतर करण्यात अडचण आली.";
      }
    };

    let isMounted = true;
    translateToMarathi(description).then((marathiText) => {
      if (isMounted) setTranslatedDescription({ en: description, mr: marathiText });
    });

    return () => {
      isMounted = false;
    };
  }, [description]);

  if (!inscription) return null;

  const canPrev = currentImage > 0;
  const canNext = currentImage < images.length - 1;

  return (
    <div>
      <Breadcrumb siteName={siteName} inscriptionId={inscriptionId} onBack={onBack} />
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="premium-image-frame relative bg-stone-200">
          {images.length ? (
            <button type="button" onClick={() => onImageClick(images[currentImage])} className="block h-full w-full">
              <LoadingImage
                src={images[currentImage]}
                alt={`${inscriptionId || "Inscription"} image ${currentImage + 1}`}
                className="h-[360px] w-full sm:h-[520px] lg:h-[620px]"
              />
            </button>
          ) : (
            <div className="flex h-[360px] items-center justify-center text-stone-400 sm:h-[520px] lg:h-[620px]">
              <ScrollText className="h-12 w-12" />
            </div>
          )}
          {images.length > 1 && (
            <div className="absolute inset-x-5 top-1/2 flex -translate-y-1/2 justify-between">
              <IconButton onClick={() => setCurrentImage((value) => Math.max(value - 1, 0))} disabled={!canPrev} aria-label="Previous inscription image">
                <ChevronLeft className="h-5 w-5" />
              </IconButton>
              <IconButton onClick={() => setCurrentImage((value) => Math.min(value + 1, images.length - 1))} disabled={!canNext} aria-label="Next inscription image">
                <ChevronRight className="h-5 w-5" />
              </IconButton>
            </div>
          )}
        </div>
        <article className="museum-card-premium p-5 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#566044]">Inscription dossier</p>
              <h2 className="mt-3 font-cinzel-decorative text-2xl font-bold text-stone-950 sm:text-4xl">
                {inscriptionId || "Unnamed Inscription"}
              </h2>
            </div>
            <div className="inline-flex rounded-full border border-stone-200 bg-stone-50 p-1">
              {["en", "mr"].map((code) => (
                <button
                  type="button"
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    language === code ? "bg-[#263a2d] text-white shadow-sm" : "text-stone-600 hover:text-stone-950"
                  }`}
                >
                  {code === "en" ? "English" : "Marathi"}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-6 text-base leading-8 text-stone-700 sm:mt-8 sm:text-lg sm:leading-9 sm:text-justify">
            {translatedDescription[language]}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <DataPill icon={ScrollText} label="Original Script" value={inscription.original_script} />
            <DataPill icon={Languages} label="Language Detected" value={inscription.language_detected} />
          </div>
        </article>
      </div>
    </div>
  );
};

export default function CaveClient({ site }) {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedInscription, setSelectedInscription] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isInscriptionModalOpen, setIsInscriptionModalOpen] = useState(false);
  const [selectedInscriptionImage, setSelectedInscriptionImage] = useState(null);

  const gallery = useMemo(() => asArray(site?.gallery || site?.gallary), [site]);
  const isFort = normalizeType(site?.h_type || site?.heritage_type).includes("fort");
  const tone = isFort ? "fort" : "cave";
  const description = getSiteDescription(site);
  const inscriptions = asArray(site?.inscriptions);
  const selectedInscriptionRecord = inscriptions.find(
    (inscription) => getInscriptionId(inscription) === selectedInscription
  );

  const handleImageClick = (img) => {
    setSelectedImage(img);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const handleNextImage = () => {
    const currentIndex = gallery.findIndex((image) => image === selectedImage);
    if (currentIndex < gallery.length - 1) setSelectedImage(gallery[currentIndex + 1]);
  };

  const handlePrevImage = () => {
    const currentIndex = gallery.findIndex((image) => image === selectedImage);
    if (currentIndex > 0) setSelectedImage(gallery[currentIndex - 1]);
  };

  const handleInscriptionImageClick = (img) => {
    setSelectedInscriptionImage(img);
    setIsInscriptionModalOpen(true);
  };

  const handleCloseInscriptionModal = () => {
    setIsInscriptionModalOpen(false);
    setSelectedInscriptionImage(null);
  };

  const selectedInscriptionImages = asArray(selectedInscriptionRecord?.image_urls);

  const handleNextInscriptionImage = () => {
    const currentIndex = selectedInscriptionImages.findIndex((img) => img === selectedInscriptionImage);
    if (currentIndex < selectedInscriptionImages.length - 1) {
      setSelectedInscriptionImage(selectedInscriptionImages[currentIndex + 1]);
    }
  };

  const handlePrevInscriptionImage = () => {
    const currentIndex = selectedInscriptionImages.findIndex((img) => img === selectedInscriptionImage);
    if (currentIndex > 0) {
      setSelectedInscriptionImage(selectedInscriptionImages[currentIndex - 1]);
    }
  };

  const handleInscriptionClick = (inscriptionId) => {
    if (!inscriptionId) return;
    if (user) {
      setSelectedInscription(inscriptionId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5efe3] text-stone-950">
      <Header theme="dark" />
      <Hero site={site} gallery={gallery} isFort={isFort} />

      <main className="mx-auto -mt-10 max-w-7xl px-3 pb-28 sm:px-10 sm:pb-20 lg:px-16">
        <div className="relative z-10 rounded-[1.5rem] border border-white/70 bg-[#f8f0e2]/88 p-4 shadow-[0_34px_110px_rgba(41,37,36,0.16)] backdrop-blur-2xl sm:rounded-[2.5rem] sm:p-8 lg:p-10">
          <AnimatePresence mode="wait">
            {selectedInscription ? (
              <motion.div
                key="inscription-detail"
                initial={{ opacity: 0, x: 36 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              >
                <InscriptionDetail
                  inscription={selectedInscriptionRecord}
                  siteName={site.site_name}
                  onBack={() => setSelectedInscription(null)}
                  onImageClick={handleInscriptionImageClick}
                />
              </motion.div>
            ) : (
              <motion.div
                key="site-detail"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-14 sm:space-y-20"
              >
                <GallerySection gallery={gallery} siteName={site.site_name} onImageClick={handleImageClick} />

                <MotionSection>
                  <SectionHeader
                    eyebrow={isFort ? "Strategic archive" : "Archaeological reading"}
                    title={isFort ? "Site Description" : "Historical Description"}
                    description={
                      isFort
                        ? "A fort record benefits from clear spatial hierarchy, defensive vocabulary, and architectural emphasis."
                        : "Long historical material is set for slower reading and scholarly inspection."
                    }
                    icon={isFort ? Shield : ScrollText}
                  />
                  <NarrativeText tone={tone}>{description}</NarrativeText>
                </MotionSection>

                {isFort ? (
                  <FortSections site={site} onImageClick={handleImageClick} />
                ) : (
                  <InscriptionsSection site={site} onInscriptionClick={handleInscriptionClick} />
                )}

                <HistoricalContextSection site={site} tone={tone} />
                <SourcesSection site={site} tone={tone} />

                {!user && <LoginGate tone={tone} onLogin={() => router.push("/login")} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />

      {isModalOpen && (
        <ImageModal
          images={gallery}
          selectedImage={selectedImage}
          onClose={handleCloseModal}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
        />
      )}
      {isInscriptionModalOpen && (
        <ImageModal
          images={selectedInscriptionImages}
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
