/* THE TIME MACHINE — JS (v3)
   Fixes:
   - Multi = COMPLETELY DIFFERENT panels (hard rule + per-panel specs)
   - Adds NAME + COUNTRY (and date/age) as a small caption ON THE FRAME/BORDER ONLY
   - Strong country-lock rules (no wrong-country cues)
   - Strong decade/era anchors (including 2030s/2040s)
   - Scrapbook styling + colors change by decade AND age (adult is NOT minimal/boring)
   - Multi forces Scene = Auto (each panel random indoor/outdoor per panel)
   - TELEPORT opens popup + fills prompt; COPY works; CLEAR resets all
*/

(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // ---------- Segmented controls ----------
  function setSegActive(segEl, value){
    if(!segEl) return;
    $$("button.tmSegBtn", segEl).forEach(b => b.classList.toggle("isOn", b.dataset.value === value));
  }
  function getSegValue(segEl){
    const on = segEl ? $("button.tmSegBtn.isOn", segEl) : null;
    return on ? on.dataset.value : null;
  }
  function wireSeg(segEl, onChange){
    if(!segEl) return;
    segEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button.tmSegBtn");
      if(!btn || btn.classList.contains("isDisabled")) return;
      setSegActive(segEl, btn.dataset.value);
      onChange && onChange(btn.dataset.value);
    });
  }

  // ---------- Modal ----------
  function openModal(){
    const back = $("#tmModalBack");
    if(!back) return;
    back.classList.add("isOn");
    back.setAttribute("aria-hidden","false");
  }
  function closeModal(){
    const back = $("#tmModalBack");
    if(!back) return;
    back.classList.remove("isOn");
    back.setAttribute("aria-hidden","true");
  }

  // ---------- Parse helpers ----------
  function parseIntSafe(v){
    if(v === null || v === undefined) return null;
    const s = String(v).trim();
    if(!s) return null;
    const n = parseInt(s.replace(/[^\d\-]/g,""), 10);
    return Number.isNaN(n) ? null : n;
  }
  const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];

  // ---------- Elements ----------
  const segSubject   = $('.tmSeg[data-seg="subject"]');
  const segGender    = $('.tmSeg[data-seg="gender"]');
  const segMode      = $('.tmSeg[data-seg="mode"]');
  const segDirection = $('.tmSeg[data-seg="direction"]');
  const segAgeMode   = $('.tmSeg[data-seg="ageMode"]');
  const segScene     = $('.tmSeg[data-seg="scene"]');
  const segLayout    = $('.tmSeg[data-seg="layout"]');
  const segScrap     = $('.tmSeg[data-seg="scrap"]');

  const timelineBlock    = $("#tmTimelineBlock");
  const destinationBlock = $("#tmDestinationBlock");

  const nameEl    = $("#tmName");
  const countryEl = $("#tmCountry");

  const birthYearEl = $("#tmBirthYear");
  const ageMemEl    = $("#tmAgeInMemory");
  const destYearEl  = $("#tmDestYearInput");

  const destComputedEl = $("#tmDestComputed");
  const eraEl          = $("#tmEra");

  const quoteEl = $("#tmQuote");

  const teleportBtn = $("#tmTeleportBtn");
  const rerollBtn   = $("#tmRerollBtn");
  const clearBtn    = $("#tmClearBtn");

  const promptEl = $("#tmPrompt");
  const metaEl   = $("#tmModalMeta");

  const copyBtn  = $("#tmCopyInModal");
  const closeBtn = $("#tmClose");
  const closeBtn2= $("#tmClose2");
  const modalBack= $("#tmModalBack");

  // ---------- Mode behavior ----------
  function applyMode(mode){
    if(timelineBlock){
      timelineBlock.classList.toggle("isActive", mode === "timeline");
      timelineBlock.style.display = (mode === "timeline") ? "" : "none";
    }
    if(destinationBlock){
      destinationBlock.classList.toggle("isActive", mode === "teleport");
      destinationBlock.style.display = (mode === "teleport") ? "" : "none";
    }
    updateComputed();
  }

  // ---------- Layout behavior ----------
  function applyLayout(layout){
    // Multi forces scene auto and disables indoor/outdoor
    if(layout === "multi"){
      if(segScene){
        setSegActive(segScene, "auto");
        $$("button.tmSegBtn", segScene).forEach(b=>{
          b.classList.toggle("isDisabled", b.dataset.value !== "auto");
        });
      }
    } else {
      if(segScene){
        $$("button.tmSegBtn", segScene).forEach(b => b.classList.remove("isDisabled"));
      }
    }
  }

  // ---------- Era bucketing ----------
  function eraBucket(yearAbs, isPast){
    // yearAbs is positive integer magnitude
    if(isPast){
      if(yearAbs >= 3000) return "Deep Ancient World";
      if(yearAbs >= 1200) return "Ancient Era";
      if(yearAbs >= 500)  return "Classical Antiquity";
      if(yearAbs >= 1)    return "Late Antiquity";
      return "Deep Past";
    }
    if(yearAbs >= 2600) return "Far Future";
    if(yearAbs >= 2200) return "Deep Future";
    if(yearAbs >= 2050) return "Near Future";
    if(yearAbs >= 2040) return "2040s";
    if(yearAbs >= 2030) return "2030s";
    if(yearAbs >= 2020) return "2020s";
    if(yearAbs >= 2010) return "2010s";
    if(yearAbs >= 2000) return "2000s";
    if(yearAbs >= 1990) return "1990s";
    if(yearAbs >= 1980) return "1980s";
    if(yearAbs >= 1970) return "1970s";
    if(yearAbs >= 1960) return "1960s";
    if(yearAbs >= 1950) return "1950s";
    if(yearAbs >= 1940) return "1940s";
    if(yearAbs >= 1930) return "1930s";
    if(yearAbs >= 1920) return "1920s";
    if(yearAbs >= 1910) return "1910s";
    if(yearAbs >= 1900) return "Early 1900s";
    if(yearAbs >= 1800) return "1800s";
    if(yearAbs >= 1600) return "Early Modern";
    if(yearAbs >= 1000) return "Medieval Era";
    return "Ancient/Classic Era";
  }

  // ---------- Readout: computed destination + era ----------
  function updateComputed(){
    const mode = getSegValue(segMode) || "timeline";
    let computedText = "—";
    let eraText = "—";

    if(mode === "timeline"){
      const by = parseIntSafe(birthYearEl?.value);
      const age = parseIntSafe(ageMemEl?.value);
      if(by !== null && age !== null){
        const y = by + age;
        computedText = String(y);
        eraText = eraBucket(Math.abs(y), false);
      }
    } else {
      const dy = parseIntSafe(destYearEl?.value);
      const dir = getSegValue(segDirection) || "past";
      if(dy !== null){
        const absY = Math.abs(dy);
        computedText = (dir === "past") ? `${absY} BCE` : `${absY} CE`;
        eraText = eraBucket(absY, dir === "past");
      }
    }
    if(destComputedEl) destComputedEl.textContent = computedText;
    if(eraEl) eraEl.textContent = eraText;
  }

  // ---------- Random pools ----------
  const EXPRESSIONS = [
    "soft smile",
    "laughing mid-moment",
    "curious and observant",
    "surprised reaction",
    "focused concentration",
    "playful mischief",
    "serious cinematic stare",
    "nostalgic reflective look",
    "excited but natural",
    "confused but amused",
    "tired/over-it (realistic)",
    "proud confident energy"
  ];

  const CAMERA = [
    "wide environmental lifestyle shot (show the world around them)",
    "medium shot with strong environment detail",
    "35mm film candid snapshot look",
    "disposable camera flash look (era-accurate)",
    "cinematic memory still (shallow depth of field, but wide enough to show props)",
    "documentary lifestyle photo look"
  ];

  const ANGLES = [
    "eye-level candid angle",
    "slight low angle (heroic but realistic)",
    "high angle (nostalgic overhead vibe)",
    "over-the-shoulder angle showing surroundings",
    "three-quarter angle with strong set dressing",
    "wide establishing shot with the person not filling the frame"
  ];

  const LIGHTING = [
    "warm indoor tungsten lighting",
    "bright daylight sun",
    "golden hour glow",
    "soft overcast daylight",
    "neon nightlife lighting (only if adult + appropriate scene)",
    "moody cinematic side light",
    "flash photography lighting (era-correct)"
  ];

  // Scene buckets (we instruct country + era adapt these)
  const SCENES_INDOOR = [
    "family living room memory",
    "bedroom memory space",
    "school hallway / classroom moment",
    "arcade interior hangout",
    "movie rental store aisle / media shop",
    "retro diner booth / restaurant interior",
    "mall interior / food court",
    "bowling alley interior",
    "library stacks moment",
    "record store / music shop interior",
    "museum/gallery interior"
  ];
  const SCENES_OUTDOOR = [
    "neighborhood street scene",
    "playground / park moment",
    "beach boardwalk / promenade",
    "county fairgrounds / festival",
    "downtown sidewalk scene",
    "drive-in theater lot",
    "sports field / court moment",
    "school parking lot hangout",
    "theme park entrance",
    "city rooftop view"
  ];

  // Future anchors (strong)
  const FUTURE_2030s_2040s = [
    "AR wayfinding overlays on signage (in-world, not UI text on the person)",
    "smart glass storefronts and dynamic e-ink posters",
    "autonomous vehicles and micro-mobility lanes",
    "wearable tech integrated into clothing (subtle, stylish)",
    "charging infrastructure and modern sustainable materials",
    "robotic delivery pods / drones in the background",
    "modular furniture and contemporary architecture lines",
    "holographic product displays (tasteful, realistic)",
    "clean modern typography on billboards (era-appropriate)"
  ];

  // Past anchors (strong)
  const PAST_ANCHORS = [
    "era-accurate street signage, typography, and store branding style for that year",
    "period-correct vehicles, streetlights, and architecture silhouettes",
    "authentic materials (wood, metal, paper) consistent with that era",
    "era-correct consumer products, packaging, and media formats",
    "authentic hair, wardrobe, and accessories trends for that year"
  ];

  // Country lock (strong, generic but effective)
  function countryRules(country){
    const c = country && country !== "auto" ? country : "Auto (match the user’s country context naturally)";
    return `
COUNTRY LOCK (MANDATORY): The scene MUST clearly be set in ${c}. Use country-accurate architecture, street markings, signage conventions, store types, product packaging styles, foods/snacks, vehicles, and cultural details for that time period.
FORBIDDEN: do NOT include obvious cues from a different country (wrong road signs/markings, wrong emergency vehicles, wrong storefront conventions, wrong currency/receipts, wrong slang/branding style).`;
  }

  // Scrapbook per decade + age (adult is rich, not minimal)
  function scrapbookStyle(targetYearAbs, isPast, ageNumber){
    // Determine decade-ish bucket for palettes and ephemera
    const decade = (!isPast && targetYearAbs >= 1900 && targetYearAbs < 2100) ? Math.floor(targetYearAbs/10)*10 : null;

    const ageBand =
      (ageNumber !== null && ageNumber <= 12) ? "kid" :
      (ageNumber !== null && ageNumber <= 19) ? "teen" :
      (ageNumber !== null && ageNumber <= 35) ? "youngAdult" :
      (ageNumber !== null && ageNumber <= 60) ? "adult" : "olderAdult";

    const baseAdultRich = [
      "layered ticket stubs, receipts, postcards, handwritten notes, and film strips around the border",
      "polaroid-style frames + taped corners + subtle paper grain with real shadows",
      "era-accurate ephemera (menus, flyers, brochures, transit tickets) as border accents",
      "beautiful layered scrapbook papers (not minimal), tasteful but detailed"
    ];

    const kidExtras = [
      "stickers, doodles, school paper edges, playful cutouts, kid-style handwriting on border",
      "toy catalog snippets, candy wrappers, playful patterns on scrapbook paper"
    ];
    const teenExtras = [
      "concert stubs, magazine cutouts, trend stickers, mixtape/playlist ephemera, bold accents",
      "notebook paper edges, teen-style scribbles, fashion/music clippings"
    ];
    const olderExtras = [
      "travel postcards, newspaper clippings, family photo corners, time-worn paper textures",
      "handwritten letters, keepsake tags, vintage stamps on border"
    ];

    const decadeLooks = {
      1950: ["soft pastels + diner motifs", "classic paper textures + mid-century patterns"],
      1960: ["mod color blocks + groovy shapes", "warm tones + vintage magazine clippings"],
      1970: ["earth tones + retro patterns", "sun-faded paper + film strip borders"],
      1980: ["neon accents + geometric shapes", "arcade/VHS motifs + bold sticker pops"],
      1990: ["bright playful palettes + collage cutouts", "teen magazine vibe + bubble shapes"],
      2000: ["metallic accents + glossy stickers", "early-digital motifs + photo booth strip borders"],
      2010: ["washi tape + clean scrapbook layers", "pastel gradients + modern journaling cards"],
      2020: ["sleek layered paper + modern travel ephemera", "high-contrast accents + minimalist-but-detailed collage"]
    };

    const futureScrap = [
      "futuristic scrapbook frame using holographic acetate layers, translucent tabs, luminous edge highlights",
      "e-ink style caption tags on the border, glossy smart-material texture, neon-but-tasteful accents",
      "AR label markers as border elements (not over the person), modern geometric overlays"
    ];

    const ancientScrap = [
      "parchment-like border textures, wax seals, inked notes, aged paper layers, classical motifs",
      "hand-torn edges, stamped markings, museum-style caption labels on the frame"
    ];

    let paletteLine = "";
    if(isPast && targetYearAbs >= 1 && targetYearAbs < 1900) paletteLine = pick(ancientScrap);
    else if(!isPast && targetYearAbs >= 2030) paletteLine = pick(futureScrap);
    else if(decade && decadeLooks[decade]) paletteLine = pick(decadeLooks[decade]);
    else paletteLine = pick(baseAdultRich);

    let ageLine = "";
    if(ageBand === "kid") ageLine = pick(kidExtras);
    else if(ageBand === "teen") ageLine = pick(teenExtras);
    else if(ageBand === "olderAdult") ageLine = pick(olderExtras);
    else ageLine = pick(baseAdultRich);

    return `SCRAPBOOK STYLE (ERA + AGE MATCHED): ${paletteLine}. Also include: ${ageLine}.`;
  }

  // Women vs men appearance rules
  function genderAppearance(gender){
    if(gender === "woman"){
      const makeup = [
        "glamorous makeup (defined lashes, contour, gloss)",
        "soft glam with luminous skin and defined lashes",
        "bold glam with dramatic eyeliner and glossy lips",
        "editorial glam with sculpted contour and highlight",
        "smoky eye glam with glossy lips",
        "high-fashion glam makeup with sharp liner"
      ];
      const hair = [
        "voluminous waves",
        "sleek straight hair",
        "high ponytail with volume",
        "messy-chic editorial hair",
        "polished curls",
        "half-up glam style",
        "wind-blown cinematic hair"
      ];
      return `WOMAN STYLING: ${pick(makeup)}; hair: ${pick(hair)}.`;
    }
    const hair = [
      "clean modern haircut",
      "textured hairstyle",
      "slicked-back hair",
      "short fade haircut",
      "slightly messy styled hair",
      "classic side-part"
    ];
    const facial = [
      "clean-shaven",
      "light stubble",
      "trimmed beard",
      "full beard (well-groomed)",
      "mustache (well-groomed)"
    ];
    return `MAN STYLING: NO makeup. Masculine styling only. Hair: ${pick(hair)}. Facial hair: ${pick(facial)}.`;
  }

  // Age mode rule: stronger
  function ageModeRule(ageMode, ageNumber, mode){
    if(ageMode === "uploaded"){
      return `IDENTITY AGE RULE: Keep the uploaded person’s apparent age consistent with the uploaded photo (strong face lock). Do NOT force de-aging/aging. Instead, make the WORLD (wardrobe, props, tech, environment) match the target year perfectly.`;
    }
    // age-match ON
    if(ageNumber === null){
      return `IDENTITY AGE RULE: Age-match styling to the selected time (youth/older cues) while preserving exact identity (no drift). Use realistic, subtle aging cues and era-appropriate grooming.`;
    }
    return `IDENTITY AGE RULE (AGE-MATCH ON): Adjust the person’s apparent age to approximately ${ageNumber} years old using realistic age cues WHILE preserving identity (no drift). Do NOT turn them into a different person.`;
  }

  // Add a STAMP caption rule (name/country/date/age) on border only
  function buildStamp(name, country, mode, targetLabel, ageNumber){
    const parts = [];
    if(name) parts.push(`NAME: ${name}`);
    if(country && country !== "auto") parts.push(`COUNTRY: ${country}`);
    else parts.push(`COUNTRY: AUTO`);
    if(mode === "timeline"){
      if(ageNumber !== null) parts.push(`DATE: ${targetLabel} • AGE: ${ageNumber}`);
      else parts.push(`DATE: ${targetLabel} • AGE: (computed)`);
    } else {
      parts.push(`DATE: ${targetLabel}`);
    }
    return `STAMP (MANDATORY): Put this as small caption text on the scrapbook frame/border ONLY (never over the person): ${parts.join(" | ")}.`;
  }

  // Multi panel spec list (forces uniqueness)
  function buildMultiPanels(targetLabel, country, isPast){
    const panels = [];
    const indoorPick = () => pick(SCENES_INDOOR);
    const outdoorPick = () => pick(SCENES_OUTDOOR);
    const scenes = [
      pick([indoorPick(), outdoorPick()]),
      pick([indoorPick(), outdoorPick()]),
      pick([indoorPick(), outdoorPick()]),
      pick([indoorPick(), outdoorPick()])
    ];

    // Ensure variety by nudging different scene types
    const angles = [
      "wide establishing shot",
      "medium interaction shot",
      "over-the-shoulder environment reveal",
      "low-angle hero + background detail"
    ];

    const comps = [
      "person takes up only ~30–45% of the frame; environment/objects are dominant",
      "lots of set dressing visible; era objects are clearly readable",
      "include multiple era props, signage, and background details",
      "show the location as the main character"
    ];

    for(let i=0;i<4;i++){
      panels.push(
        `PANEL ${i+1}: ${scenes[i]} • ${angles[i]} • ${comps[i]} • completely different outfit, hair, pose, expression, lighting, and camera angle than the other panels.`
      );
    }

    return `MULTI-PANEL LAYOUT: 4 panels. RULE: every panel must be a totally different moment. No repeats. ${panels.join(" ")}`;
  }

  // ---------- Prompt builder ----------
  function buildPrompt(){
    const subject   = getSegValue(segSubject) || "adult";
    const gender    = getSegValue(segGender)  || "woman";
    const mode      = getSegValue(segMode)    || "timeline";
    const dir       = getSegValue(segDirection) || "past";
    const ageMode   = getSegValue(segAgeMode) || "uploaded";
    const sceneSel  = getSegValue(segScene)   || "auto";
    const layout    = getSegValue(segLayout)  || "single";
    const scrapLvl  = getSegValue(segScrap)   || "low";
    const quoteOn   = quoteEl ? quoteEl.checked : true;

    const name = nameEl ? nameEl.value.trim() : "";
    const country = countryEl ? countryEl.value : "auto";

    // Determine target year + label + age for stamping and styling
    let targetLabel = "";
    let targetAbsYear = null;
    let isPast = false;
    let ageNumber = null;

    if(mode === "timeline"){
      const by = parseIntSafe(birthYearEl?.value);
      const memAge = parseIntSafe(ageMemEl?.value);
      ageNumber = memAge;
      if(by !== null && memAge !== null){
        const y = by + memAge;
        targetAbsYear = Math.abs(y);
        targetLabel = String(y);
        isPast = false; // timeline treated as CE years
      } else {
        targetLabel = "computed from birth year + age";
      }
    } else {
      const dy = parseIntSafe(destYearEl?.value);
      isPast = (dir === "past");
      if(dy !== null){
        targetAbsYear = Math.abs(dy);
        targetLabel = isPast ? `${Math.abs(dy)} BCE` : `${Math.abs(dy)} CE`;
      } else {
        targetLabel = isPast ? "BCE destination year" : "CE destination year";
      }
    }

    const eraText = (targetAbsYear !== null) ? eraBucket(targetAbsYear, isPast) : "—";

    // Scene rules
    const sceneRule = (() => {
      if(layout === "multi"){
        return `SCENE RULE: Auto — each panel may be indoor or outdoor and must differ.`;
      }
      if(sceneSel === "indoor") return `SCENE RULE: Indoor environment only.`;
      if(sceneSel === "outdoor") return `SCENE RULE: Outdoor environment only.`;
      return `SCENE RULE: Auto — choose the best fit for the era.`;
    })();

    // Composition = SEE MORE era stuff
    const compositionRule =
      `COMPOSITION (MANDATORY): Prioritize the environment + era objects. The person must NOT fill the frame. Show lots of background detail, props, signage, and culturally accurate objects that clearly represent the selected time.`;

    // Future/Past anchors
    const timeAnchors = (() => {
      if(isPast) return `PAST ERA ANCHORS (MANDATORY): ${PAST_ANCHORS.join("; ")}.`;
      if(targetAbsYear !== null && targetAbsYear >= 2030 && targetAbsYear < 2050){
        return `FUTURE ERA ANCHORS (MANDATORY): ${FUTURE_2030s_2040s.join("; ")}.`;
      }
      return `ERA ANCHORS (MANDATORY): include multiple clearly readable objects, tech, decor, and styling cues that scream ${eraText} without using real brand logos.`;
    })();

    // Scrapbook instruction
    let scrapbookLine = `SCRAPBOOK: Off.`;
    if(scrapLvl !== "off"){
      scrapbookLine = scrapbookStyle(targetAbsYear ?? 2000, isPast, ageNumber);
      scrapbookLine += ` Frame rule: scrapbook elements must stay on the BORDER/FRAME area only and never cover the face/body.`;
      scrapbookLine += ` Colors/materials MUST adapt to the era and age, and must change every generation.`;
    }

    // Multi vs single directive
    const multiDirective = (layout === "multi")
      ? buildMultiPanels(targetLabel, country, isPast)
      : `ONE CINEMATIC FRAME ONLY.`;

    // Child safety
    const childLine = (subject === "child")
      ? `CHILD MODE (MANDATORY): age-appropriate and safe; no adult nightlife/sexualized styling; child-appropriate locations and activities for the selected time period.`
      : "";

    // Age-mode rule (strong)
    const ageRule = ageModeRule(ageMode, ageNumber, mode);

    // Gender appearance rule
    const genderLine = genderAppearance(gender);

    // Quote
    const quotes = [
      "“Memories are portals.”",
      "“Time keeps what matters.”",
      "“A moment, perfectly saved.”",
      "“Some years never leave you.”",
      "“Back then felt like forever.”"
    ];
    const quoteLine = quoteOn
      ? `OPTIONAL QUOTE: Place a small quote on the frame/border only: ${pick(quotes)}`
      : "";

    // Stamp line (Name + Country + Date (+Age))
    const stampLine = buildStamp(name, country, mode, targetLabel, ageNumber);

    // Expression + camera + lighting are still randomized, but must match scene
    const expression = pick(EXPRESSIONS);
    const camStyle = pick(CAMERA);
    const camAngle = pick(ANGLES);
    const light = pick(LIGHTING);

    // Prompt start EXACTLY how you like
    const prompt =
`Using the uploaded photo for complete facial and body reference create a fully cinematic nostalgic memory scene where the uploaded person appears as the central figure. Preserve the exact facial structure, body proportions, and identity with no identity drift. Ultra-realistic photography with natural skin texture, real hair strands, authentic fabric textures, realistic environmental lighting, 300 DPI.

${stampLine}

TIME TARGET: ${targetLabel} • ERA: ${eraText}.
${countryRules(country)}

ERA ADAPTATION (MANDATORY): Everything must match the selected time and country: environments, architecture, clothing, hairstyles, grooming, accessories, props, technology, entertainment, vehicles, food/snacks, signage style, and cultural details. Avoid mismatched eras.

${compositionRule}
${sceneRule}

${multiDirective}

DIRECTION FOR VISUAL STORY: The subject is actively interacting with the environment (not just standing). Facial expression must match the moment: ${expression}.
CAMERA: ${camStyle}. ANGLE: ${camAngle}. LIGHTING: ${light}. Keep backgrounds detailed and readable.

${genderLine}
${childLine}
${ageRule}

WARDROBE/HAIR/MAKEUP/PROPS MUST MATCH THE ERA: Use era/decade-appropriate styling for the selected time. Every generation must completely change wardrobe, hairstyle, pose, angle, lighting, environment, and story moment.

${scrapbookLine}
${quoteLine}

Signature placement mandatory: Fauxbulous/RLD very small in the extreme bottom-left corner.`;

    return { prompt, meta: `Target: ${targetLabel} • Era: ${eraText} • Country: ${country === "auto" ? "Auto" : country} • Layout: ${layout}` };
  }

  // ---------- Actions ----------
  function doTeleport(){
    updateComputed();
    const out = buildPrompt();
    if(promptEl) promptEl.value = out.prompt;
    if(metaEl) metaEl.textContent = out.meta;
    openModal();
  }
  function doReroll(){
    doTeleport();
  }
  function doClear(){
    // defaults
    setSegActive(segSubject, "adult");
    setSegActive(segGender, "woman");
    setSegActive(segMode, "timeline");
    setSegActive(segDirection, "past");
    setSegActive(segAgeMode, "uploaded");
    setSegActive(segScene, "auto");
    setSegActive(segLayout, "single");
    setSegActive(segScrap, "low");

    // enable scene options again
    if(segScene) $$("button.tmSegBtn", segScene).forEach(b => b.classList.remove("isDisabled"));

    if(nameEl) nameEl.value = "";
    if(countryEl) countryEl.value = "auto";
    if(birthYearEl) birthYearEl.value = "";
    if(ageMemEl) ageMemEl.value = "";
    if(destYearEl) destYearEl.value = "";
    if(quoteEl) quoteEl.checked = true;

    applyMode("timeline");
    applyLayout("single");
    updateComputed();

    if(promptEl) promptEl.value = "";
    closeModal();
  }

  // ---------- Wiring ----------
  wireSeg(segSubject);
  wireSeg(segGender);
  wireSeg(segAgeMode);
  wireSeg(segMode, applyMode);
  wireSeg(segDirection, updateComputed);
  wireSeg(segLayout, applyLayout);
  wireSeg(segScene);
  wireSeg(segScrap);

  if(birthYearEl) birthYearEl.addEventListener("input", updateComputed);
  if(ageMemEl) ageMemEl.addEventListener("input", updateComputed);
  if(destYearEl) destYearEl.addEventListener("input", updateComputed);

  if(teleportBtn) teleportBtn.addEventListener("click", doTeleport);
  if(rerollBtn) rerollBtn.addEventListener("click", doReroll);
  if(clearBtn) clearBtn.addEventListener("click", doClear);

  if(copyBtn) copyBtn.addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(promptEl ? promptEl.value : "");
      copyBtn.textContent = "COPIED!";
      setTimeout(() => copyBtn.textContent = "COPY PROMPT", 900);
    }catch(e){
      copyBtn.textContent = "COPY FAILED";
      setTimeout(() => copyBtn.textContent = "COPY PROMPT", 1200);
    }
  });

  if(closeBtn) closeBtn.addEventListener("click", closeModal);
  if(closeBtn2) closeBtn2.addEventListener("click", closeModal);
  if(modalBack) modalBack.addEventListener("click", (e) => {
    if(e.target === modalBack) closeModal();
  });

  // ---------- Init ----------
  applyMode(getSegValue(segMode) || "timeline");
  applyLayout(getSegValue(segLayout) || "single");
  updateComputed();
})();