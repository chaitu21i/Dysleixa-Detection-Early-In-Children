
        /* SPEED TAP SCRIPT START (Modified for Modal) */
        const ST_LEVELS = [
          { rows: 3, cols: 3, speed: 1800, taps: 4 },
          { rows: 4, cols: 4, speed: 1600, taps: 6 },
          { rows: 5, cols: 5, speed: 1400, taps: 10 },
        ];

        let stCurrentLevel = 0;
        let grid_st = document.getElementById("grid_st");
        let countdown_st = document.getElementById("countdownOverlay_st");
        let winOverlay_st = document.getElementById("winOverlay_st");
        let winText_st = document.getElementById("winText_st");
        let nextBtn_st = document.getElementById("nextLevelBtn_st");
        const speedTapModal = document.getElementById("gameModal-speed_tap");

        let levelDisplay_st = document.getElementById("levelDisplay_st");
        let scoreDisplay_st = document.getElementById("scoreDisplay_st");
        let hitsDisplay_st = document.getElementById("hitsDisplay_st");
        let missesDisplay_st = document.getElementById("missesDisplay_st");

        let stTiles = [];
        let stActiveTile = null;
        let stHits = 0;
        let stMisses = 0;
        let stTotalTaps = 0;
        let stScore = 0;
        let stGameLog = [];
        let stLastActiveTime = 0;
        let stLocked = false;
        let stCycleTimer = null;

        function stBuildGrid(level) {
          grid_st.innerHTML = "";
          stTiles = [];
          const { rows, cols } = level;
          grid_st.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
          grid_st.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
          const total = rows * cols;
          for (let i = 0; i < total; i++) {
            const t = document.createElement("div");
            t.className = "tile_st";
            t.dataset.index = i;
            t.addEventListener("click", () => stTileClicked(i));
            grid_st.appendChild(t);
            stTiles.push(t);
          }
        }

        function stStartLevel(levelIndex) {
          if(stCycleTimer) clearTimeout(stCycleTimer);

          stCurrentLevel = levelIndex;
          stHits = 0;
          stMisses = 0;
          stTotalTaps = 0;
          stScore = 0;
          stGameLog = [];
          stActiveTile = null;

          levelDisplay_st.textContent = stCurrentLevel + 1;
          stUpdateHUD();
          stBuildGrid(ST_LEVELS[stCurrentLevel]);

          stShowCountdown(3).then(() => stRunGame());
        }

        function stShowCountdown(sec) {
          return new Promise((res) => {
            countdown_st.style.opacity = 1;
            let c = sec;
            countdown_st.textContent = c;
            let interval = setInterval(() => {
              c--;
              if (c > 0) countdown_st.textContent = c;
              else {
                clearInterval(interval);
                countdown_st.style.opacity = 0;
                res();
              }
            }, 1000);
          });
        }

        function stRunGame() {
          stLocked = false;
          stNextTile();
        }

        function stNextTile() {
          const { speed, taps } = ST_LEVELS[stCurrentLevel];

          if (stTotalTaps >= taps) {
            stEndLevel();
            return;
          }

          // If last tile wasn't clicked → count as miss
          if (stActiveTile !== null) {
            stTiles[stActiveTile].classList.remove("active");
            stMisses++;
            stScore = Math.max(0, stScore - 2);
          }

          const idx = Math.floor(Math.random() * stTiles.length);
          stActiveTile = idx;
          stTiles[idx].classList.add("active");
          stLastActiveTime = Date.now();
          stTotalTaps++;

          stUpdateHUD();

          stCycleTimer = setTimeout(stNextTile, speed);
        }

        function stTileClicked(idx) {
          if (stLocked) return;

          // Wrong tile
          if (idx !== stActiveTile) {
            stMisses++;
            stScore = Math.max(0, stScore - 2);
            stUpdateHUD();
            return;
          }

          // Correct tile
          stHits++;
          stScore += 10;

          // Flash effect
          stTiles[idx].classList.add("tap-flash");
          setTimeout(() => stTiles[idx].classList.remove("tap-flash"), 200);

          // Important: prevent nextTile() from counting this as a miss
          stTiles[idx].classList.remove("active");
          stActiveTile = null;

          stUpdateHUD();
        }

        function stEndLevel() {
          stLocked = true;
          clearTimeout(stCycleTimer);

          if (stActiveTile !== null) stTiles[stActiveTile].classList.remove("active");
          stActiveTile = null;

          let data = JSON.parse(localStorage.getItem("speed_tap")) || [];

          data[stCurrentLevel] = {
            level: stCurrentLevel + 1,
            hits: stHits,
            misses: stMisses,
            score: stScore,
          };

          localStorage.setItem("speed_tap", JSON.stringify(data));
          
          // Reset state for next launch
          stHits = 0;
          stMisses = 0;
          stScore = 0;

          winText_st.textContent = `Level ${
            stCurrentLevel + 1
          } Complete! Hits:${data[stCurrentLevel].hits}, Misses:${data[stCurrentLevel].misses}, Score:${data[stCurrentLevel].score}`;

          winOverlay_st.style.opacity = 1;
          winOverlay_st.style.pointerEvents = "auto";
        }

        function stUpdateHUD() {
          hitsDisplay_st.textContent = stHits;
          missesDisplay_st.textContent = stMisses;
          scoreDisplay_st.textContent = stScore;
        }

        nextBtn_st.addEventListener("click", () => {
          winOverlay_st.style.opacity = 0;
          winOverlay_st.style.pointerEvents = "none";

          if (stCurrentLevel < ST_LEVELS.length - 1) stStartLevel(stCurrentLevel + 1);
          else {
              speedTapModal.classList.remove('active');
              collectAllGameResults();
          }
        });

        function startSpeedTap() {
          stStartLevel(0);
        }
        /* SPEED TAP SCRIPT END */
      