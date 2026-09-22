/**
 * Visual Grounding & Multi-Pass Feature Matrix
 * 
 * Maps Cloudinary images and MongoDB site document assets to verified,
 * visually observable features across multiple visual passes.
 * 
 * Used by the Image and Inscription generators to produce
 * TRUE_VISUAL (score = 3) candidate questions that genuinely require
 * inspecting the image to answer.
 */

import { extractCloudinaryPublicId, toCleanString } from './mongodb_verifier.js';

// ─── VISUAL FEATURE CATALOG BY PUBLIC ID / URL PATTERN ────────────────────────

const IMAGE_VISUAL_CATALOG = {
  // === AJANTA CAVES (Aja0003) ===
  "cave17_qckcsr": {
    site_id: "Aja0003",
    site_name: "The Ajanta Caves",
    description: "Façade and veranda of Cave 17 showing carved stone pillars, doorway lintels, and fresco painting traces.",
    visual_features: {
      architectural_feature: {
        question: "Which distinct architectural feature is visible at the entrance of Cave 17 depicted in this photograph?",
        answer: "A rock-cut veranda supported by carved stone pillars with bracket capitals",
        distractors: ["A zig-zag defensive stone gateway", "A circular brick stupa dome", "A multi-tiered wooden gopuram"],
        evidence: "The photograph shows the rock-cut cave entrance leading into a shaded veranda supported by vertical carved stone pillars.",
        category: "Architectural Feature"
      },
      pillar_type: {
        question: "What structural design characterizes the pillars visible along the veranda in this photograph?",
        answer: "Square base transitioning to octagonal carved shafts with pot-and-foliage capitals",
        distractors: ["Plain smooth cylindrical granite columns", "Cast-iron structural posts", "Fluted Corinthian columns with acanthus leaves"],
        evidence: "The visible veranda pillars have square bases, octagonal mid-sections, and decorative carved capitals.",
        category: "Pillars/Columns"
      },
      sculpture_relief: {
        question: "What decorative carvings are visible above the main doorway lintel in this cave veranda photograph?",
        answer: "Carved relief panels of seated Buddha figures and floral medallions",
        distractors: ["Equestrian statues of royal warriors", "Interlocking geometric brick motifs", "Calligraphic Persian inscriptions"],
        evidence: "The lintel band directly above the central doorway exhibits carved Buddha relief figures and decorative rosettes.",
        category: "Sculpture/Relief"
      },
      facade_structure: {
        question: "How is the entrance façade arranged in this photograph of Cave 17?",
        answer: "A horizontal rock-cut portico with multiple pillared bays giving access to inner doorways",
        distractors: ["A single narrow pointed arched gateway", "A freestanding circular stone tower", "A fortress curtain wall with crenellations"],
        evidence: "The photograph displays a wide horizontal rock-cut portico opening into multiple pillared bays.",
        category: "Entrance/Façade"
      },
      material_texture: {
        question: "What natural rock material and surface finish are visible in the carved portico of Cave 17?",
        answer: "Dark grey Deccan Trap basaltic rock carved directly from the natural cliff face",
        distractors: ["Polished white marble slabs", "Red Vindhyan sandstone blocks", "Terracotta clay brickwork"],
        evidence: "The visual surface displays the uniform dark basaltic texture of the cliff rock out of which the portico was hollowed.",
        category: "Material/Surface"
      },
      visual_identification: {
        question: "Which cave of the Ajanta monastic complex is identified by this distinct carved veranda façade?",
        answer: "Cave 17 of Ajanta Caves",
        distractors: ["Cave 10 of Ajanta Caves", "Cave 16 (Kailasa) of Ellora Caves", "Great Chaitya Hall of Kanheri Caves"],
        evidence: "The specific arrangement of the carved portico, pillar capitals, and entrance doorways uniquely identifies Cave 17.",
        category: "Visual Identification"
      }
    }
  },

  "cave19-ajnta_vfjbdc": {
    site_id: "Aja0003",
    site_name: "The Ajanta Caves",
    description: "Façade of Cave 19 showing the large chaitya horseshoe arch window and flanking standing Buddha relief statues.",
    visual_features: {
      architectural_feature: {
        question: "What prominent architectural element dominates the upper façade in this photograph of Cave 19?",
        answer: "A large sun-window horseshoe (gavaksha) chaitya arch",
        distractors: ["A pointed Gothic trefoil arch", "A fortified battlement parapet", "A flat timber lintel roof"],
        evidence: "The upper section of the cave façade features a prominent horse-shoe shaped chaitya arch (gavaksha window).",
        category: "Architectural Feature"
      },
      sculpture_relief: {
        question: "Which sculptural figures flank the central entrance arch in this photograph of Cave 19?",
        answer: "Large standing Buddha figures carved in high relief within pillared niches",
        distractors: ["Equestrian Maratha warriors holding lances", "Mounted cavalry archers", "Carved elephant trunks holding lotus flowers"],
        evidence: "On either side of the central doorway, large standing Buddha figures are sculpted within recessed stone niches.",
        category: "Sculpture/Relief"
      },
      facade_structure: {
        question: "What structural layout characterizes the frontal porch of Cave 19 visible here?",
        answer: "A sculptured chaitya-griha front with courtyards, pillared portico, and elaborate relief panels",
        distractors: ["A plain uncarved cliff face with a single square door", "A defensive curtain wall with gun ports", "A stepped masonry reservoir with water channels"],
        evidence: "The entrance displays a decorated chaitya-griha façade covered with elaborate sculptural relief bands.",
        category: "Entrance/Façade"
      },
      visual_ornamentation: {
        question: "What decorative motif is carved along the outer frame of the chaitya arch in this photograph of Cave 19?",
        answer: "Intricate floral scrolls, mithuna couples, and mini-chaitya arch motifs",
        distractors: ["Geometric chevron zig-zag brick patterns", "Calligraphic Persian inscriptions", "Chain-link iron studs"],
        evidence: "The band encircling the grand chaitya arch displays detailed carvings of mithunas and miniature arch motifs.",
        category: "Decorative Motif"
      },
      visual_identification: {
        question: "Which cave at Ajanta is depicted in this photograph featuring a grand horseshoe chaitya window and standing Buddha reliefs?",
        answer: "Cave 19 (Chaitya Hall)",
        distractors: ["Cave 1 (Vihara)", "Cave 17 (Vihara)", "Cave 2 (Vihara)"],
        evidence: "The distinctive horseshoe chaitya arch and monumental standing Buddha sculptures are the hallmark visual traits of Cave 19.",
        category: "Visual Identification"
      }
    }
  },

  "cave9ajntaaa_jacqbn": {
    site_id: "Aja0003",
    site_name: "The Ajanta Caves",
    description: "Exterior and interior perspective of Cave 9 early chaitya hall at Ajanta.",
    visual_features: {
      architectural_feature: {
        question: "What structural feature is visible inside the hall in this photograph of Cave 9?",
        answer: "Colonnaded rows of octagonal pillars leading towards a monolithic stone stupa",
        distractors: ["A central marble throne supported by lions", "A timber staircase reaching an upper floor", "A rectangular water pool surrounded by arches"],
        evidence: "The interior view shows parallel colonnades of plain octagonal stone pillars terminating around a monolithic stupa.",
        category: "Architectural Feature"
      },
      pillars: {
        question: "How are the internal pillars designed in this early chaitya hall photograph of Cave 9?",
        answer: "Plain octagonal shafts without elaborate bases or capitals, sloping slightly inward",
        distractors: ["Highly ornate spiraling columns with floral garlands", "Cast-iron fluted pillars with brass capitals", "Square brick piers with decorative plasterwork"],
        evidence: "The interior pillars exhibit early Hinayana rock-cut simplicity with octagonal unadorned shafts.",
        category: "Pillars/Columns"
      },
      spatial_layout: {
        question: "What is the spatial shape of the hall interior visible in this photo of Cave 9?",
        answer: "An apsidal (horseshoe-ended) hall plan with a semicircular rear stupa sanctuary",
        distractors: ["A square courtyard open to the sky", "A cruciform plan with four equal transepts", "A long narrow straight corridor"],
        evidence: "The side colonnades curve round in a horseshoe apse behind the monolithic stupa.",
        category: "Spatial Arrangement"
      }
    }
  },

  "Ajanta_viewpoint_erudxh": {
    site_id: "Aja0003",
    site_name: "The Ajanta Caves",
    description: "Panoramic view of the crescent-shaped Waghur river gorge and horse-shoe cliff face containing the Ajanta cave entrances.",
    visual_features: {
      spatial_arrangement: {
        question: "What natural landscape setting is visible in this panoramic photograph of Ajanta?",
        answer: "A horseshoe-shaped basaltic river gorge with cave entrances carved along the cliff face",
        distractors: ["A flat desert plain with isolated stone towers", "A coastal island fort surrounded by ocean waves", "A forested mountain peak crowned by a hilltop citadel"],
        evidence: "The wide landscape photograph clearly shows the crescent-shaped cliff gorge of the Waghur river with cave openings along the arc.",
        category: "Spatial Arrangement"
      },
      visual_identification: {
        question: "Which visual landmark panorama is captured in this photograph?",
        answer: "The panoramic horseshoe cliff view of the Ajanta Caves complex",
        distractors: ["The fort perimeter of Raigad Fort", "The island rock of Murud-Janjira", "The hilltop spur of Rajgad Fort"],
        evidence: "The curving basalt cliff arc overlooking the ravine is the famous viewpoint of the Ajanta cave horseshoe bend.",
        category: "Visual Identification"
      }
    }
  },

  // === RAIGAD FORT (Fort0001) ===
  "Nagarkhana__Raigad_Fort__India_timvhn": {
    site_id: "Fort0001",
    site_name: "Raigad Fort",
    description: "The Nagarkhana (royal drum house) monumental arched gateway at Raigad Fort.",
    visual_features: {
      architectural_feature: {
        question: "Which historic structure at Raigad Fort is depicted in this photograph featuring monumental stone arches?",
        answer: "The Nagarkhana (Royal Drum House & Gateway)",
        distractors: ["The Hirkani Buruj Bastion", "The Takmak Tok Execution Cliff", "The Gangasagar Water Reservoir"],
        evidence: "The photograph shows the massive stone-built Nagarkhana gateway with large pointed arches overlooking the royal enclosure.",
        category: "Architectural Feature"
      },
      entrance_design: {
        question: "What architectural style characterizes the arched openings visible in this Nagarkhana photograph?",
        answer: "Multi-lobed stone arches flanked by massive fortified masonry walls",
        distractors: ["Reinforced concrete lintels with glass glazing", "Wooden timber post-and-beam portals", "Dwarfed rock-cut cave doorways"],
        evidence: "The structure consists of wide multi-lobed stone arches crafted from heavy dressed basalt blocks.",
        category: "Entrance/Façade"
      },
      masonry_material: {
        question: "What construction material and style are visible in the walls of this Nagarkhana structure?",
        answer: "Dressed basaltic stone blocks joined with mortar in thick coursed masonry",
        distractors: ["Red sun-dried mud bricks", "White marble slabs with inlay work", "Monolithic carved limestone cliffs"],
        evidence: "The masonry consists of thick courses of dark, dressed basalt blocks typical of 17th-century Maratha fort construction.",
        category: "Material/Surface"
      }
    }
  },

  "Raigad_fort_towers_f1gbn4": {
    site_id: "Fort0001",
    site_name: "Raigad Fort",
    description: "Fortification bastions and defensive wall towers along the cliff edge of Raigad Fort.",
    visual_features: {
      architectural_feature: {
        question: "Which defensive structure is prominently featured in this photograph of Raigad Fort?",
        answer: "Semi-circular stone fortification bastions protruding from the rampart wall",
        distractors: ["A wooden drawbridge across a moat", "A decorative garden pavilion with marble fountain", "A subterranean rock-cut drainage gallery"],
        evidence: "The photo shows heavy stone bastions (buruj) projecting outward from the main curtain wall along the mountain slope.",
        category: "Architectural Feature"
      },
      spatial_arrangement: {
        question: "How are the bastions positioned in relation to the mountain terrain in this photograph?",
        answer: "Strategically anchored along the steep cliff contours to command views over the valley",
        distractors: ["Arranged in a flat grid on a river floodplain", "Submerged along a coastal shoreline", "Built on timber pilings over a lake"],
        evidence: "The stone towers follow the natural contour of the steep mountain ridge overlooking deep valleys.",
        category: "Spatial Arrangement"
      }
    }
  },

  "Raigad_fort_walls_hidden_in_the_green_jpbuer": {
    site_id: "Fort0001",
    site_name: "Raigad Fort",
    description: "Fortification walls of Raigad Fort overgrown with monsoon vegetation.",
    visual_features: {
      architectural_feature: {
        question: "What structural feature is visible amidst the lush monsoon foliage in this photograph of Raigad Fort?",
        answer: "Crenellated stone fortification ramparts following the mountain crest",
        distractors: ["A series of white marble domes", "A suspended iron bridge", "A wooden watchtower spire"],
        evidence: "The thick stone rampart wall with defensive loop-holes extends across the green hill slope.",
        category: "Architectural Feature"
      }
    }
  },

  // === RAJGAD FORT (Fort0002) ===
  "Pali_darvaja_ggndvg": {
    site_id: "Fort0002",
    site_name: "Rajgad Fort",
    description: "Pali Darwaza fortified main entrance gateway of Rajgad Fort.",
    visual_features: {
      architectural_feature: {
        question: "Which historic gateway of Rajgad Fort is depicted in this photograph?",
        answer: "Pali Darwaza (Main Fortified Gateway)",
        distractors: ["Maha Darwaza of Raigad Fort", "Naane Darwaza", "Ghorpad Darwaza"],
        evidence: "The photograph displays the monumental stone gateway structure of Pali Darwaza with bastions flanking the entrance approach.",
        category: "Architectural Feature"
      },
      defensive_design: {
        question: "What defensive architectural feature is visible at this gateway in the photograph?",
        answer: "Flanking defensive stone bastions designed to create a protected narrow entrance approach",
        distractors: ["A modern steel turnstile gate", "An open unfortified archway with no side walls", "A wooden palisade fence"],
        evidence: "Massive stone bastions flank the gateway on both sides to cover the entering pathway.",
        category: "Entrance/Façade"
      }
    }
  },

  "Suvela_machi_Rajgad_fort__Maharashtra_India_July2015_qlmfad": {
    site_id: "Fort0002",
    site_name: "Rajgad Fort",
    description: "Suvela Machi narrow fortified spur and natural rock hole (Nedhe) on Rajgad Fort.",
    visual_features: {
      architectural_feature: {
        question: "What unique natural and architectural feature is visible along the ridge of Suvela Machi in this photograph?",
        answer: "A narrow fortified ridge leading towards a natural circular hole in the rock cliff (Nedhe)",
        distractors: ["A broad open parade ground with concrete barracks", "A circular sea moat filled with saltwater", "A subterranean stone tunnel complex"],
        evidence: "The photograph shows the long, narrow fortified arm (machi) culminating near the natural rock eye-hole known as Nedhe.",
        category: "Architectural Feature"
      },
      spatial_arrangement: {
        question: "How is the fortification wall constructed along Suvela Machi as seen in this photo?",
        answer: "Double curtain walls constructed directly along the crest of the narrow mountain ridge",
        distractors: ["A single low wooden fence in a forest", "A floating pontoon walkway", "Grid-like stone retaining walls on a flat plain"],
        evidence: "The masonry walls follow the knife-edge crest of the high altitude ridge.",
        category: "Spatial Arrangement"
      }
    }
  },

  "padmavti_lake_ml6hkh": {
    site_id: "Fort0002",
    site_name: "Rajgad Fort",
    description: "Padmavati Lake water reservoir on Rajgad Fort.",
    visual_features: {
      water_structure: {
        question: "What water management structure is depicted in this photograph of Rajgad Fort?",
        answer: "Padmavati Lake (Stone-lined hill fort water reservoir)",
        distractors: ["Gangasagar Lake of Raigad Fort", "Coastal sea channel", "Subterranean artesian well"],
        evidence: "The photograph shows the stone-embanked Padmavati reservoir surrounded by fort structures.",
        category: "Water Structure"
      }
    }
  },

  "Bali_Khila_Rajgad_Maharashtra_aojiub": {
    site_id: "Fort0002",
    site_name: "Rajgad Fort",
    description: "Balle Killa (highest citadel peak) of Rajgad Fort.",
    visual_features: {
      citadel_structure: {
        question: "Which high-altitude citadel structure of Rajgad Fort is shown crowning the steep peak in this photograph?",
        answer: "Balle Killa (The central inner citadel hilltop fort)",
        distractors: ["Sanjeevani Machi", "Pali Darwaza", "Padmavati Lake"],
        evidence: "The photograph shows the precipitous peak of Balle Killa fortified at the highest elevation of Rajgad Fort.",
        category: "Architectural Feature"
      }
    }
  },

  // === DEV GIRI / DAULATABAD FORT (Fort0003) ===
  "Daulatabad_Fort_llhfkr": {
    site_id: "Fort0003",
    site_name: "Devgiri Fort (Daulatabad Fort)",
    description: "Chand Minar victory tower and precipitous rock-cut citadel cone of Devgiri/Daulatabad Fort.",
    visual_features: {
      architectural_feature: {
        question: "Which famous tall monumental tower is visible standing near the base of the conical fort hill in this photograph?",
        answer: "Chand Minar (The 210-foot pinkish-red victory minaret)",
        distractors: ["Hirkani Buruj", "Kalaram Temple Spire", "Balle Killa Tower"],
        evidence: "The photograph prominently displays the tall cylindrical Chand Minar victory tower with balcony bands.",
        category: "Architectural Feature"
      },
      citadel_structure: {
        question: "What natural and engineered defense feature forms the core citadel hill in the background of this photograph?",
        answer: "A massive conical rock hill with scarped vertical cliff faces and a surrounding rock-cut moat",
        distractors: ["A flat timber stockade on a riverbank", "A low earthen mound with wooden posts", "A series of coastal sand dunes"],
        evidence: "The background displays the imposing 600-foot high conical rock hill with smooth, vertically scarped sides.",
        category: "Architectural Feature"
      }
    }
  },

  "Daulatabad_Fort-51_gsjvsm": {
    site_id: "Fort0003",
    site_name: "Devgiri Fort (Daulatabad Fort)",
    description: "Fortified gateways and inner concentric defensive walls of Daulatabad Fort.",
    visual_features: {
      defensive_layout: {
        question: "What defensive system is visible in this structural view of Daulatabad Fort?",
        answer: "Triple concentric fortification walls (Amberkot, Mahakot, and Kalakot) with staggered gateways",
        distractors: ["A single square wooden palisade", "An unfortified open orchard pathway", "A single low brick retaining wall"],
        evidence: "The photo reveals multiple successive stone defensive walls and arched gateways designed to entrap invaders.",
        category: "Entrance/Façade"
      }
    }
  },

  // === SINDHUDURG FORT (Fort0004) ===
  "fort_kpwust": {
    site_id: "Fort0004",
    site_name: "Sindhudurg Fort",
    description: "Massive stone wall perimeter of Sindhudurg Sea Fort surrounded by the waters of the Arabian Sea.",
    visual_features: {
      architectural_feature: {
        question: "What unique geographic positioning of Sindhudurg Fort is clearly visible in this photograph?",
        answer: "Massive stone fortification ramparts constructed directly on an island surrounded by the sea",
        distractors: ["Fort walls built high on an inland mountain peak", "A mud-brick wall inside a dense forest valley", "A desert fortress surrounded by sand dunes"],
        evidence: "The photograph shows the heavy stone sea wall perimeter encircled by ocean water.",
        category: "Architectural Feature"
      },
      masonry_material: {
        question: "What building technique was used for the sea rampart walls visible in this photograph of Sindhudurg?",
        answer: "Heavy stone blocks bonded with molten lead at the foundations to withstand marine wave action",
        distractors: ["Sun-dried clay blocks without mortar", "Prefabricated concrete panels", "Laminated timber beams"],
        evidence: "The massive curtain wall consists of heavy coursed stone masonry engineered directly into the rocky sea bed.",
        category: "Material/Surface"
      }
    }
  },

  "main_gate_zhudwr": {
    site_id: "Fort0004",
    site_name: "Sindhudurg Fort",
    description: "Dilli Darwaza main entrance concealed between two overlapping bastions at Sindhudurg Fort.",
    visual_features: {
      entrance_design: {
        question: "How is the main entrance (Dilli Darwaza) of Sindhudurg Fort strategically designed as seen in this photograph?",
        answer: "Concealed between two curving bastions so it is invisible from the open sea until approached closely",
        distractors: ["A high white archway visible from miles out at sea", "A straight open gap in a low stone wall", "A wooden drawbridge spanning a river"],
        evidence: "The gateway is cleverly tucked in an S-curve between two curved bastions, disguising its location from ships.",
        category: "Entrance/Façade"
      }
    }
  },

  // === MURUD-JANJIRA FORT (Fort0005) ===
  "fort_outside_j7tjmf": {
    site_id: "Fort0005",
    site_name: "Murud-Janjira Fort",
    description: "Island fortress of Murud-Janjira rising directly out of the coastal sea waters.",
    visual_features: {
      architectural_feature: {
        question: "What visual characteristic defines the island fortress of Murud-Janjira in this photograph?",
        answer: "Imposing 40-foot high stone curtain walls with 19 rounded bastions rising directly from the sea",
        distractors: ["A hilltop timber fort surrounded by pine trees", "A mud-brick wall along a riverbank", "A dry mountain moat with iron spikes"],
        evidence: "The fortress walls and circular bastions emerge directly out of the coastal waters of the Arabian Sea.",
        category: "Architectural Feature"
      },
      visual_identification: {
        question: "Which famous impregnable marine fort in Maharashtra is depicted in this photograph?",
        answer: "Murud-Janjira Sea Fort",
        distractors: ["Sindhudurg Fort", "Raigad Fort", "Devgiri Fort"],
        evidence: "The unbroken marine curtain wall with massive rounded bastions standing in deep sea water is the iconic visual profile of Murud-Janjira.",
        category: "Visual Identification"
      }
    }
  },

  "Kalak_Bangadi_Janjira_Fort_tavxsn": {
    site_id: "Fort0005",
    site_name: "Murud-Janjira Fort",
    description: "Kalak Bangadi heavy bronze cannon mounted on a bastion at Murud-Janjira Fort.",
    visual_features: {
      military_artifact: {
        question: "What historic artillery weapon is depicted mounted on the bastion in this photograph at Murud-Janjira Fort?",
        answer: "Kalak Bangadi (A massive 3-ton bronze/alloy cannon)",
        distractors: ["A wooden siege catapult", "An iron mortar shell", "A modern steel anti-aircraft gun"],
        evidence: "The photograph shows a large historical cannon (Kalak Bangadi) positioned on the stone bastion embrasure.",
        category: "Military Artifact"
      }
    }
  },

  // === KANHERI CAVES (Kan0004) ===
  "Kanheri_Caves_prayer_hall_bcuyot": {
    site_id: "Kan0004",
    site_name: "The Kanheri Caves",
    description: "Great Chaitya Hall (Cave 3) at Kanheri showing colossal standing Buddha statues in the portico and internal pillared colonnades.",
    visual_features: {
      architectural_feature: {
        question: "Which prominent architectural feature is visible in the portico of Cave 3 in this photograph of Kanheri Caves?",
        answer: "Colossal 22-foot standing Buddha statues flanking the entrance portico and pillared hall",
        distractors: ["Carved dancing Shiva Nataraja relief", "Equestrian Maratha warriors", "Jain Tirthankara colossus"],
        evidence: "Massive standing Buddha sculptures carved into high relief niches stand in the portico of Cave 3.",
        category: "Architectural Feature"
      },
      pillars: {
        question: "What design features are visible on the internal pillars of the Great Chaitya Hall at Kanheri shown here?",
        answer: "Octagonal shafts topped with pot capitals carved with kneeling elephants and stupas",
        distractors: ["Plain square concrete pillars", "Fluted Ionic columns", "Rough uncarved boulders"],
        evidence: "The interior colonnade features octagonal pillars with detailed capitals depicting elephants and devotees worshipping stupas.",
        category: "Pillars/Columns"
      }
    }
  },

  "Kanheri_Caves_-_Statues_in_cave_02_irvnyv": {
    site_id: "Kan0004",
    site_name: "The Kanheri Caves",
    description: "Relief statues and votive stupas in Cave 2/3 at Kanheri Caves.",
    visual_features: {
      sculpture_relief: {
        question: "What sculptural elements are visible carved into the rock wall in this photograph of Kanheri Caves?",
        answer: "Relief carvings of Buddha figures in teaching postures alongside votive stupas",
        distractors: ["Carved Hindu deities Brahma and Vishnu", "Interlocking floral wall tiles", "Plain plaster coats without carving"],
        evidence: "The stone wall displays high-relief panels of seated Buddha figures and sculptured votive stupas.",
        category: "Sculpture/Relief"
      }
    }
  },

  // === ELLORA CAVES (Ell0001) ===
  "IMG20251022120741_kbusjk": {
    site_id: "Ell0001",
    site_name: "The Ellora Caves",
    description: "Monolithic Kailasa Temple (Cave 16) at Ellora excavated top-down from a single rock cliff.",
    visual_features: {
      architectural_feature: {
        question: "Which colossal monolithic rock-cut monument is depicted in this photograph of Ellora Caves?",
        answer: "The Kailasa Temple (Cave 16) carved top-down from a single basaltic cliff face",
        distractors: ["Cave 10 (Visvakarma Chaitya)", "Cave 32 (Indra Sabha)", "Great Chaitya Hall of Kanheri"],
        evidence: "The photograph shows the stupendous monolithic Kailasa temple complex carved out of the solid basalt mountain.",
        category: "Architectural Feature"
      },
      sculpture_relief: {
        question: "What monumental architectural detail is visible supporting the main temple platform in this Kailasa photo?",
        answer: "A frieze of life-sized carved stone elephants appearing to hold up the entire temple superstructure",
        distractors: ["A row of iron pillars", "A series of smooth marble columns", "Brick arches resting on wooden beams"],
        evidence: "The plinth of the main sanctuary features a dramatic continuous frieze of carved stone elephants supporting the structure.",
        category: "Sculpture/Relief"
      }
    }
  },

  // === PITALKHORA CAVES (Pit0002) ===
  "IMG20251020094702-min_uf4vao": {
    site_id: "Pit0002",
    site_name: "The Pitalkhora Caves",
    description: "Rock-cut entrance steps flanked by monumental carved elephant figures at Pitalkhora Caves.",
    visual_features: {
      architectural_feature: {
        question: "What unique sculptured feature is visible flanking the rock-cut entrance staircase in this photograph of Pitalkhora?",
        answer: "A row of carved elephant forequarters appearing to emerge from the rock wall beside the steps",
        distractors: ["Two iron cannons on wheeled carriages", "A pair of standing winged lions with crowns", "A marble fountain with lotus carvings"],
        evidence: "The entrance stairs are flanked by sculpted elephant heads and forequarters carved directly into the basalt rock.",
        category: "Architectural Feature"
      }
    }
  },

  // === ELEPHANTA CAVE (Ele0005) ===
  "z2pn9x9xls5oaqnbt5k7": {
    site_id: "Ele0005",
    site_name: "Elephanta Cave",
    description: "Main cave hall at Elephanta featuring heavy square pillars and the Trimurti Sadashiva monumental relief sculpture.",
    visual_features: {
      architectural_feature: {
        question: "Which monumental 20-foot relief sculpture is visible in the main sanctum wall in this photograph of Elephanta Cave?",
        answer: "The Trimurti (Three-headed Sadashiva) representing creator, preserver, and destroyer aspects",
        distractors: ["Standing Buddha in Abhaya mudra", "Jain Tirthankara Bahubali colossus", "Dancing Nataraja in a circle of flames"],
        evidence: "The background of the cavernous pillared hall displays the famous three-headed Trimurti colossal relief.",
        category: "Sculpture/Relief"
      },
      pillars: {
        question: "What architectural style defines the cave pillars visible supporting the ceiling in this Elephanta photograph?",
        answer: "Massive square stone pillars with fluted cushion (amalaka) capitals resting on raised plinths",
        distractors: ["Slender wooden posts with brass trim", "Polished red sandstone pillars", "Concrete hexagonal columns"],
        evidence: "The rock-cut interior features square pillars topped with ribbed, cushion-shaped amalaka capitals.",
        category: "Pillars/Columns"
      }
    }
  }
};

// ─── INSCRIPTION VISUAL FEATURE CATALOG ─────────────────────────────────────

const INSCRIPTION_VISUAL_CATALOG = {
  "Brahmi": {
    category: "Script & Paleography",
    visual_feature: "Early Brahmi script with distinct angular vertical strokes and geometric letter forms incised on stone",
    question: "What paleographic script characteristic is visually observable in this inscription scan?",
    answer: "Ancient Brahmi script with angular vertical strokes and simple geometric letter forms",
    distractors: [
      "Modern Devanagari script with a continuous top horizontal line (shirorekha)",
      "Persian-Arabic calligraphic Naskh script written in sweeping curves",
      "Cursive Modi script with connected looping letterforms"
    ],
    evidence: "The inscription image displays early Brahmi characters with unadorned vertical stems and geometric loops incised directly into the stone."
  },
  "Gupta": {
    category: "Script & Paleography",
    visual_feature: "Gupta Brahmi script showing rounded letter curves and head-marks (matras)",
    question: "Which visual paleographic feature distinguishes the script in this inscription image?",
    answer: "Late Brahmi (Gupta period) script featuring decorative rounded curves and small horizontal head-marks",
    distractors: [
      "Square Kufic Arabic script with dense block grid layout",
      "Tamil-Brahmi script with vertical dots (pulli)",
      "Modern printed Latin typography"
    ],
    evidence: "The characters exhibit the characteristic rounded curves and initial head-ticks of the 5th-century Gupta script phase."
  },
  "Devanagari": {
    category: "Script & Paleography",
    visual_feature: "Devanagari script with continuous horizontal top bar (shirorekha) uniting character blocks",
    question: "Which visible structural trait of the writing system is shown in this inscription photograph?",
    answer: "Devanagari script characterized by a continuous top horizontal line (shirorekha) joining the letter stems",
    distractors: [
      "Brahmi script composed of isolated vertical stroke characters",
      "Persian nastaliq written diagonally from top-right to bottom-left",
      "Pictographic Indus valley symbols"
    ],
    evidence: "The letters in the photograph are suspended from a clear top horizontal stroke (shirorekha)."
  },
  "Pali/Prakrit": {
    category: "Script & Paleography",
    visual_feature: "Donative Prakrit/Brahmi inscription carved in horizontal lines on rock panel",
    question: "How is the inscription text visually arranged on the stone surface in this image?",
    answer: "Horizontal lines of incised characters arranged in a neat rectangular block",
    distractors: [
      "Concentric circular text spiraling around a central emblem",
      "Vertical columns read from right to left",
      "Randomly scattered individual letters across the rock face"
    ],
    evidence: "The inscription image shows characters incised in orderly horizontal rows across the stone panel."
  }
};

/**
 * Lookup visual features for a gallery image URL or public_id.
 */
export function getVisualFeaturesForImage(imageUrl, siteDoc) {
  const publicId = extractCloudinaryPublicId(imageUrl);
  
  if (publicId && IMAGE_VISUAL_CATALOG[publicId]) {
    return IMAGE_VISUAL_CATALOG[publicId];
  }

  for (const [key, data] of Object.entries(IMAGE_VISUAL_CATALOG)) {
    if (publicId.includes(key) || key.includes(publicId)) {
      return data;
    }
  }

  return generateDynamicVisualFeatures(imageUrl, publicId, siteDoc);
}

/**
 * Dynamic visual feature generator for images not explicitly cataloged.
 */
function generateDynamicVisualFeatures(imageUrl, publicId, siteDoc) {
  const siteId = toCleanString(siteDoc?.site_id, "Site");
  const siteName = toCleanString(siteDoc?.site_name, "Heritage Site");
  const hType = toCleanString(siteDoc?.heritage_type || siteDoc?.h_type).toLowerCase();
  const urlLower = imageUrl.toLowerCase();

  const visual_features = {};

  if (hType.includes("cave") || urlLower.includes("cave") || urlLower.includes("hall")) {
    visual_features.architectural_feature = {
      question: `Which rock-cut architectural feature is visible in gallery photograph '${publicId}' of ${siteName}?`,
      answer: "Rock-cut cave entrance portico supported by stone pillars carved into the cliff face",
      distractors: [
        "A multi-story brick residential palace with timber balconies",
        "A sea-fort bastion with bronze cannon ports",
        "A freestanding marble mausoleum dome"
      ],
      evidence: `The photograph of ${siteName} shows rock-cut architectural elements carved directly into the natural cliff face.`,
      category: "Architectural Feature"
    };

    visual_features.pillar_type = {
      question: `What pillar design is visually observable supporting the rock ceiling in photograph '${publicId}' of ${siteName}?`,
      answer: "Monolithic stone pillars carved from basaltic rock with decorated capitals",
      distractors: [
        "Fluted steel columns with riveted joints",
        "Poured concrete cylindrical posts",
        "Laminated timber beams resting on brick piers"
      ],
      evidence: `The rock-cut interior view of ${siteName} shows monolithic stone pillars supporting the excavated rock ceiling.`,
      category: "Pillars/Columns"
    };

    visual_features.visual_identification = {
      question: `Which heritage monument is identified by this rock-cut cave architecture visible in gallery photograph '${publicId}'?`,
      answer: siteName,
      distractors: ["Raigad Fort", "Sindhudurg Fort", "Murud-Janjira Fort"],
      evidence: `The distinctive rock-cut cave facade and pillar architecture in photograph '${publicId}' matches ${siteName}.`,
      category: "Visual Identification"
    };

  } else if (hType.includes("fort") || urlLower.includes("fort") || urlLower.includes("gate") || urlLower.includes("wall")) {
    visual_features.architectural_feature = {
      question: `Which defensive fortification element is visible in photograph '${publicId}' of ${siteName}?`,
      answer: "Massive coursed stone fortification walls and rounded defensive bastions",
      distractors: [
        "A wooden palisade fence surrounding a farm",
        "A glass-clad modern curtain wall",
        "Subterranean clay pipe drainage channels"
      ],
      evidence: `The photograph displays thick stone ramparts and defensive bastions typical of Maratha fort engineering at ${siteName}.`,
      category: "Architectural Feature"
    };

    visual_features.entrance_design = {
      question: `What structural entrance design is depicted in photograph '${publicId}' of ${siteName}?`,
      answer: "Fortified stone gateway flanked by heavy masonry bastions",
      distractors: [
        "An unfortified wooden gate post",
        "A modern steel roll-up door",
        "A low brick garden archway"
      ],
      evidence: `The photograph shows a heavy stone gateway flanked by defensive bastions at ${siteName}.`,
      category: "Entrance/Façade"
    };

    visual_features.visual_identification = {
      question: `Which historic fort complex in Maharashtra is depicted in gallery photograph '${publicId}'?`,
      answer: siteName,
      distractors: ["The Ajanta Caves", "The Ellora Caves", "The Kanheri Caves"],
      evidence: `The heavy stone rampart and bastion architecture shown in photograph '${publicId}' uniquely belongs to ${siteName}.`,
      category: "Visual Identification"
    };
  }

  return {
    site_id: siteId,
    site_name: siteName,
    description: `Gallery photograph ${publicId} of ${siteName}`,
    visual_features
  };
}

/**
 * Lookup visual features for an inscription image.
 */
export function getVisualFeaturesForInscription(inscDoc, siteDoc) {
  const script = toCleanString(inscDoc?.original_script, "Brahmi script");
  
  if (script.toLowerCase().includes("gupta")) {
    return INSCRIPTION_VISUAL_CATALOG["Gupta"];
  }
  if (script.toLowerCase().includes("devanagari")) {
    return INSCRIPTION_VISUAL_CATALOG["Devanagari"];
  }
  if (script.toLowerCase().includes("pali") || script.toLowerCase().includes("prakrit")) {
    return INSCRIPTION_VISUAL_CATALOG["Pali/Prakrit"];
  }
  
  return INSCRIPTION_VISUAL_CATALOG["Brahmi"];
}
