
        /* COLOR FUSE SCRIPT START (Modified for Modal) */
        const CF_LEVELS = [
          { rows: 3, cols: 3, speed: 1400, cycles: 12 },
          { rows: 4, cols: 4, speed: 1100, cycles: 18 },
          { rows: 5, cols: 5, speed: 900, cycles: 24 },
        ];

        const CF_COLORS = [
          { key: "red", name: "RED", value: "#ff4b4b" },
          { key: "blue", name: "BLUE", value: "#3a7bff" },
          { key: "green", name: "GREEN", value: "#42ff95" },
          { key: "yellow", name: "YELLOW", value: "#ffe14a" },
          { key: "pink", name: "PINK", value: "#ff73dc" },
        ];

        const CF_TARGET_CHANGE_INTERVAL = 4;

        const gridEl_cf = document.getElementById("gameGrid_cf");
        const countdownEl_cf = document.getElementById("gameCountdownOverlay_cf");
        const winOverlay_cf = document.getElementById("gameWinOverlay_cf");
        const winText_cf = document.getElementById("winText_cf");
        const nextBtn_cf = document.getElementById("nextLevelBtn_cf");
        const colorFuseModal = document.getElementById("gameModal-color_fuse");

        const levelDisplay_cf = document.getElementById("levelDisplay_cf");
        const scoreDisplay_cf = document.getElementById("scoreDisplay_cf");
        const hitsDisplay_cf = document.getElementById("hitsDisplay_cf");
        const missesDisplay_cf = document.getElementById("missesDisplay_cf");

        const targetSwatch_cf = document.getElementById("targetSwatch_cf");
        const targetName_cf = document.getElementById("targetName_cf");

        let cfCurrentLevel = 0;
        let cfTiles = [];
        let cfActiveShown = null; 
        let cfHits = 0;
        let cfMisses = 0;
        let cfScore = 0;
        let cfCycleCount = 0;
        let cfGameLog = [];
        let cfLocked = false;
        let cfTargetColor = CF_COLORS[0];
        let cfCycleTimer = null;

        const cfRand = (max) => Math.floor(Math.random() * max);
        const cfPick = (arr) => arr[cfRand(arr.length)];

        function cfBuildGrid(level) {
          gridEl_cf.innerHTML = "";
          cfTiles = [];

          gridEl_cf.style.gridTemplateRows = `repeat(${level.rows}, 1fr)`;
          gridEl_cf.style.gridTemplateColumns = `repeat(${level.cols}, 1fr)`;

          const total = level.rows * level.cols;

          for (let i = 0; i < total; i++) {
            const t = document.createElement("div");
            t.className = "tile";
            t.addEventListener("click", () => cfTileClicked(i));
            gridEl_cf.appendChild(t);
            cfTiles.push(t);
          }
        }

        function cfStartLevel(idx) {
          cfCurrentLevel = idx;
          cfHits = 0;
          cfMisses = 0;
          cfScore = 0;
          cfCycleCount = 0;
          cfGameLog = [];
          cfActiveShown = null;
          cfLocked = false;
          
          if (cfCycleTimer) clearTimeout(cfCycleTimer);

          levelDisplay_cf.textContent = cfCurrentLevel + 1;
          cfUpdateHUD();

          cfTargetColor = cfPick(CF_COLORS);
          cfUpdateTarget();

          cfBuildGrid(CF_LEVELS[cfCurrentLevel]);

          cfShowCountdown().then(cfRunGame);
        }

        function cfShowCountdown() {
          return new Promise((res) => {
            countdownEl_cf.style.opacity = 1;
            let c = 3;
            countdownEl_cf.textContent = c;

            const timer = setInterval(() => {
              c--;
              if (c > 0) {
                countdownEl_cf.textContent = c;
              } else {
                clearInterval(timer);
                countdownEl_cf.style.opacity = 0;
                res();
              }
            }, 900);
          });
        }

        function cfUpdateHUD() {
          hitsDisplay_cf.textContent = cfHits;
          missesDisplay_cf.textContent = cfMisses;
          scoreDisplay_cf.textContent = cfScore;
        }

        function cfUpdateTarget() {
          targetSwatch_cf.style.background = cfTargetColor.value;
          targetName_cf.textContent = cfTargetColor.name;
        }

        function cfRunGame() {
          cfLocked = false;
          cfScheduleCycle();
        }

        function cfScheduleCycle() {
          const lvl = CF_LEVELS[cfCurrentLevel];
          if (cfCycleCount >= lvl.cycles) return cfEndLevel();

          cfNextCycle();

          cfCycleTimer = setTimeout(cfScheduleCycle, lvl.speed);
        }

        function cfNextCycle() {
          if (cfActiveShown) {
            const wasTarget = cfActiveShown.colorKey === cfTargetColor.key;
            if (wasTarget) {
              cfMisses++;
              cfScore = Math.max(0, cfScore - 2);
              cfGameLog.push({
                action: "miss",
                tile: cfActiveShown.index,
                color: cfActiveShown.colorKey,
                rt: Date.now() - cfActiveShown.shownAt,
              });
            }
            cfTiles[cfActiveShown.index].style.background = "";
            cfActiveShown = null;
          }

          if (cfCycleCount > 0 && cfCycleCount % CF_TARGET_CHANGE_INTERVAL === 0) {
            let newT;
            do newT = cfPick(CF_COLORS);
            while (newT.key === cfTargetColor.key);

            cfTargetColor = newT;
            cfUpdateTarget();
          }

          const idx = cfRand(cfTiles.length);

          let selected;
          if (Math.random() < 0.3) {
            selected = cfTargetColor;
          } else {
            const others = CF_COLORS.filter((c) => c.key !== cfTargetColor.key);
            selected = cfPick(others);
          }

          cfTiles[idx].style.background = selected.value;

          cfActiveShown = {
            index: idx,
            colorKey: selected.key,
            shownAt: Date.now(),
          };

          cfGameLog.push({
            action: "show",
            tile: idx,
            color: selected.key,
            cycle: cfCycleCount,
          });

          cfCycleCount++;
          cfUpdateHUD();
        }

        function cfTileClicked(idx) {
          if (cfLocked || !cfActiveShown) {
            cfMisses++;
            cfScore = Math.max(0, cfScore - 2);
            cfUpdateHUD();
            return;
          }

          if (idx !== cfActiveShown.index) {
            cfMisses++;
            cfScore = Math.max(0, cfScore - 2);
            cfUpdateHUD();
            return;
          }

          const isMatch = cfActiveShown.colorKey === cfTargetColor.key;
          const rt = Date.now() - cfActiveShown.shownAt;

          if (isMatch) {
            cfHits++;
            cfScore += 10;
            cfGameLog.push({
              action: "hit",
              tile: idx,
              color: cfActiveShown.colorKey,
              rt,
            });

            cfTiles[idx].classList.add("tap-flash");
            setTimeout(() => cfTiles[idx].classList.remove("tap-flash"), 200);

            cfTiles[idx].style.background = "";
            cfActiveShown = null;
            cfUpdateHUD();
          } else {
            cfMisses++;
            cfScore = Math.max(0, cfScore - 2);
            cfUpdateHUD();
          }
        }

        function cfEndLevel() {
          cfLocked = true;
          clearTimeout(cfCycleTimer);

          if (cfActiveShown) {
            cfTiles[cfActiveShown.index].style.background = "";
            cfActiveShown = null;
          }

          const result = {
            level: cfCurrentLevel + 1,
            hits: cfHits,
            misses: cfMisses,
            score: cfScore,
          };

          let saved = JSON.parse(localStorage.getItem("color_fuse")) || [];
          saved[cfCurrentLevel] = result;
          localStorage.setItem("color_fuse", JSON.stringify(saved));

          // Reset game state for next launch
          cfHits = 0;
          cfMisses = 0;
          cfScore = 0;

          winText_cf.textContent = `Level ${
            cfCurrentLevel + 1
          } Complete! Hits: ${result.hits}, Misses: ${result.misses}, Score: ${result.score}`;
          winOverlay_cf.style.opacity = 1;
          winOverlay_cf.style.pointerEvents = "auto";
        }

        nextBtn_cf.addEventListener("click", () => {
          winOverlay_cf.style.opacity = 0;
          winOverlay_cf.style.pointerEvents = "none";

          if (cfCurrentLevel < CF_LEVELS.length - 1) {
            cfStartLevel(cfCurrentLevel + 1);
          } else {
            colorFuseModal.classList.remove('active');
            collectAllGameResults(); // Update progress bar on the hub
          }
        });
        
        // Wrapper called by the main hub code to start the game
        function startColorFuse() {
            cfStartLevel(0);
        }
        /* COLOR FUSE SCRIPT END */
      