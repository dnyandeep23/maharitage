/**
 * Site-Agnostic Text Question Generator
 * 
 * Dynamically discovers ALL available fields from any MongoDB site document
 * and generates ~100 unique, grounded text MCQs.
 * Works for both cave sites (Aja, Ell, Kan, Ele, Pit) and
 * fort sites (Fort0001–Fort0005) without site-specific branching.
 * 
 * The LLM is NOT the source of truth. MongoDB is.
 * Every answer comes directly from a resolved MongoDB field.
 */

import { toCleanString, resolveField } from '../verification/mongodb_verifier.js';

// ─── Distractor pools by category ────────────────────────────────────────────

const DISTRACTOR_POOLS = {
  Location: {
    district: ["Pune", "Raigad", "Nashik", "Satara", "Kolhapur", "Thane", "Sindhudurg", "Ratnagiri", "Solapur"],
    state: ["Madhya Pradesh", "Gujarat", "Karnataka", "Rajasthan", "Tamil Nadu"],
    country: ["Nepal", "Sri Lanka", "Myanmar", "Pakistan"],
    region: ["Konkan", "Vidarbha", "Marathwada", "Western Ghats", "Desh"],
    terrain: ["Hill Fort", "Sea Fort", "Plateau", "Coastal Island", "River Valley", "Mountain Pass"]
  },
  Classification: [
    "Buddhist Rock-Cut Monastic Complex", "Hill Fort", "Sea Fort", "Cave Temple",
    "Island Fortress", "Plateau Fort", "Medieval Palace", "Ancient University",
    "Hindu Cave Temple", "Jain Rock-Cut Shrine"
  ],
  Chronology: [
    "2nd Century BCE – 480 CE", "5th–10th Century CE", "12th Century CE",
    "15th–17th Century CE", "17th Century CE", "1656–1674 CE",
    "3rd Century BCE", "8th Century CE", "19th Century CE", "1818 CE"
  ],
  "Historical Context": [
    "Vakataka Dynasty", "Rashtrakuta Dynasty", "Yadava Dynasty",
    "Maratha Empire", "Mughal Empire", "Chalukya Dynasty",
    "Satavahana Dynasty", "British East India Company",
    "Chhatrapati Shivaji Maharaj", "Emperor Ashoka",
    "King Harishena", "Aurangzeb", "Malik Ambar"
  ],
  "Cultural Significance": [
    "Coronation site of a major ruler", "UNESCO World Heritage Site",
    "Masterpiece of religious art", "Strategic military stronghold",
    "Ancient center of learning", "Trade route fortress"
  ],
  Geography: {
    elevation: ["820 meters", "1,056 meters", "1,356 meters", "2,100 meters", "48 meters", "150 meters"],
    general: ["Steep cliff face", "Coastal island", "River gorge", "Hilltop plateau", "Sea-level island"]
  },
  Epigraphy: [
    "Sanskrit in Brahmi script", "Prakrit", "Devanagari script", "Modi script",
    "Persian script", "Arabic script", "Tamil", "Kannada"
  ],
  Authority: [
    "Archaeological Survey of India", "UNESCO World Heritage Centre",
    "Maharashtra State Archaeology Department", "Indian Navy",
    "Forest Department of Maharashtra"
  ],
  "Historical Events": [
    "Coronation ceremony", "Siege and capture", "Treaty signing",
    "Fort construction", "Rediscovery by British officers",
    "Battle between rival kingdoms", "Royal succession"
  ]
};

/**
 * Pick N random distractors from a pool, excluding the correct answer.
 */
function pickDistractors(pool, correctAnswer, count = 3) {
  const correct = toCleanString(correctAnswer).toLowerCase().trim();
  let candidates;

  if (Array.isArray(pool)) {
    candidates = pool;
  } else if (typeof pool === "object") {
    candidates = Object.values(pool).flat();
  } else {
    candidates = [];
  }

  const filtered = candidates
    .map(c => toCleanString(c))
    .filter(c => c && c.toLowerCase().trim() !== correct);

  // Shuffle and pick
  const shuffled = [...new Set(filtered)].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Build a question candidate from a field path and value.
 */
function buildCandidate({ siteId, siteName, category, question, correctAnswer, fieldPath, fieldValue, seq }) {
  const cleanAnswer = toCleanString(correctAnswer);
  if (!cleanAnswer || cleanAnswer.length < 2) return null;

  // Determine distractor pool
  let pool = DISTRACTOR_POOLS[category] || DISTRACTOR_POOLS["Historical Context"];
  if (category === "Location" && fieldPath.includes("district")) pool = DISTRACTOR_POOLS.Location.district;
  else if (category === "Location" && fieldPath.includes("state")) pool = DISTRACTOR_POOLS.Location.state;
  else if (category === "Location" && fieldPath.includes("country")) pool = DISTRACTOR_POOLS.Location.country;
  else if (category === "Location" && fieldPath.includes("region")) pool = DISTRACTOR_POOLS.Location.region;
  else if (category === "Location" && fieldPath.includes("terrain")) pool = DISTRACTOR_POOLS.Location.terrain;
  else if (category === "Geography") pool = DISTRACTOR_POOLS.Geography.elevation;

  const distractors = pickDistractors(pool, cleanAnswer, 3);

  // Pad with generic fallbacks if needed
  const fallbacks = ["Not applicable", "Unknown", "Data unavailable", "None of the above", "Other"];
  let fbIdx = 0;
  while (distractors.length < 3 && fbIdx < fallbacks.length) {
    const fb = fallbacks[fbIdx++];
    if (fb.toLowerCase() !== cleanAnswer.toLowerCase() && !distractors.includes(fb)) {
      distractors.push(fb);
    }
  }

  const options = [cleanAnswer, ...distractors.slice(0, 3)];

  return {
    annotation_id: `${siteId}_text_${String(seq).padStart(3, "0")}`,
    site_id: siteId,
    site_name: siteName,
    question_type: "text",
    category,
    question,
    options,
    correct_option_index: 0, // Correct answer is always at index 0 before balancing
    source: {
      type: "mongodb",
      field: fieldPath,
      value: toCleanString(fieldValue)
    }
  };
}

// ─── Question templates by field path ────────────────────────────────────────

const FIELD_QUESTIONS = [
  // Location
  { field: "location.district", category: "Location", templates: [
    "In which district of Maharashtra is {site} located?",
    "Which district serves as the administrative region for {site}?",
    "{site} is situated in which district?"
  ]},
  { field: "location.state", category: "Location", templates: [
    "In which Indian state is {site} located?",
    "{site} is part of which state in India?"
  ]},
  { field: "location.country", category: "Location", templates: [
    "In which country is {site} located?"
  ]},
  { field: "location.region", category: "Location", templates: [
    "In which geographical region of Maharashtra is {site} situated?",
    "{site} falls under which region of Maharashtra?"
  ]},
  { field: "location.terrain", category: "Location", templates: [
    "What type of terrain or landform characterizes {site}?",
    "How is the terrain of {site} classified?"
  ]},
  { field: "location.latitude", category: "Location", templates: [
    "What is the approximate latitude of {site}?"
  ]},
  { field: "location.longitude", category: "Location", templates: [
    "What is the approximate longitude of {site}?"
  ]},

  // Classification
  { field: "heritage_type", category: "Classification", templates: [
    "What is the official heritage classification of {site}?",
    "{site} is classified as what type of heritage monument?",
    "What heritage category does {site} belong to?"
  ]},
  { field: "h_type", category: "Classification", templates: [
    "What broad monument category does {site} fall under?"
  ]},

  // Chronology
  { field: "period", category: "Chronology", templates: [
    "What historical period is associated with {site}?",
    "During which era was {site} primarily active?",
    "What time period defines the major phase of {site}?"
  ]},
  { field: "historical_context.approx_date", category: "Chronology", templates: [
    "What is the approximate date of major construction or activity at {site}?",
    "When was the major phase of development at {site}?"
  ]},

  // Historical Context
  { field: "historical_context.ruler_or_dynasty", category: "Historical Context", templates: [
    "Which ruler or dynasty is primarily associated with {site}?",
    "Under whose patronage did {site} flourish?",
    "Which dynasty played a central role in the history of {site}?"
  ]},
  { field: "historical_context.cultural_significance", category: "Cultural Significance", templates: [
    "What is the cultural significance of {site}?",
    "Why is {site} considered culturally important?"
  ]},
  { field: "historical_context.original_name", category: "Historical Context", templates: [
    "What was the original historical name of {site}?",
    "Before being renamed, {site} was known as what?"
  ]},
  { field: "historical_context.constructed_by", category: "Historical Context", templates: [
    "Who constructed or significantly rebuilt {site}?",
    "{site} was built or expanded by whom?"
  ]},
  { field: "historical_context.political_role", category: "Historical Context", templates: [
    "What political role did {site} serve in its era?",
    "Historically, {site} functioned as what kind of political center?"
  ]},

  // Fort-specific
  { field: "elevation.meters", category: "Geography", templates: [
    "What is the elevation of {site} in meters?",
    "At what height above sea level (in meters) does {site} stand?"
  ]},
  { field: "elevation.feet", category: "Geography", templates: [
    "What is the elevation of {site} in feet?"
  ]},

  // Authority
  { field: "verification_authority", category: "Authority", templates: [
    "Which national authority or organization protects and maintains {site}?",
    "Who is responsible for the curation and preservation of {site}?"
  ]}
];

/**
 * Generate questions from related_figures array.
 */
function generateRelatedFigureQuestions(siteDoc, siteId, siteName, seq) {
  const figures = siteDoc.historical_context?.related_figures;
  if (!Array.isArray(figures) || figures.length === 0) return { candidates: [], seq };

  const candidates = [];
  const figureStr = figures.join(", ");

  candidates.push(buildCandidate({
    siteId, siteName,
    category: "Historical Context",
    question: `Which historical or religious figures are associated with ${siteName}?`,
    correctAnswer: figureStr,
    fieldPath: "historical_context.related_figures",
    fieldValue: figureStr,
    seq: seq++
  }));

  // Individual figure questions
  for (const figure of figures.slice(0, 3)) {
    candidates.push(buildCandidate({
      siteId, siteName,
      category: "Historical Context",
      question: `Is ${figure} historically connected to ${siteName}?`,
      correctAnswer: `Yes, ${figure} is associated with ${siteName}`,
      fieldPath: "historical_context.related_figures",
      fieldValue: figure,
      seq: seq++
    }));
  }

  return { candidates: candidates.filter(Boolean), seq };
}

/**
 * Generate questions from ruling_powers_chronology (fort sites).
 */
function generateRulingPowerQuestions(siteDoc, siteId, siteName, seq) {
  const powers = siteDoc.ruling_powers_chronology;
  if (!Array.isArray(powers) || powers.length === 0) return { candidates: [], seq };

  const candidates = [];

  for (const entry of powers) {
    if (entry.power && entry.period) {
      candidates.push(buildCandidate({
        siteId, siteName,
        category: "Chronology",
        question: `During the period ${entry.period}, which power controlled ${siteName}?`,
        correctAnswer: entry.power,
        fieldPath: "ruling_powers_chronology",
        fieldValue: `${entry.power} (${entry.period})`,
        seq: seq++
      }));

      candidates.push(buildCandidate({
        siteId, siteName,
        category: "Chronology",
        question: `In which period did ${entry.power} control ${siteName}?`,
        correctAnswer: entry.period,
        fieldPath: "ruling_powers_chronology",
        fieldValue: `${entry.power} (${entry.period})`,
        seq: seq++
      }));
    }
  }

  return { candidates: candidates.filter(Boolean), seq };
}

/**
 * Generate questions from historical_events (fort sites).
 */
function generateHistoricalEventQuestions(siteDoc, siteId, siteName, seq) {
  const events = siteDoc.historical_events;
  if (!Array.isArray(events) || events.length === 0) return { candidates: [], seq };

  const candidates = [];

  for (const evt of events) {
    if (evt.event && evt.year) {
      candidates.push(buildCandidate({
        siteId, siteName,
        category: "Historical Events",
        question: `In which year did the event "${evt.event}" occur at ${siteName}?`,
        correctAnswer: evt.year,
        fieldPath: "historical_events",
        fieldValue: `${evt.event} (${evt.year})`,
        seq: seq++
      }));

      candidates.push(buildCandidate({
        siteId, siteName,
        category: "Historical Events",
        question: `What significant event happened at ${siteName} in ${evt.year}?`,
        correctAnswer: evt.event,
        fieldPath: "historical_events",
        fieldValue: `${evt.event} (${evt.year})`,
        seq: seq++
      }));

      if (evt.description) {
        candidates.push(buildCandidate({
          siteId, siteName,
          category: "Historical Events",
          question: `What is the description of the event "${evt.event}" at ${siteName}?`,
          correctAnswer: evt.description,
          fieldPath: "historical_events",
          fieldValue: evt.description,
          seq: seq++
        }));
      }
    }
  }

  return { candidates: candidates.filter(Boolean), seq };
}

/**
 * Generate questions from architectural_features (fort sites).
 */
function generateArchitecturalFeatureQuestions(siteDoc, siteId, siteName, seq) {
  const features = siteDoc.architectural_features;
  if (!features || typeof features !== "object") return { candidates: [], seq };

  const candidates = [];
  const featureTypes = ["entrances", "bastions", "water_management", "structures"];

  for (const fType of featureTypes) {
    const items = features[fType];
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      if (!item.name) continue;

      candidates.push(buildCandidate({
        siteId, siteName,
        category: "Architecture",
        question: `What is the name of the ${item.type || fType.replace(/_/g, " ")} at ${siteName} described as: "${(item.description || "").substring(0, 80)}..."?`,
        correctAnswer: item.name,
        fieldPath: `architectural_features.${fType}`,
        fieldValue: item.name,
        seq: seq++
      }));

      if (item.type) {
        candidates.push(buildCandidate({
          siteId, siteName,
          category: "Architecture",
          question: `What type of structure is ${item.name} at ${siteName}?`,
          correctAnswer: item.type,
          fieldPath: `architectural_features.${fType}`,
          fieldValue: item.type,
          seq: seq++
        }));
      }

      if (item.strategic_role) {
        candidates.push(buildCandidate({
          siteId, siteName,
          category: "Architecture",
          question: `What strategic role does ${item.name} serve at ${siteName}?`,
          correctAnswer: item.strategic_role,
          fieldPath: `architectural_features.${fType}`,
          fieldValue: item.strategic_role,
          seq: seq++
        }));
      }

      if (item.description) {
        candidates.push(buildCandidate({
          siteId, siteName,
          category: "Architecture",
          question: `How is ${item.name} at ${siteName} described?`,
          correctAnswer: item.description,
          fieldPath: `architectural_features.${fType}`,
          fieldValue: item.description,
          seq: seq++
        }));
      }

      if (item.period) {
        candidates.push(buildCandidate({
          siteId, siteName,
          category: "Chronology",
          question: `To which period does ${item.name} at ${siteName} date?`,
          correctAnswer: item.period,
          fieldPath: `architectural_features.${fType}`,
          fieldValue: item.period,
          seq: seq++
        }));
      }
    }
  }

  // Defensive design
  if (features.defensive_design) {
    const dd = features.defensive_design;
    if (dd.type) {
      candidates.push(buildCandidate({
        siteId, siteName,
        category: "Architecture",
        question: `What type of defensive design does ${siteName} employ?`,
        correctAnswer: dd.type,
        fieldPath: "architectural_features.defensive_design",
        fieldValue: dd.type,
        seq: seq++
      }));
    }
    if (dd.description) {
      candidates.push(buildCandidate({
        siteId, siteName,
        category: "Architecture",
        question: `How is the defensive design of ${siteName} described?`,
        correctAnswer: dd.description,
        fieldPath: "architectural_features.defensive_design",
        fieldValue: dd.description,
        seq: seq++
      }));
    }
  }

  return { candidates: candidates.filter(Boolean), seq };
}

/**
 * Generate questions from inscription metadata (text-based, not visual).
 */
function generateInscriptionTextQuestions(siteDoc, siteId, siteName, seq) {
  const inscriptions = Array.isArray(siteDoc.inscriptions) ? siteDoc.inscriptions : [];
  if (inscriptions.length === 0) return { candidates: [], seq };

  const candidates = [];

  candidates.push(buildCandidate({
    siteId, siteName,
    category: "Epigraphy",
    question: `How many documented inscriptions exist at ${siteName}?`,
    correctAnswer: `${inscriptions.length}`,
    fieldPath: "inscriptions.length",
    fieldValue: inscriptions.length,
    seq: seq++
  }));

  for (let i = 0; i < Math.min(inscriptions.length, 10); i++) {
    const insc = inscriptions[i];
    const inscLabel = insc.Inscription_id || `Inscription ${i + 1}`;

    if (insc.original_script) {
      candidates.push(buildCandidate({
        siteId, siteName,
        category: "Epigraphy",
        question: `What script is used in ${inscLabel} at ${siteName}?`,
        correctAnswer: insc.original_script,
        fieldPath: `inscriptions[${i}].original_script`,
        fieldValue: insc.original_script,
        seq: seq++
      }));
    }

    if (insc.language_detected) {
      candidates.push(buildCandidate({
        siteId, siteName,
        category: "Epigraphy",
        question: `What language is detected in ${inscLabel} at ${siteName}?`,
        correctAnswer: insc.language_detected,
        fieldPath: `inscriptions[${i}].language_detected`,
        fieldValue: insc.language_detected,
        seq: seq++
      }));
    }

    if (insc.translations?.english) {
      candidates.push(buildCandidate({
        siteId, siteName,
        category: "Epigraphy",
        question: `What is the English translation of ${inscLabel} at ${siteName}?`,
        correctAnswer: insc.translations.english,
        fieldPath: `inscriptions[${i}].translations.english`,
        fieldValue: insc.translations.english,
        seq: seq++
      }));
    }
  }

  return { candidates: candidates.filter(Boolean), seq };
}

// ─── Main Generator ─────────────────────────────────────────────────────────

/**
 * Generate text annotations for ANY heritage site document.
 * Returns { site_id, site_name, raw_count, annotations }.
 */
export function generateTextAnnotations(siteDoc) {
  if (!siteDoc || !siteDoc.site_id) {
    throw new Error("Invalid site document: missing site_id");
  }

  const siteId = toCleanString(siteDoc.site_id);
  const siteName = toCleanString(siteDoc.site_name, "Heritage Site");
  const candidates = [];
  let seq = 1;

  // 1. Generate from FIELD_QUESTIONS templates
  for (const fq of FIELD_QUESTIONS) {
    const value = resolveField(siteDoc, fq.field);
    if (value === undefined || value === null) continue;

    const cleanVal = toCleanString(value);
    if (!cleanVal || cleanVal.length < 2) continue;

    for (const template of fq.templates) {
      const question = template.replace(/\{site\}/g, siteName);
      const candidate = buildCandidate({
        siteId, siteName,
        category: fq.category,
        question,
        correctAnswer: value,
        fieldPath: fq.field,
        fieldValue: value,
        seq: seq++
      });
      if (candidate) candidates.push(candidate);
    }
  }

  // 2. Related figures (arrays)
  const rfResult = generateRelatedFigureQuestions(siteDoc, siteId, siteName, seq);
  candidates.push(...rfResult.candidates);
  seq = rfResult.seq;

  // 3. Ruling powers chronology (fort-specific)
  const rpResult = generateRulingPowerQuestions(siteDoc, siteId, siteName, seq);
  candidates.push(...rpResult.candidates);
  seq = rpResult.seq;

  // 4. Historical events (fort-specific)
  const heResult = generateHistoricalEventQuestions(siteDoc, siteId, siteName, seq);
  candidates.push(...heResult.candidates);
  seq = heResult.seq;

  // 5. Architectural features (fort-specific)
  const afResult = generateArchitecturalFeatureQuestions(siteDoc, siteId, siteName, seq);
  candidates.push(...afResult.candidates);
  seq = afResult.seq;

  // 6. Inscription text-based questions
  const itResult = generateInscriptionTextQuestions(siteDoc, siteId, siteName, seq);
  candidates.push(...itResult.candidates);
  seq = itResult.seq;

  // 7. Gallery count question
  const gallery = Array.isArray(siteDoc.gallary) ? siteDoc.gallary : (Array.isArray(siteDoc.gallery) ? siteDoc.gallery : []);
  if (gallery.length > 0) {
    const gc = buildCandidate({
      siteId, siteName,
      category: "Classification",
      question: `How many gallery photographs are documented for ${siteName}?`,
      correctAnswer: `${gallery.length}`,
      fieldPath: "gallary.length",
      fieldValue: gallery.length,
      seq: seq++
    });
    if (gc) candidates.push(gc);
  }

  return {
    site_id: siteId,
    site_name: siteName,
    raw_count: candidates.length,
    annotations: candidates
  };
}
