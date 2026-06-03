
        /* LIGHTNING TAP SCRIPT START (Modified for Modal) */
        const LT_LEVELS = [
          { rows: 3, cols: 4, lightning: 4, roundTime: 7 },
          { rows: 4, cols: 4, lightning: 6, roundTime: 6 },
          { rows: 4, cols: 5, lightning: 8, roundTime: 5 },
        ];
        const LT_ROUNDS_PER_LEVEL = 2;

        const grid_lt = document.getElementById("grid_lt");
        const countdownEl_lt = document.getElementById("countdownOverlay_lt");
        const winOverlay_lt = document.getElementById("winOverlay_lt");
        const winText_lt = document.getElementById("winText_lt");
        const nextBtn_lt = document.getElementById("nextLevelBtn_lt");
        const lightningTapModal = document.getElementById("gameModal-lightning_tap");
        
        const levelDisplay_lt = document.getElementById("levelDisplay_lt");
        const roundDisplay_lt = document.getElementById("roundDisplay_lt");
        const scoreDisplay_lt = document.getElementById("scoreDisplay_lt");
        const hitsDisplay_lt = document.getElementById("hitsDisplay_lt");
        const missesDisplay_lt = document.getElementById("missesDisplay_lt");
        const timeDisplay_lt = document.getElementById("timeDisplay_lt");

        let ltCurrentLevel = 0,
          ltCurrentRound = 0,
          ltHits = 0,
          ltMisses = 0,
          ltScore = 0;
        let ltTiles = [],
          ltLightningIndices = [],
          ltRoundTimer = null,
          ltLocked = false,
          ltTimeLeft = 0;

        function ltShowCountdown(sec) {
          return new Promise((res) => {
            countdownEl_lt.style.opacity = 1;
            countdownEl_lt.textContent = sec;
            let c = sec;
            let iv = setInterval(() => {
              c--;
              if (c > 0) countdownEl_lt.textContent = c;
              else {
                clearInterval(iv);
                countdownEl_lt.style.opacity = 0;
                res();
              }
            }, 1000);
          });
        }

        function ltBuildGrid() {
          grid_lt.innerHTML = "";
          ltTiles = [];
          const cfg = LT_LEVELS[ltCurrentLevel];
          grid_lt.style.gridTemplateRows = `repeat(${cfg.rows},1fr)`;
          grid_lt.style.gridTemplateColumns = `repeat(${cfg.cols},1fr)`;
          for (let i = 0; i < cfg.rows * cfg.cols; i++) {
            const t = document.createElement("div");
            t.className = "tile_lt";
            t.dataset.index = i;
            t.addEventListener("click", () => ltTileClicked(i));
            grid_lt.appendChild(t);
            ltTiles.push(t);
          }
        }

        function ltFinishRound() {
          const remainingMisses = ltLightningIndices.filter(
            (idx) => ltTiles[idx].dataset.clicked !== "1"
          ).length;
          ltMisses += remainingMisses;
          ltScore = Math.max(0, ltScore - remainingMisses * 2); // optional: penalty for untapped tiles
          ltUpdateHUD();
        }

        function ltStartRound() {
          if (ltCurrentRound >= LT_ROUNDS_PER_LEVEL) {
            ltFinishRound();
            ltEndLevel();
            return;
          }
          ltCurrentRound++;
          roundDisplay_lt.textContent = ltCurrentRound;
          const cfg = LT_LEVELS[ltCurrentLevel];

          // reset all tiles
          ltTiles.forEach((t) => {
            t.classList.remove("lightning", "tap-flash");
            t.dataset.clicked = "0";
          });

          // assign lightning tiles
          ltLightningIndices = [];
          let indices = [...Array(ltTiles.length).keys()];
          indices.sort(() => Math.random() - 0.5);
          for (let i = 0; i < cfg.lightning; i++) {
            const idx = indices[i];
            ltTiles[idx].classList.add("lightning");
            ltLightningIndices.push(idx);
          }

          // start timer
          ltTimeLeft = cfg.roundTime;
          timeDisplay_lt.textContent = ltTimeLeft;
          ltLocked = false;
          if(ltRoundTimer) clearInterval(ltRoundTimer);
          ltRoundTimer = setInterval(() => {
            ltTimeLeft--;
            timeDisplay_lt.textContent = ltTimeLeft;
            if (ltTimeLeft <= 0) {
              clearInterval(ltRoundTimer);
              ltFinishRound();
              ltStartRound(); // next round
            }
          }, 1000);
        }

        function ltTileClicked(i) {
          if (ltLocked) return;
          const t = ltTiles[i];
          if (t.dataset.clicked === "1") return;
          t.dataset.clicked = "1";
          if (t.classList.contains("lightning")) {
            ltHits++;
            ltScore += 10;
            t.classList.add("tap-flash");
            // remove lightning after tap
            t.classList.remove("lightning");
          } else {
            ltMisses++;
            ltScore = Math.max(0, ltScore - 2);
            t.classList.add("tap-flash");
          }
          ltUpdateHUD();
        }

        function ltUpdateHUD() {
          hitsDisplay_lt.textContent = ltHits;
          missesDisplay_lt.textContent = ltMisses;
          scoreDisplay_lt.textContent = ltScore;
        }

        function ltStartLevel(levelIndex) {
          if(ltRoundTimer) clearInterval(ltRoundTimer);

          ltCurrentLevel = levelIndex;
          ltCurrentRound = 0;
          ltHits = 0;
          ltMisses = 0;
          ltScore = 0;
          ltUpdateHUD();
          ltBuildGrid();
          ltShowCountdown(3).then(() => ltStartRound());
          levelDisplay_lt.textContent = ltCurrentLevel + 1;
        }

        function ltEndLevel() {
          ltLocked = true;
          clearInterval(ltRoundTimer);
          const result = { level: ltCurrentLevel + 1, hits: ltHits, misses: ltMisses, score: ltScore };
          let saved = JSON.parse(localStorage.getItem("lightning_tap")) || [];
          saved[ltCurrentLevel] = result;
          localStorage.setItem("lightning_tap", JSON.stringify(saved));
          winText_lt.textContent = `Level ${
            ltCurrentLevel + 1
          } Complete! Hits:${ltHits}, Misses:${ltMisses}, Score:${ltScore}`;
          winOverlay_lt.style.opacity = 1;
          winOverlay_lt.style.pointerEvents = "auto";
        }

        nextBtn_lt.addEventListener("click", () => {
          winOverlay_lt.style.opacity = 0;
          winOverlay_lt.style.pointerEvents = "none";
          if (ltCurrentLevel < LT_LEVELS.length - 1) {
              ltStartLevel(ltCurrentLevel + 1);
          } else {
              lightningTapModal.classList.remove('active');
              collectAllGameResults(); // Update progress bar on the hub
          }
        });
        
        // Wrapper called by the main hub code to start the game
        function startLightningTap() {
            ltStartLevel(0);
        }
        /* LIGHTNING TAP SCRIPT END */
      