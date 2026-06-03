
      /**
  * MODIFIED: Normalizes game results for games requiring 3 levels.
  * If less than 3 results exist, it duplicates the first recorded result (data[0]) 
  * until the array length is 3.
  */
  function normalizeGameResults(key) {
      let data = JSON.parse(localStorage.getItem(key)) || [];

      // Game untouched if it has 0 levels played
      if (data.length === 0) return;

      // Determine expected levels for this game (number_order_tap has only 2)
      const expectedLevels = key === 'number_order_tap' ? 2 : 3;

      // If there are missing slots (null/undefined) or fewer entries than expected,
      // fill them using the first available non-empty result as a fallback.
      const hasEmptySlots = data.slice(0, expectedLevels).some((d) => !d);
      if (data.length < expectedLevels || hasEmptySlots) {
          // Find a fallback entry (first non-empty)
          const fallback = data.find((d) => d && typeof d === 'object');
          if (!fallback) return; // nothing sensible to duplicate

          const filled = [];
          for (let i = 0; i < expectedLevels; i++) {
              if (data[i] && typeof data[i] === 'object') filled[i] = data[i];
              else filled[i] = { ...fallback };
          }
          data = filled;
      }

      localStorage.setItem(key, JSON.stringify(data));
  }

  // Only these games should have results duplicated to 3 levels
  const gamesNeedingDuplication = [
      "bubble_math_pop", 
      "color_fuse",
      "direction_dash",
      "lightning_tap",
      "math_burst",
      "memory_match",
      "multiples_tap", 
      "shape_pop", // ADDED
      "speed_tap", // ADDED
  ];

  // FIX: Ensure that renderGames() runs, and THEN the listeners are attached.
  window.onload = function () {
      loadState();
      document.getElementById("userId").textContent = state.userId;
      document.getElementById("sessionId").textContent = state.sessionId;
      
      // Check if user is logged in
      const userAccount = localStorage.getItem("user_account");
      if (userAccount) {
          const account = JSON.parse(userAccount);
          document.getElementById("userId").textContent = account.name;
          document.getElementById("profileLetter").textContent = account.name.charAt(0).toUpperCase();
          document.getElementById("profileContainer").style.display = "block";
          document.getElementById("authButtons").style.display = "none";
          document.getElementById("logoutBtn").style.display = "none"; // since in dropdown
      } else {
          document.getElementById("userId").textContent = "Guest";
          document.getElementById("profileContainer").style.display = "none";
      }
      
      renderGames(); // 1. This creates the Play buttons
      
      // collect game results that other pages left in localStorage
      collectAllGameResults(); // 2. Load any data from localStorage
      
      updateProgress();
      renderPreview();
      updateAnalyzePanel();
      
      setupGameButtonListeners(); // 3. This attaches the event listeners to the new buttons
      initSpeechRecognition(); // 4. Initialize speech recognition
      
      // collect game results that other pages left in localStorage
      collectAllGameResults(); // 2. Load any data from localStorage
      
      updateProgress();
      renderPreview();
      updateAnalyzePanel();
      
      setupGameButtonListeners(); // 3. This attaches the event listeners to the new buttons
      initSpeechRecognition(); // 4. Initialize speech recognition

      renderGames(); // 1. This creates the Play buttons
      
      // collect game results that other pages left in localStorage
      collectAllGameResults(); // 2. Load any data from localStorage
      
      updateProgress();
      renderPreview();
      updateAnalyzePanel();
      
      setupGameButtonListeners(); // 3. This attaches the event listeners to the new buttons
      initSpeechRecognition(); // 4. Initialize speech recognition
  };  


  /* ---------- CONFIG ---------- */
  const TOTAL_CONTENTS = 96;
  const CONTENTS_PER_LEVEL = 3; // each level yields 3 content slots
  // Map of games (file -> storage key -> number of levels)
  const gameMap = [
      { file: "bubble_math_pop.html", key: "bubble_math_pop", levels: 3, isModal: true },
      { file: "color_fuse.html", key: "color_fuse", levels: 3, isModal: true },
      { file: "direction_dash.html", key: "direction_dash", levels: 3, isModal: true },
      { file: "lightning_tap.html", key: "lightning_tap", levels: 3, isModal: true },
      { file: "math_burst.html", key: "math_burst", levels: 3, isModal: true },
      { file: "memory_match.html", key: "memory_match", levels: 3, isModal: true },
      { file: "multiples_tap.html", key: "multiples_tap", levels: 3, isModal: true }, 
      { file: "number_order_tap.html", key: "number_order_tap", levels: 2, isModal: true }, // only 2 levels
      { file: "sequence_memory.html", key: "sequence_memory", levels: 3, isModal: true },
      { file: "shape_pop.html", key: "shape_pop", levels: 3, isModal: true }, // ADDED
      { file: "speed_tap.html", key: "speed_tap", levels: 3, isModal: true }, // ADDED
      { file: "match_rhyming_words.html", key: "match_rhyming_words", levels: 1, isModal: true }, // ADDED
  ];

  // Derived list of functional game keys; keep it global so other listeners can use it
  const functionalGames = gameMap.map(g => g.key);

  const STORAGE_KEY = "dyslab_hub_v1";

  /* ---------- STATE ---------- */
  let state = {
      userId: "demo_user",
      sessionId: `sess_${Date.now()}`,
      collectedRecords: [], // unified records (max TOTAL_CONTENTS)
      modelResult: null, // optional imported model JSON
      finalName: null,
      finalHandwritingOriginal: null,
      finalHandwriting64: null,
  };

  /* ---------- UI refs ---------- */
  const gamesGrid = document.getElementById("gamesGrid");
  const collectedCountEl = document.getElementById("collectedCount");
  const progressFill = document.getElementById("progressFill");
  const jsonInput = document.getElementById("jsonInput");
  const jsonStatus = document.getElementById("jsonStatus");
  const imgUpload = document.getElementById("imgUpload");
  const hPreview = document.getElementById("hPreview");
  const openFinalBtn = document.getElementById("openFinal");
  const downloadAll = document.getElementById("downloadAll");
  const downloadSequential = document.getElementById("downloadSequential");
  const downloadImage = document.getElementById("downloadImage");
  const resetBtn = document.getElementById("resetBtn");
  const validateJsonBtn = document.getElementById("validateJson");
  const importJsonBtn = document.getElementById("importJson");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const analysisStatus = document.getElementById("analysisStatus");
  const predictionResult = document.getElementById("predictionResult");
  const dyslexiaInfo = document.getElementById("dyslexiaInfo");
  const loadingSpinner = document.getElementById("loadingSpinner");

  // SPEECH REFS
  const speechMicBtn = document.getElementById("speechMicBtn");
  const speechIndicator = document.getElementById("speechIndicator");
  const speechOutput = document.getElementById("speechOutput");
  const speechStatus = document.getElementById("speechStatus");

  /* ---------- Speech Recognition ---------- */
  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speechStatus.textContent = "Speech recognition not supported";
      speechMicBtn.disabled = true;
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    speechMicBtn.addEventListener("click", () => {
      if (speechMicBtn.textContent.includes("Start")) {
        speechOutput.value = "";
        speechMicBtn.textContent = "Stop Listening";
        speechStatus.textContent = "Listening...";
        speechIndicator.classList.add("listening");
        recognition.start();
      } else {
        recognition.stop();
      }
    });

    recognition.onstart = () => {
      speechIndicator.classList.add("listening");
      speechStatus.textContent = "Recording...";
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      speechOutput.value = transcript;
      speechStatus.textContent = "Transcribed";
    };

    recognition.onerror = (event) => {
      speechStatus.textContent = "Error: " + event.error;
      speechMicBtn.textContent = "Start Listening";
      speechIndicator.classList.remove("listening");
    };

    recognition.onend = () => {
      speechMicBtn.textContent = "Start Listening";
      speechIndicator.classList.remove("listening");
      if (!speechOutput.value) {
        speechStatus.textContent = "No speech detected";
      }
    };
  }

  /* ---------- load/save ---------- */
  function loadState() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
          try {
              state = JSON.parse(raw);
          } catch (e) {
              console.warn("state load failed", e);
              saveState();
          }
      } else saveState();
  }
  function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      updateAnalyzePanel(); // Save triggers panel update
  }

  /* ---------- Setup Game Modal Listeners (UPDATED) ---------- */
  function setupGameButtonListeners() {
      // Defensive reference to the games grid
      const grid = document.getElementById('gamesGrid') || gamesGrid;
      if (!grid) { console.warn('setupGameButtonListeners: gamesGrid not found'); return; }

      // List of games with fully functional embedded code (uses global `functionalGames` derived from `gameMap`)

      const buttons = grid.querySelectorAll('.levelBtn.play');
      console.log('setupGameButtonListeners: found', buttons.length, 'play buttons');

      // Listener for the grid buttons (Opens the modal)
      buttons.forEach((button, index) => {
          const gm = (typeof gameMap !== 'undefined' && Array.isArray(gameMap)) ? gameMap : (Array.isArray(window.gameMap) ? window.gameMap : []);
          const game = gm[index];
          if (!game) {
              console.warn('setupGameButtonListeners: no game mapping for button index', index);
              return;
          }
          button.addEventListener('click', () => {
              const profile = localStorage.getItem("player_profile");
              const startGame = () => {
                  const modal = document.getElementById(`gameModal-${game.key}`);
                  if (modal) {
                      modal.classList.add('active');

                      // Start embedded game logic if it exists
                      if (game.key === 'bubble_math_pop' && typeof startBubbleMathPop === 'function') {
                          startBubbleMathPop();
                      }
                      if (game.key === 'color_fuse' && typeof startColorFuse === 'function') {
                          startColorFuse();
                      }
                      if (game.key === 'direction_dash' && typeof startDirectionDash === 'function') {
                          startDirectionDash();
                      }
                      if (game.key === 'lightning_tap' && typeof startLightningTap === 'function') {
                          startLightningTap();
                      }
                      if (game.key === 'math_burst' && typeof startMathBurst === 'function') {
                          startMathBurst();
                      }
                      if (game.key === 'memory_match' && typeof startMemoryMatch === 'function') {
                          startMemoryMatch();
                      }
                      if (game.key === 'multiples_tap' && typeof startMultiplesTap === 'function') {
                          startMultiplesTap();
                      }
                      if (game.key === 'number_order_tap' && typeof startNumberOrderTap === 'function') {
                          startNumberOrderTap();
                      }
                      if (game.key === 'sequence_memory' && typeof startSequenceMemory === 'function') {
                          startSequenceMemory();
                      }
                      // ADDED GAMES
                      if (game.key === 'shape_pop' && typeof startShapePop === 'function') {
                          startShapePop();
                      }
                      if (game.key === 'speed_tap' && typeof startSpeedTap === 'function') {
                          startSpeedTap();
                      }
                  }
              };

              if (!profile) {
                  openSignup(startGame);
              } else {
                  startGame();
              }
          });
      });
  }



      // Listener for the "Go Back" buttons inside the modals (Closes modal and simulates data)
      // NOTE: This listener is now effectively for the *old* simulation modals, which were removed. 
      // It remains in the event listener setup for completeness if a new non-functional game is added.
      document.querySelectorAll('.game-content-box .back-btn').forEach(button => {
          button.addEventListener('click', (event) => {
              const gameKey = event.target.getAttribute('data-game-key');
              const levels = parseInt(event.target.getAttribute('data-levels'));
              
              // Only runs for simulated games 
              if (!functionalGames.includes(gameKey)) {
                // 1. Simulate game completion and collect data
                simulateGameDataCollection(gameKey, levels);
                
                // 2. Re-collect all results (which reads the new local storage key)
                collectAllGameResults(); 
                
                // 3. Hide the modal
                const modal = event.target.closest('.game-modal');
                if (modal) {
                    modal.classList.remove('active');
                }
                
                showToast(`Simulated ${levels} levels for ${gameKey}! Collected ${levels * 3} contents.`);
              }
          });
      });

  /**
  * Simulates game data and saves it to localStorage 
  * (to be picked up by collectAllGameResults)
  */
  function simulateGameDataCollection(gameKey, levels) {
      const gameData = [];
      for (let i = 1; i <= levels; i++) {
          // Generate pseudo-random, sensible data for simulation
          const hits = Math.floor(Math.random() * 20) + 10;
          const misses = Math.floor(Math.random() * 5);
          const score = hits * 10 - misses * 5;

          gameData.push({
              level: i,
              hits: hits,
              misses: misses,
              score: score,
              clicks: hits + misses,
              timestamp: new Date().toISOString()
          });
      }
      // Save to the game's specific key
      localStorage.setItem(gameKey, JSON.stringify(gameData));
  }


  /* ---------- render games grid (one card per game file) ---------- */
  function renderGames() {
      const grid = document.getElementById('gamesGrid') || gamesGrid;
      console.log('renderGames called', { gameMapLength: (typeof gameMap !== 'undefined' && Array.isArray(gameMap)) ? gameMap.length : (Array.isArray(window.gameMap) ? window.gameMap.length : 0), gridExists: !!grid });
      if (!grid) {
          console.warn('renderGames: gamesGrid not found in DOM');
          return;
      }
      grid.innerHTML = "";
      const gm = (typeof gameMap !== 'undefined' && Array.isArray(gameMap)) ? gameMap : (Array.isArray(window.gameMap) ? window.gameMap : []);
      gm.forEach((g, idx) => {
          console.log(`renderGames: creating card for ${g.key || g.file} (#${idx})`);
          const card = document.createElement("div");
          card.className = "gameCard";
          card.innerHTML = `<div class="gameTitle">${prettyLabelFromFile(
              g.file
          )}</div>
      <div class="small" style="margin-top:6px;color:var(--muted)">Levels: ${
              g.levels
          }</div>
      <button class="levelBtn play" style="margin-top:10px" data-game-key="${g.key}">Play</button>`;
          grid.appendChild(card);
      });
  }

  // Fallback renderer that forcibly injects cards and attaches handlers directly when nothing rendered
  function forceRenderGames() {
      const grid = document.getElementById('gamesGrid') || gamesGrid;
      if (!grid) return;
      grid.innerHTML = '';
      const gm = (typeof gameMap !== 'undefined' && Array.isArray(gameMap)) ? gameMap : (Array.isArray(window.gameMap) ? window.gameMap : []);
      const list = (gm && gm.length) ? gm : [
          { file: "bubble_math_pop.html", key: "bubble_math_pop", levels: 3 },
          { file: "color_fuse.html", key: "color_fuse", levels: 3 },
          { file: "direction_dash.html", key: "direction_dash", levels: 3 },
          { file: "lightning_tap.html", key: "lightning_tap", levels: 3 },
          { file: "math_burst.html", key: "math_burst", levels: 3 },
          { file: "memory_match.html", key: "memory_match", levels: 3 },
          { file: "multiples_tap.html", key: "multiples_tap", levels: 3 },
          { file: "number_order_tap.html", key: "number_order_tap", levels: 2 },
          { file: "sequence_memory.html", key: "sequence_memory", levels: 3 },
          { file: "shape_pop.html", key: "shape_pop", levels: 3 },
          { file: "speed_tap.html", key: "speed_tap", levels: 3 }
      ];

      list.forEach((g) => {
          const card = document.createElement('div');
          card.className = 'gameCard';
          card.innerHTML = `<div class="gameTitle">${prettyLabelFromFile(g.file)}</div><div class="small" style="margin-top:6px;color:var(--muted)">Levels: ${g.levels}</div><button class="levelBtn play" data-game-key="${g.key}" style="margin-top:10px">Play</button>`;
          grid.appendChild(card);
      });

      // Attach click handlers directly
      grid.querySelectorAll('.levelBtn.play').forEach(btn => {
          const key = btn.getAttribute('data-game-key');
          btn.addEventListener('click', () => {
              const profile = localStorage.getItem('player_profile');
              const start = () => {
                  const modal = document.getElementById(`gameModal-${key}`);
                  if (modal) modal.classList.add('active');
                  try {
                      const fname = 'start' + key.split('_').map((s,i)=> i===0? s: s.charAt(0).toUpperCase()+s.slice(1)).join('');
                      if (typeof window[fname] === 'function') window[fname]();
                  } catch(e) { console.warn('start function call failed for', key, e); }
              };
              if (!profile) {
                  openSignup(start);
              } else start();
          });
      });
  }
  function prettyLabelFromFile(fn) {
      // create nicer labels from filename
      return fn
          .replace(".html", "")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /* ---------- collect results from each game localStorage key ---------- */
  function collectAllGameResults() {
      // Reset records before collecting everything
      state.collectedRecords = []; 

      // iterate known map, parse each known storage key and normalize
      for (const g of gameMap) {
          const before = state.collectedRecords.length;

          if (gamesNeedingDuplication.includes(g.key)) {
              normalizeGameResults(g.key);
          }
          const raw = localStorage.getItem(g.key);
          if (!raw) continue;
          try {
              const parsed = JSON.parse(raw);
              
              // Parsing and normalization logic (as before)
              if (g.key === "memory_match") {
                  if (Array.isArray(parsed)) {
                      parsed.forEach((entry, idx) => {
                          pushNormalizedRecord(g.key, idx + 1, entry);
                      });
                  }
              } else if (g.key === "sequence_memory") {
                  if (Array.isArray(parsed)) {
                      parsed.forEach((log, idx) => {
                          // For sequence_memory, we use the mistakes/duration as core metrics
                          const mistakes = log.mistakes || 0;
                          const score = log.success === 1 ? (100 - mistakes * 5) : 0; // Simple score heuristic
                          pushNormalizedRecord(g.key, idx + 1, { 
                              mistakes: mistakes,
                              score: score,
                              duration: log.duration, // Keep duration as an extra metric
                              raw: log 
                          });
                      });
                  }
              } else {
                  if (Array.isArray(parsed)) {
                      for (let i = 0; i < parsed.length; i++) {
                          const entry = parsed[i];
                          if (!entry) continue;
                          pushNormalizedRecord(g.key, entry.level || i + 1, entry);
                      }
                  } else if (typeof parsed === "object") {
                      pushNormalizedRecord(g.key, parsed.level || 1, parsed);
                  }
              }

              const after = state.collectedRecords.length;
              if (after > before) console.log(`Collected ${after - before} records from ${g.key}`);
              
              // stop if we've reached TOTAL_CONTENTS
              if (state.collectedRecords.length >= TOTAL_CONTENTS) break;
          } catch (e) {
              console.warn("failed parse for", g.key, e);
          }
          // stop if we've reached TOTAL_CONTENTS
          if (state.collectedRecords.length >= TOTAL_CONTENTS) break;
      }
      // trim if longer than needed
      if (state.collectedRecords.length > TOTAL_CONTENTS)
          state.collectedRecords = state.collectedRecords.slice(
              0,
              TOTAL_CONTENTS
          );
      saveState();
      updateProgress(); // Ensure progress bar reflects new total
  }

  /* helper: normalize/append one record */
  function pushNormalizedRecord(gameKey, levelNum, entry) {
      const CONTENTS_PER_LEVEL = 3;

      for (let sub = 0; sub < CONTENTS_PER_LEVEL; sub++) {
          // Prevent adding extra records if we've already hit the total
          if (state.collectedRecords.length >= TOTAL_CONTENTS) return; 

          const id = `${gameKey}_L${levelNum}_${sub}_${Date.now()}_${Math.floor(
              Math.random() * 9999
          )}`;

          const payload = {
              game: gameKey,
              level: levelNum,
              sub
          };

          // If hits/misses/score exist → normalize
          if (entry && typeof entry === "object") {
              if ("hits" in entry || "misses" in entry || "score" in entry || "clicks" in entry) {
                  payload.hits = Number(entry.hits || 0);
                  payload.misses = Number(entry.misses || 0);
                  payload.score = Number(entry.score || 0);
                  payload.clicks = Number(entry.clicks || payload.hits + payload.misses || 0);
              } else if ("mistakes" in entry || "duration" in entry) {
                  // For Sequence Memory
                  payload.mistakes = Number(entry.mistakes || 0);
                  payload.duration = Number(entry.duration || 0);
                  payload.score = Number(entry.score || 0);
                  payload.raw = entry.raw || {};
              }
              else {
                  // If raw JSON → store it
                  payload.raw = entry;
              }
          }

          state.collectedRecords.push({
              id,
              timestamp: new Date().toISOString(),
              payload
          });

          // Logging to confirm
          // console.log("🔥 Saved:", payload);
      }
  }


  /* ---------- progress UI ---------- */
  function updateProgress() {
      const collected = state.collectedRecords.length;
      collectedCountEl.textContent = collected;
      const pct = Math.min(
          100,
          Math.round((collected / TOTAL_CONTENTS) * 100)
      );
      progressFill.style.width = pct + "%";
      openFinalBtn.disabled = collected < TOTAL_CONTENTS;
  }

  /* ---------- Download functions (No changes) ---------- */
  downloadAll.addEventListener("click", () => {
      if (!state.collectedRecords.length)
          return showToast("No records to download");
      const blob = new Blob(
          [
              JSON.stringify(
                  {
                      meta: { user: state.userId, session: state.sessionId },
                      records: state.collectedRecords,
                  },
                  null,
                  2
              ),
          ],
          { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${state.userId}_${state.sessionId}_records.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
  });

  /* * Build sequential array of length TOTAL_CONTENTS:
  * prefer numeric fields (score/hits/clicks) if present; otherwise fall back to deterministic hash -> float.
  */
  function buildSequentialArray(records) {
      return records.slice(0, TOTAL_CONTENTS).map(record => {
          const p = record.payload;
          if ('score' in p && typeof p.score === 'number') {
              return p.score;
          }
          if ('hits' in p && 'misses' in p && typeof p.hits === 'number' && typeof p.misses === 'number') {
              // Simple heuristic for games with hits/misses
              return p.hits - p.misses; 
          }
          if ('clicks' in p && typeof p.clicks === 'number') {
              return p.clicks;
          }
          
          // Fallback: simple deterministic hash (not cryptographically secure, just ensures a non-zero float)
          const str = JSON.stringify(record);
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
              const char = str.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash |= 0; // Convert to 32bit integer
          }
          // Map 32-bit integer range to a float between 0 and 100 (for display/demo)
          return Math.abs(hash % 1000) / 10;
      });
  }

  downloadSequential.addEventListener("click", () => {
      if (state.collectedRecords.length < TOTAL_CONTENTS) {
          return showToast(
              `Need ${TOTAL_CONTENTS} contents. You have ${state.collectedRecords.length}`
          );
      }

      const arr = buildSequentialArray(state.collectedRecords);

      // clean JSON wrapper
      const wrapper = { data: arr };
      const jsonText = JSON.stringify(wrapper, null, 2);

      const blob = new Blob([jsonText], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${state.userId}_${state.sessionId}_sequential.json`; // SAFE EXTENSION
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
  });

  /* Download processed handwriting 64x64 grayscale image */
  downloadImage.addEventListener("click", () => {
      if (!state.finalHandwriting64)
          return showToast("No processed handwriting image saved yet");
      fetch(state.finalHandwriting64)
          .then((res) => res.blob())
          .then((blob) => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${state.userId}_${state.sessionId}_handwriting_64.png`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
          });
  });

  /* reset */
  resetBtn.addEventListener("click", () => {
      if (!confirm("Reset demo progress and local saved data?")) return;
      state.collectedRecords = [];
      state.modelResult = null;
      state.finalName = null;
      state.finalHandwritingOriginal = null;
      state.finalHandwriting64 = null;

      // Clear all game specific localStorage keys
      gameMap.forEach(g => localStorage.removeItem(g.key));

      saveState();
      updateProgress();
      renderPreview();
      showToast("State reset");
  });

  /* JSON validate/import */
  validateJsonBtn.addEventListener("click", () => {
      const raw = jsonInput.value.trim();

      try {
          const parsed = JSON.parse(raw);

          let arr = null;

          // Case 1: raw array
          if (Array.isArray(parsed)) {
              arr = parsed;
          }

          // Case 2: wrapped JSON { data: [...] }
          else if (parsed && Array.isArray(parsed.data)) {
              arr = parsed.data;
          }

          if (!arr) {
              showToast("JSON must be an array of 96 numbers or { data: [...] }");
              return;
          }

          if (arr.length === TOTAL_CONTENTS) {
              jsonStatus.textContent = "Valid JSON (96 elements)";
              jsonStatus.style.color = "var(--accent2)";
              showToast(`Valid! Array length = ${arr.length}`);
          } else {
              jsonStatus.textContent = `Invalid Length (${arr.length})`;
              jsonStatus.style.color = "#ffbfa8";
              showToast(`Array length ${arr.length}, expected ${TOTAL_CONTENTS}`);
          }
      } catch (e) {
          jsonStatus.textContent = "Invalid JSON syntax";
          jsonStatus.style.color = "#ffbfa8";
          showToast("Invalid JSON");
      }
  });

  importJsonBtn.addEventListener("click", () => {
      const raw = jsonInput.value.trim();
      try {
          const parsed = JSON.parse(raw);

          const arr = Array.isArray(parsed)
              ? parsed
              : parsed && Array.isArray(parsed.data)
              ? parsed.data
              : null;

          if (!arr) {
              return showToast("JSON must be an array or { data: [...] }");
          }

          if (arr.length !== TOTAL_CONTENTS) {
              return showToast(
                  `Array length ${arr.length}, expected ${TOTAL_CONTENTS}`
              );
          }

          state.modelResult = arr;
          saveState();
          jsonStatus.textContent = "Imported (96 elements)";
          jsonStatus.style.color = "var(--accent2)";
          showToast("Model result imported!");
      } catch (e) {
          showToast("Invalid JSON");
      }
  });

  /* ---------- image upload preview ---------- */
  imgUpload.addEventListener("change", (ev) => {
      const f = ev.target.files && ev.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
          state.finalHandwritingOriginal = reader.result;
          // Process image after loading original size
          create64GrayscaleFromDataUrl(reader.result).then((data64) => {
              state.finalHandwriting64 = data64;
              saveState();
              renderPreview();
              showToast(
                  "Uploaded image processed to 64×64 grayscale (stored locally)"
              );
          });
      };
      reader.readAsDataURL(f);
  });

  /* ---------- Final Handwriting Task (Option A) ---------- */
  openFinalBtn.addEventListener("click", () => openFinalTask());

  function openFinalTask() {
      const modal = document.createElement("div");
      Object.assign(modal.style, {
          position: "fixed",
          inset: 0,
          background: "rgba(2,6,20,0.92)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
      });
      const box = document.createElement("div");
      Object.assign(box.style, {
          width: "92%",
          maxWidth: "760px",
          background: "#071028",
          borderRadius: "12px",
          padding: "14px",
          textAlign: "center",
          color: "#dff7ff",
      });
      box.innerHTML = `
      <div style="font-family:'Fredoka One';font-size:20px;margin-bottom:10px">Final Handwriting Task — Write Your Name</div>
      <div class="small" style="margin-bottom:8px">Type your name (minimum 4 letters). Once valid, draw your name between the two guide lines.</div>
      <input id="nameInput" placeholder="Type your name here (min 4 chars)" style="width:70%;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);margin-bottom:10px" />
      <div style="display:flex;justify-content:center;margin-bottom:10px">
        <canvas id="writeCanvas" width="640" height="240" style="border-radius:10px;background:#fff;touch-action:none;"></canvas>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:6px">
        <button id="saveWriteBtn" style="padding:10px 12px;border-radius:8px;background:linear-gradient(90deg,var(--accent2),var(--accent1));border:none;color:#021024;font-weight:800">Save</button>
        <button id="clearWriteBtn" style="padding:10px 12px;border-radius:8px;background:#233047;border:none;color:#cfeeff">Clear</button>
        <button id="closeWriteBtn" style="padding:10px 12px;border-radius:8px;background:#333;border:none;color:#cfeeff">Close</button>
      </div>
      <div class="small" style="margin-top:8px;color:#ffd6a6">Note: Drawing is guided by two lines — we do not reject drawings outside the lines but please write between them.</div>
  `;
      modal.appendChild(box);
      document.body.appendChild(modal);

      const canvas = box.querySelector("#writeCanvas");
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const upperLineY = 80;
      const lowerLineY = 160;
      function drawGuides() {
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = "#d8d8d8";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, upperLineY);
          ctx.lineTo(canvas.width, upperLineY);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, lowerLineY);
          ctx.lineTo(canvas.width, lowerLineY);
          ctx.stroke();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = "#f1f1f1";
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(0, (upperLineY + lowerLineY) / 2);
          ctx.lineTo(canvas.width, (upperLineY + lowerLineY) / 2);
          ctx.stroke();
          ctx.setLineDash([]);
      }
      drawGuides();

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      let drawing = false;
      function getCursorPosition(e) {
          const rect = canvas.getBoundingClientRect();
          return {
              x: (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left,
              y: (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top,
          };
      }
      function startDraw(e) {
          if (!nameValid()) {
              alert(
                  "Please enter a name with at least 4 characters before drawing"
              );
              return;
          }
          drawing = true;
          const pos = getCursorPosition(e);
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          draw(e); // Draw a single point at click location
      }
      function draw(e) {
          if (!drawing) return;
          const pos = getCursorPosition(e);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
      }
      function stopDraw() {
          drawing = false;
          ctx.beginPath();
      }

      // Setup drawing listeners
      canvas.addEventListener("mousedown", (e) => startDraw(e));
      canvas.addEventListener("mousemove", (e) => draw(e));
      canvas.addEventListener("mouseup", stopDraw);
      canvas.addEventListener("mouseout", stopDraw);
      canvas.addEventListener("touchstart", (e) => {
          e.preventDefault();
          startDraw(e);
      }, { passive: false });
      canvas.addEventListener("touchmove", (e) => {
          e.preventDefault();
          draw(e);
      }, { passive: false });
      canvas.addEventListener("touchend", stopDraw);

      const nameInput = box.querySelector("#nameInput");
      const saveWriteBtn = box.querySelector("#saveWriteBtn");
      const clearWriteBtn = box.querySelector("#clearWriteBtn");
      const closeWriteBtn = box.querySelector("#closeWriteBtn");

      // Name validation helper
      const nameValid = () => nameInput.value.trim().length >= 4;

      // Restore name if previously saved
      if (state.finalName) nameInput.value = state.finalName;

      // Restore saved drawing if available
      if (state.finalHandwritingOriginal) {
          const img = new Image();
          img.onload = () => {
              drawGuides(); // Redraw lines first
              ctx.drawImage(img, 0, 0); // Draw saved content on top
          };
          img.src = state.finalHandwritingOriginal;
      }

      clearWriteBtn.addEventListener("click", () => drawGuides());

      saveWriteBtn.addEventListener("click", () => {
          if (!nameValid()) {
              return alert("Name must be at least 4 characters.");
          }

          // Save original size image
          state.finalHandwritingOriginal = canvas.toDataURL("image/png");
          state.finalName = nameInput.value.trim();

          // Create and save 64x64 grayscale version
          create64GrayscaleFromCanvas(canvas).then((data64) => {
              state.finalHandwriting64 = data64;
              saveState();
              showToast("Handwriting saved and processed!");
              renderPreview();
              modal.remove();
          });
      });

      closeWriteBtn.addEventListener("click", () => modal.remove());
  }


  /* ---------- Utility Functions ---------- */

  // Toast notification (basic)
  let toastTimeout;
  function showToast(msg) {
      let toast = document.getElementById("toast");
      if (!toast) {
          toast = document.createElement("div");
          toast.id = "toast";
          Object.assign(toast.style, {
              position: "fixed",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--accent1)",
              color: "#021024",
              padding: "10px 20px",
              borderRadius: "10px",
              zIndex: 10000,
              fontWeight: "700",
              transition: "opacity 300ms",
              opacity: 0,
          });
          document.body.appendChild(toast);
      }
      clearTimeout(toastTimeout);
      toast.textContent = msg;
      toast.style.opacity = 1;
      toastTimeout = setTimeout(() => {
          toast.style.opacity = 0;
      }, 3000);
  }

  // Render image preview
  function renderPreview() {
      if (state.finalHandwritingOriginal) {
          // Show the original-size image preview
          hPreview.innerHTML = `<img src="${state.finalHandwritingOriginal}" style="max-width:100%;max-height:100%;border-radius:8px">`;
          downloadImage.disabled = false;
      } else {
          hPreview.textContent = "No image saved";
          downloadImage.disabled = true;
      }
      updateAnalyzePanel();
  }

  // Image processing: DataURL -> 64x64 grayscale DataURL
  function create64GrayscaleFromDataUrl(dataUrl) {
      return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = img.width;
              tempCanvas.height = img.height;
              const tempCtx = tempCanvas.getContext('2d');
              tempCtx.drawImage(img, 0, 0);
              resolve(processCanvasTo64Grayscale(tempCanvas));
          };
          img.src = dataUrl;
      });
  }

  // Image processing: Canvas -> 64x64 grayscale DataURL
  function create64GrayscaleFromCanvas(sourceCanvas) {
      return Promise.resolve(processCanvasTo64Grayscale(sourceCanvas));
  }

  // Core image processing logic
  function processCanvasTo64Grayscale(sourceCanvas) {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // 1. Draw source onto 64x64 canvas (resizing)
      ctx.drawImage(sourceCanvas, 0, 0, size, size);

      // 2. Grayscale conversion and inversion (common for handwriting models)
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
          // Simple RGB to Luminosity calculation (0.299R + 0.587G + 0.114B)
          const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
          
          // Set R, G, B to the calculated luminosity
          data[i] = avg; 
          data[i + 1] = avg; 
          data[i + 2] = avg;
          // Alpha channel (data[i+3]) remains unchanged (255)
      }

      ctx.putImageData(imageData, 0, 0);

      // 3. Return PNG DataURL
      return canvas.toDataURL("image/png");
  }

  /* ---------- Analyze/Predict Panel Logic ---------- */

  function updateAnalyzePanel() {
      const hasJson = state.collectedRecords.length >= TOTAL_CONTENTS || state.modelResult;
      const hasImage = !!state.finalHandwriting64;
      const canAnalyze = hasJson && hasImage;

      // Update JSON Status based on imported modelResult
      if (state.modelResult) {
          jsonStatus.textContent = "Imported (96 elements)";
          jsonStatus.style.color = "var(--accent2)";
      } else if (state.collectedRecords.length > 0) {
          jsonStatus.textContent = `Collected ${state.collectedRecords.length}/96`;
          jsonStatus.style.color = state.collectedRecords.length === TOTAL_CONTENTS ? "var(--accent2)" : "#ffd6a6";
      } else {
          jsonStatus.textContent = "No JSON";
          jsonStatus.style.color = "var(--muted)";
      }
      
      // Update Analysis Status and Button
      analyzeBtn.disabled = !canAnalyze;
      analyzeBtn.style.opacity = canAnalyze ? 1 : 0.5;
      analyzeBtn.style.cursor = canAnalyze ? "pointer" : "not-allowed";

      let statusText = "";
      if (!hasJson && !hasImage) {
          statusText = "Waiting for 96 JSON and image…";
      } else if (!hasJson) {
          statusText = `Waiting for 96 JSON content (${state.collectedRecords.length}/${TOTAL_CONTENTS} collected)`;
      } else if (!hasImage) {
          statusText = "Waiting for final handwriting image upload.";
      } else {
          statusText = "Ready for final analysis.";
          analysisStatus.style.color = "var(--accent2)";
      }
      analysisStatus.textContent = statusText;
  }

  analyzeBtn.addEventListener('click', runAnalysis);

  function runAnalysis() {
      if (analyzeBtn.disabled) return;
      
      // Simulate loading state
      analyzeBtn.textContent = "Analyzing...";
      loadingSpinner.style.display = "block";
      analyzeBtn.disabled = true;

      // 1. Get Game Data (either collected or imported)
      let gameData = state.modelResult || buildSequentialArray(state.collectedRecords);
      
      // 2. Get Handwriting Data (DataURL of 64x64 image)
      let imageDataUrl = state.finalHandwriting64;
      
      // Placeholder for actual model prediction.
      // In a real application, this is where you'd send `gameData` and `imageDataUrl`
      // to a backend service (e.g., a Flask/Django app running a TensorFlow/PyTorch model)
      
      console.log("Starting analysis with:", { 
          gameDataLength: gameData.length,
          hasImage: !!imageDataUrl
      });

      // Simulated result generation
      setTimeout(() => {
          // Simple heuristic: Predict positive based on the mean value of the game data
          // For demo, let's use the average value. A lower average score suggests difficulty.
          const avgScore = gameData.reduce((a, b) => a + b, 0) / TOTAL_CONTENTS;
          const handwritingQuality = Math.random(); // Placeholder metric (0 to 1)

          let prediction = "Negative (Likely No Dyslexia)";
          let info = "All game metrics suggest strong performance and the handwriting quality is typical.";
          let resultColor = "#3cff80"; // Green

          // Low score threshold (e.g., if average score is below a certain demo threshold)
          if (avgScore < 20) {
              prediction = "Positive (Risk of Dyslexia)";
              info = "Game performance metrics were significantly below average, indicating difficulty with the cognitive tasks. Further professional testing is recommended.";
              resultColor = "#ff5c3c"; // Red
          } else if (avgScore < 50) {
              prediction = "Borderline (Watchful Waiting)";
              info = "Game performance was slightly below average. The results are inconclusive and should be monitored. Re-evaluation in 6 months is suggested.";
              resultColor = "#ffbfa8"; // Orange
          }

          // Overlay handwriting impact: If avg is borderline/positive, poor handwriting boosts risk.
          if (handwritingQuality < 0.3 && avgScore < 50) {
              prediction = "Positive (High Risk of Dyslexia)";
              info = info.replace("Further professional testing is recommended.", "Game performance metrics were low, and the handwriting analysis showed signs of motor/spatial difficulties. Urgent professional evaluation is recommended.");
              resultColor = "#ff5c3c"; // Red
          }

          // Display results
          predictionResult.innerHTML = `
              <div style="font-weight: 800; font-size: 24px; color: ${resultColor}; margin-top: 10px;">
                  Prediction: ${prediction}
              </div>
          `;
          dyslexiaInfo.innerHTML = `
              <div style="margin-top: 8px; font-size: 14px; color: var(--muted);">
                  ${info}
                  <div style="margin-top: 10px;">
                      <small>Demo Metrics: Avg Game Score=${avgScore.toFixed(2)}/100, Handwriting Quality=${(handwritingQuality * 100).toFixed(0)}%</small>
                  </div>
              </div>
          `;
          
          // Reset loading state
          analyzeBtn.textContent = "Analyze";
          loadingSpinner.style.display = "none";
          analyzeBtn.disabled = false;
          analyzeBtn.style.opacity = 1;
          
      }, 2000); // 2 second simulation delay
  }
    