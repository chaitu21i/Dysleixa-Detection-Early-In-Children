
        /* DIRECTION DASH SCRIPT START (Modified for Modal) */
        const DD_LEVELS = [
          { rows: 3, cols: 3, speed: 4000, cycles: 2 },
          { rows: 4, cols: 4, speed: 4500, cycles: 2 },
          { rows: 5, cols: 5, speed: 5500, cycles: 2 },
        ];

        const DD_DIRECTIONS = [
          { key: "up", symbol: "↑", name: "UP" },
          { key: "right", symbol: "→", name: "RIGHT" },
          { key: "down", symbol: "↓", name: "DOWN" },
          { key: "left", symbol: "←", name: "LEFT" },
        ];

        const DD_TARGET_CHANGE_INTERVAL = 4;

        const gridEl_dd = document.getElementById("gameGrid_dd");
        const countdownEl_dd = document.getElementById("gameCountdownOverlay_dd");
        const winOverlay_dd = document.getElementById("gameWinOverlay_dd");
        const winText_dd = document.getElementById("winText_dd");
        const nextBtn_dd = document.getElementById("nextLevelBtn_dd");
        const directionDashModal = document.getElementById("gameModal-direction_dash");


        const levelDisplay_dd = document.getElementById("levelDisplay_dd");
        const scoreDisplay_dd = document.getElementById("scoreDisplay_dd");
        const hitsDisplay_dd = document.getElementById("hitsDisplay_dd");
        const missesDisplay_dd = document.getElementById("missesDisplay_dd");
        const targetArrowEl_dd = document.getElementById("targetArrow_dd");
        const targetNameEl_dd = document.getElementById("targetName_dd");

        let ddCurrentLevel = 0;
        let ddTiles = []; // DOM elements
        let ddCycleCount = 0;
        let ddCycleTimer = null;
        let ddLocked = false;

        let ddTargetDir = DD_DIRECTIONS[1]; 
        let ddGameLog = []; 
        let ddHits = 0;
        let ddMisses = 0;
        let ddScore = 0;

        const ddRand = (max) => Math.floor(Math.random() * max);
        const ddPick = (arr) => arr[ddRand(arr.length)];

        function ddBuildGrid(level) {
          gridEl_dd.innerHTML = "";
          ddTiles = [];
          gridEl_dd.style.gridTemplateRows = `repeat(${level.rows}, 1fr)`;
          gridEl_dd.style.gridTemplateColumns = `repeat(${level.cols}, 1fr)`;
          const total = level.rows * level.cols;
          for (let i = 0; i < total; i++) {
            const t = document.createElement("div");
            t.className = "tile_dd";
            t.dataset.index = i;
            t.dataset.dir = "";
            t.dataset.tapped = "0";
            t.addEventListener("click", () => ddTileClicked(i));
            gridEl_dd.appendChild(t);
            ddTiles.push(t);
          }
        }

        function ddStartLevel(levelIndex) {
          ddCurrentLevel = levelIndex;
          ddHits = 0;
          ddMisses = 0;
          ddScore = 0;
          ddCycleCount = 0;
          ddLocked = false;
          ddGameLog = [];
          ddTargetDir = ddPick(DD_DIRECTIONS);
          ddUpdateTargetDisplay();
          levelDisplay_dd.textContent = ddCurrentLevel + 1;
          ddUpdateHUD();
          ddBuildGrid(DD_LEVELS[ddCurrentLevel]);
          ddShowCountdown(3).then(() => ddRunGame());
        }

        function ddShowCountdown(sec) {
          return new Promise((res) => {
            countdownEl_dd.style.opacity = 1;
            countdownEl_dd.style.pointerEvents = "auto";
            let c = sec;
            countdownEl_dd.textContent = c;
            const iv = setInterval(() => {
              c--;
              if (c > 0) countdownEl_dd.textContent = c;
              else {
                clearInterval(iv);
                countdownEl_dd.style.opacity = 0;
                countdownEl_dd.style.pointerEvents = "none";
                res();
              }
            }, 1000);
          });
        }

        function ddUpdateHUD() {
          hitsDisplay_dd.textContent = ddHits;
          missesDisplay_dd.textContent = ddMisses;
          scoreDisplay_dd.textContent = ddScore;
        }

        function ddUpdateTargetDisplay() {
          targetArrowEl_dd.textContent = ddTargetDir.symbol;
          targetNameEl_dd.textContent = ddTargetDir.name;
        }

        function ddRunGame() {
          ddLocked = false;
          ddScheduleNextCycle();
        }

        function ddScheduleNextCycle() {
          const cfg = DD_LEVELS[ddCurrentLevel];
          if (ddCycleCount >= cfg.cycles) {
            return ddEndLevel();
          }
          ddNextCycle();
          ddCycleTimer = setTimeout(ddScheduleNextCycle, cfg.speed);
        }

        function ddNextCycle() {
          const cfg = DD_LEVELS[ddCurrentLevel];

          ddTiles.forEach((t, i) => {
            const dir = t.dataset.dir;
            const tapped = t.dataset.tapped === "1";
            if (dir && dir === ddTargetDir.key && !tapped) {
              ddMisses++;
              ddScore = Math.max(0, ddScore - 2);
              ddGameLog.push({
                time: Date.now(),
                action: "missed_target",
                tile: i,
                dir,
              });
            }
            t.classList.remove("tap-flash", "cleared");
            t.textContent = "";
            t.dataset.dir = "";
            t.dataset.tapped = "0";
          });

          if (ddCycleCount > 0 && ddCycleCount % DD_TARGET_CHANGE_INTERVAL === 0) {
            let newTarget;
            do {
              newTarget = ddPick(DD_DIRECTIONS);
            } while (newTarget.key === ddTargetDir.key);
            ddTargetDir = newTarget;
            ddUpdateTargetDisplay();
            ddGameLog.push({
              time: Date.now(),
              action: "target_change",
              newTarget: ddTargetDir.key,
              cycle: ddCycleCount,
            });
          }

          const total = ddTiles.length;
          const maxMatches = Math.max(1, Math.floor(total * 0.25));
          const numMatches = Math.max(
            1,
            Math.floor(Math.random() * maxMatches) + 1
          );
          const allIndices = Array.from({ length: total }, (_, i) => i);
          for (let i = allIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
          }
          const matchIndices = allIndices.slice(0, numMatches);

          ddTiles.forEach((t, i) => {
            if (matchIndices.includes(i)) {
              t.dataset.dir = ddTargetDir.key;
              t.textContent = ddTargetDir.symbol;
            } else {
              let other;
              do {
                other = ddPick(DD_DIRECTIONS);
              } while (other.key === ddTargetDir.key);
              t.dataset.dir = other.key;
              t.textContent = other.symbol;
            }
          });

          ddGameLog.push({
            time: Date.now(),
            action: "show",
            cycle: ddCycleCount,
            target: ddTargetDir.key,
            matches: numMatches,
          });

          ddCycleCount++;
          ddUpdateHUD();
        }

        function ddTileClicked(index) {
          if (ddLocked) return;

          const t = ddTiles[index];
          if (t.dataset.tapped === "1") return;

          const dir = t.dataset.dir || "";
          if (!dir) {
            ddMisses++;
            ddScore = Math.max(0, ddScore - 2);
            ddGameLog.push({ time: Date.now(), action: "tap_empty", tile: index });
            ddUpdateHUD();
            return;
          }

          if (dir === ddTargetDir.key) {
            ddHits++;
            ddScore += 10;
            t.dataset.tapped = "1";
            t.classList.add("tap-flash");
            setTimeout(() => {
              t.classList.remove("tap-flash");
              t.classList.add("cleared");
              t.textContent = "";
            }, 150);
            ddGameLog.push({ time: Date.now(), action: "hit", tile: index, dir });
            ddUpdateHUD();
            return;
          } else {
            ddMisses++;
            ddScore = Math.max(0, ddScore - 2);
            t.classList.add("tap-flash");
            setTimeout(() => t.classList.remove("tap-flash"), 180);
            ddGameLog.push({
              time: Date.now(),
              action: "wrong_tap",
              tile: index,
              dir,
            });
            ddUpdateHUD();
            return;
          }
        }

        function ddEndLevel() {
          ddLocked = true;
          clearTimeout(ddCycleTimer);

          ddTiles.forEach((t) => {
            t.classList.remove("tap-flash");
          });

          const result = {
            level: ddCurrentLevel + 1,
            hits: ddHits,
            misses: ddMisses,
            score: ddScore,
          };

          let saved = JSON.parse(localStorage.getItem("direction_dash")) || [];
          saved[ddCurrentLevel] = result;
          localStorage.setItem("direction_dash", JSON.stringify(saved));
          
          // Reset game state for next launch
          ddHits = 0;
          ddMisses = 0;
          ddScore = 0;

          winText_dd.textContent = `Level ${
            ddCurrentLevel + 1
          } Complete! Hits:${result.hits}, Misses:${result.misses}, Score:${result.score}`;
          winOverlay_dd.style.opacity = 1;
          winOverlay_dd.style.pointerEvents = "auto";
          ddGameLog.push({ time: Date.now(), action: "level_end", result });
        }

        nextBtn_dd.addEventListener("click", () => {
          winOverlay_dd.style.opacity = 0;
          winOverlay_dd.style.pointerEvents = "none";

          if (ddCurrentLevel < DD_LEVELS.length - 1) {
            ddStartLevel(ddCurrentLevel + 1);
          } else {
            directionDashModal.classList.remove('active');
            collectAllGameResults(); // Update progress bar on the hub
          }
        });
        
        // Wrapper called by the main hub code to start the game
        function startDirectionDash() {
            ddStartLevel(0);
        }
        /* DIRECTION DASH SCRIPT END */
      