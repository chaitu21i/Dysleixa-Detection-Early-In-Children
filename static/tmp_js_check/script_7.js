
        /* MULTIPLES TAP SCRIPT START (Modified for Modal) */
        const MT_LEVELS = [
          { rows: 3, cols: 3, speed: 6000 },
          { rows: 4, cols: 4, speed: 8500 },
          { rows: 4, cols: 5, speed: 10000 },
        ];
        const MT_TARGET_MIN = 2,
          MT_TARGET_MAX = 10;
        const MT_MULTIPLES_MIN = 1,
          MT_MULTIPLES_MAX = 10;
        const MT_MIN_MULTIPLE_PERCENT = 0.4; // 40%

        const grid_mt = document.getElementById("grid_mt");
        const countdownEl_mt = document.getElementById("countdownOverlay_mt");
        const winOverlay_mt = document.getElementById("winOverlay_mt");
        const winText_mt = document.getElementById("winText_mt");
        const nextBtn_mt = document.getElementById("nextLevelBtn_mt");
        const multiplesTapModal = document.getElementById("gameModal-multiples_tap");

        const levelDisplay_mt = document.getElementById("levelDisplay_mt");
        const scoreDisplay_mt = document.getElementById("scoreDisplay_mt");
        const hitsDisplay_mt = document.getElementById("hitsDisplay_mt");
        const missesDisplay_mt = document.getElementById("missesDisplay_mt");
        const targetDisplay_mt = document.getElementById("targetDisplay_mt");

        let mtCurrentLevel = 0,
          mtHits = 0,
          mtMisses = 0,
          mtScore = 0;
        const MT_ROUNDS_PER_LEVEL = 1; 
        let mtTiles = [],
          mtTileValues = [];
        let mtTargetNum = 2,
          mtCycleTimer = null,
          mtLocked = false;
        let mtCurrentRound = 0;

        const mtRand = (max) => Math.floor(Math.random() * max);

        function mtShowCountdown(sec) {
          return new Promise((res) => {
            countdownEl_mt.style.opacity = 1;
            countdownEl_mt.textContent = sec;
            let c = sec;
            let iv = setInterval(() => {
              c--;
              if (c > 0) countdownEl_mt.textContent = c;
              else {
                clearInterval(iv);
                countdownEl_mt.style.opacity = 0;
                res();
              }
            }, 1000);
          });
        }

        function mtBuildGrid() {
          grid_mt.innerHTML = "";
          mtTiles = [];
          const cfg = MT_LEVELS[mtCurrentLevel];
          grid_mt.style.gridTemplateRows = `repeat(${cfg.rows},1fr)`;
          grid_mt.style.gridTemplateColumns = `repeat(${cfg.cols},1fr)`;
          for (let i = 0; i < cfg.rows * cfg.cols; i++) {
            const t = document.createElement("div");
            t.className = "tile_mt";
            t.dataset.index = i;
            t.addEventListener("click", () => mtTileClicked(i));
            grid_mt.appendChild(t);
            mtTiles.push(t);
          }
        }

        function mtGenerateTiles() {
          const cfg = MT_LEVELS[mtCurrentLevel];
          const total = cfg.rows * cfg.cols;
          const numMultiples = Math.max(
            Math.floor(total * MT_MIN_MULTIPLE_PERCENT),
            1
          );

          mtTileValues = [];
          let positions = [...Array(total).keys()];
          positions.sort(() => Math.random() - 0.5);

          for (let i = 0; i < numMultiples; i++) {
            const val = (mtRand(MT_MULTIPLES_MAX) + MT_MULTIPLES_MIN) * mtTargetNum;
            mtTileValues.push({ index: positions[i], val, clicked: false });
          }

          for (let i = numMultiples; i < total; i++) {
            let val;
            do {
              val = mtRand(mtTargetNum * MT_MULTIPLES_MAX) + 1;
            } while (val % mtTargetNum === 0);
            mtTileValues.push({ index: positions[i], val, clicked: false });
          }

          mtTileValues.forEach((v) => {
            const t = mtTiles[v.index];
            t.textContent = v.val;
            t.dataset.val = v.val;
            t.classList.remove("tap-flash");
          });
        }

        function mtTileClicked(i) {
          if (mtLocked) return;
          const t = mtTiles[i];
          const val = Number(t.dataset.val);
          if (t.dataset.clicked === "1") return; 
          const isMultiple = val % mtTargetNum === 0;
          t.dataset.clicked = "1";
          if (isMultiple) {
            mtHits++;
            mtScore += 10;
            t.classList.add("tap-flash");
            mtTileValues.find((v) => v.index === i).clicked = true;
          } else {
            mtMisses++;
            mtScore = Math.max(0, mtScore - 2);
            t.classList.add("tap-flash");
          }
          mtUpdateHUD();
        }

        function mtUpdateHUD() {
          hitsDisplay_mt.textContent = mtHits;
          missesDisplay_mt.textContent = mtMisses;
          scoreDisplay_mt.textContent = mtScore;
          targetDisplay_mt.textContent = mtTargetNum;
        }

        function mtNextCycle() {
          if (mtCurrentRound >= MT_ROUNDS_PER_LEVEL) {
            mtEndLevel();
            return;
          }

          const cfg = MT_LEVELS[mtCurrentLevel];
          mtTargetNum = mtRand(MT_TARGET_MAX - MT_TARGET_MIN + 1) + MT_TARGET_MIN;

          mtTiles.forEach((t) => {
            t.dataset.clicked = "0";
            t.classList.remove("tap-flash"); 
          });

          mtGenerateTiles();
          mtUpdateHUD();

          mtCurrentRound++;

          mtCycleTimer = setTimeout(() => {
            if (!mtLocked) mtNextCycle(); 
          }, cfg.speed);
        }

        function mtStartLevel(levelIndex) {
          if(mtCycleTimer) clearTimeout(mtCycleTimer);

          mtCurrentLevel = levelIndex;
          mtHits = 0;
          mtMisses = 0;
          mtScore = 0;
          mtCurrentRound = 0; 
          mtLocked = false;
          mtUpdateHUD();
          mtBuildGrid();
          mtShowCountdown(3).then(() => mtNextCycle());
          levelDisplay_mt.textContent = mtCurrentLevel + 1;
        }

        function mtEndLevel() {
          mtLocked = true;
          targetDisplay_mt.textContent = mtTargetNum;
          clearTimeout(mtCycleTimer);
          const result = {
            level: mtCurrentLevel + 1,
            hits: mtHits,
            misses: mtMisses,
            score: mtScore,
          };
          let saved = JSON.parse(localStorage.getItem("multiples_tap")) || [];
          saved[mtCurrentLevel] = result;
          localStorage.setItem("multiples_tap", JSON.stringify(saved));
          
          // Reset state for next launch
          mtHits = 0;
          mtMisses = 0;
          mtScore = 0;

          winText_mt.textContent = `Level ${
            mtCurrentLevel + 1
          } Complete! Hits:${result.hits}, Misses:${result.misses}, Score:${result.score}`;
          winOverlay_mt.style.opacity = 1;
          winOverlay_mt.style.pointerEvents = "auto";
        }

        nextBtn_mt.addEventListener("click", () => {
          winOverlay_mt.style.opacity = 0;
          winOverlay_mt.style.pointerEvents = "none";
          if (mtCurrentLevel < MT_LEVELS.length - 1) {
              mtStartLevel(mtCurrentLevel + 1);
          } else {
              multiplesTapModal.classList.remove('active');
              collectAllGameResults();
          }
        });

        function startMultiplesTap() {
          mtStartLevel(0);
        }
        /* MULTIPLES TAP SCRIPT END */
      