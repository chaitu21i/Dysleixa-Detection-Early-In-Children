
        /* SHAPE POP SCRIPT START (Modified for Modal) */
        const SP_LEVELS = [
          { rows: 3, cols: 3, speed: 1800, cycles: 12 }, // level 1
          { rows: 4, cols: 4, speed: 1400, cycles: 18 }, // level 2
          { rows: 5, cols: 5, speed: 1100, cycles: 24 }, // level 3
        ];

        // shapes available
        const SP_SHAPES = [
          { key: "circle", symbol: "●", name: "CIRCLE" },
          { key: "square", symbol: "■", name: "SQUARE" },
          { key: "triangle", symbol: "▲", name: "TRIANGLE" },
          { key: "star", symbol: "★", name: "STAR" },
        ];

        // change target every N cycles (keeps gameplay dynamic)
        const SP_TARGET_CHANGE_INTERVAL = 4;

        /* DOM references (using _sp suffix) */
        const gridEl_sp = document.getElementById("grid_sp");
        const countdownEl_sp = document.getElementById("countdownOverlay_sp");
        const winOverlay_sp = document.getElementById("winOverlay_sp");
        const winText_sp = document.getElementById("winText_sp");
        const nextBtn_sp = document.getElementById("nextLevelBtn_sp");
        const shapePopModal = document.getElementById("gameModal-shape_pop");

        const levelDisplay_sp = document.getElementById("levelDisplay_sp");
        const scoreDisplay_sp = document.getElementById("scoreDisplay_sp");
        const hitsDisplay_sp = document.getElementById("hitsDisplay_sp");
        const missesDisplay_sp = document.getElementById("missesDisplay_sp");
        const targetSymbol_sp = document.getElementById("targetSymbol_sp");
        const targetName_sp = document.getElementById("targetName_sp");

        /* Game state */
        let spCurrentLevel = 0;
        let spTiles = [];
        let spActiveShown = null; 
        let spHits = 0;
        let spMisses = 0;
        let spScore = 0;
        let spCycleCount = 0;
        let spTotalCycles = 0;
        let spGameLog = [];
        let spLocked = false;
        let spTargetShape = SP_SHAPES[0]; // object from SP_SHAPES
        let spCycleTimer = null;

        /* Helpers */
        function spRandInt(max) {
          return Math.floor(Math.random() * max);
        }
        function spPickRandom(arr) {
          return arr[spRandInt(arr.length)];
        }

        /* Build grid */
        function spBuildGrid(level) {
          gridEl_sp.innerHTML = "";
          spTiles = [];
          const { rows, cols } = level;
          gridEl_sp.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
          gridEl_sp.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
          const total = rows * cols;
          for (let i = 0; i < total; i++) {
            const t = document.createElement("div");
            t.className = "tile_sp"; 
            t.dataset.index = i;
            t.addEventListener("click", () => spTileClicked(i));
            gridEl_sp.appendChild(t);
            spTiles.push(t);
          }
        }

        /* Start / Countdown */
        function spStartLevel(levelIndex) {
          if(spCycleTimer) clearTimeout(spCycleTimer);
          
          spCurrentLevel = levelIndex;
          spHits = 0;
          spMisses = 0;
          spScore = 0;
          spCycleCount = 0;
          spGameLog = [];
          spActiveShown = null;
          spLocked = false;

          levelDisplay_sp.textContent = spCurrentLevel + 1;
          spUpdateHUD();

          spBuildGrid(SP_LEVELS[spCurrentLevel]);

          spTargetShape = spPickRandom(SP_SHAPES);
          spUpdateTargetDisplay();

          spShowCountdown(3).then(() => spRunGame());
        }

        function spShowCountdown(sec) {
          return new Promise((res) => {
            countdownEl_sp.style.opacity = 1;
            countdownEl_sp.style.pointerEvents = "auto";
            let c = sec;
            countdownEl_sp.textContent = c;
            const interval = setInterval(() => {
              c--;
              if (c > 0) {
                countdownEl_sp.textContent = c;
              } else {
                clearInterval(interval);
                countdownEl_sp.style.opacity = 0;
                countdownEl_sp.style.pointerEvents = "none";
                res();
              }
            }, 1000);
          });
        }

        /* HUD / Target display */
        function spUpdateHUD() {
          hitsDisplay_sp.textContent = spHits;
          missesDisplay_sp.textContent = spMisses;
          scoreDisplay_sp.textContent = spScore;
        }

        function spUpdateTargetDisplay() {
          targetSymbol_sp.textContent = spTargetShape.symbol;
          targetName_sp.textContent = spTargetShape.name;
        }

        /* Main loop: cycle */
        function spRunGame() {
          spLocked = false;
          spScheduleNextCycle();
        }

        function spScheduleNextCycle() {
          const { speed, cycles } = SP_LEVELS[spCurrentLevel];

          // stop condition
          if (spCycleCount >= cycles) {
            spEndLevel();
            return;
          }

          spNextCycle();

          spCycleTimer = setTimeout(() => {
            spScheduleNextCycle();
          }, speed);
        }

        function spNextCycle() {
          if (spActiveShown !== null) {
            const wasTarget = spActiveShown.shapeKey === spTargetShape.key;
            if (wasTarget) {
              spMisses++;
              spScore = Math.max(0, spScore - 2);
            } 
            const prevIdx = spActiveShown.index;
            if (spTiles[prevIdx]) {
              spTiles[prevIdx].classList.remove("active");
              spTiles[prevIdx].textContent = "";
            }
            spActiveShown = null;
          }

          // possibly change target
          if (spCycleCount > 0 && spCycleCount % SP_TARGET_CHANGE_INTERVAL === 0) {
            let newTarget;
            do {
              newTarget = spPickRandom(SP_SHAPES);
            } while (newTarget.key === spTargetShape.key);
            spTargetShape = newTarget;
            spUpdateTargetDisplay();
          }

          // Show a new random tile & shape (one shape per cycle)
          const idx = spRandInt(spTiles.length);
          const shape = spPickRandom(SP_SHAPES);

          // set active shown
          spActiveShown = { index: idx, shapeKey: shape.key, shownAt: Date.now() };

          // render tile
          (function renderTile(i, s) {
            const t = spTiles[i];
            if (!t) return;
            t.classList.add("active");
            t.textContent = s.symbol;
          })(idx, shape);

          spCycleCount++;
          spTotalCycles = spCycleCount;
          spUpdateHUD();
        }

        /* Tile click handling */
        function spTileClicked(idx) {
          if (spLocked) return;

          // If nothing is shown (or already cleared)
          if (spActiveShown === null) {
            spMisses++;
            spScore = Math.max(0, spScore - 2);
            spUpdateHUD();
            return;
          }

          // Clicked a tile; check if it's the active one
          if (idx !== spActiveShown.index) {
            spMisses++;
            spScore = Math.max(0, spScore - 2);
            spUpdateHUD();
            return;
          }

          // Clicked the active tile
          const wasMatch = spActiveShown.shapeKey === spTargetShape.key;

          if (wasMatch) {
            // correct hit
            spHits++;
            spScore += 10;

            // flash + clear
            spTiles[idx].classList.add("tap-flash");
            setTimeout(() => {
              spTiles[idx].classList.remove("tap-flash");
            }, 200);

            spTiles[idx].classList.remove("active");
            spTiles[idx].textContent = "";
            spActiveShown = null; 
            spUpdateHUD();
            return;
          } else {
            // tapped active tile but it was not the target -> wrong
            spMisses++;
            spScore = Math.max(0, spScore - 2);
            spUpdateHUD();
            return;
          }
        }

        /* End level & LocalStorage saving */
        function spEndLevel() {
          spLocked = true;
          clearTimeout(spCycleTimer);

          if (spActiveShown !== null) {
            const idx = spActiveShown.index;
            if (spTiles[idx]) {
              spTiles[idx].classList.remove("active");
              spTiles[idx].textContent = "";
            }
            spActiveShown = null;
          }

          const result = {
            level: spCurrentLevel + 1,
            hits: spHits,
            misses: spMisses,
            score: spScore,
          };

          let saved = JSON.parse(localStorage.getItem("shape_pop")) || [];
          saved[spCurrentLevel] = result;
          localStorage.setItem("shape_pop", JSON.stringify(saved));
          
          // Reset state for next launch
          spHits = 0;
          spMisses = 0;
          spScore = 0;

          winText_sp.textContent = `Level ${
            spCurrentLevel + 1
          } Complete! Hits:${result.hits}, Misses:${result.misses}, Score:${result.score}`;
          winOverlay_sp.style.opacity = 1;
          winOverlay_sp.style.pointerEvents = "auto";
        }

        /* Next level handler */
        nextBtn_sp.addEventListener("click", () => {
          winOverlay_sp.style.opacity = 0;
          winOverlay_sp.style.pointerEvents = "none";
          if (spCurrentLevel < SP_LEVELS.length - 1) spStartLevel(spCurrentLevel + 1);
          else {
              shapePopModal.classList.remove('active');
              collectAllGameResults(); 
          }
        });

        function startShapePop() {
          spStartLevel(0);
        }
        /* SHAPE POP SCRIPT END */
      