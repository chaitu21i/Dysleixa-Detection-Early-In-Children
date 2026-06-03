
        /* MATH BURST SCRIPT START (Modified for Modal) */
        const MB_LEVELS = [
          { rows: 3, cols: 3, speed: 4000, ops: ["+"] },
          { rows: 4, cols: 4, speed: 4000, ops: ["+", "-", "×"] },
          { rows: 5, cols: 5, speed: 4000, ops: ["+", "-", "×", "÷"] },
        ];
        const ROUNDS_PER_LEVEL_MB = 2; // Fixed number of rounds for Math Burst

        const grid_mb = document.getElementById("grid_mb");
        const countdown_mb = document.getElementById("countdownOverlay_mb");
        const winOverlay_mb = document.getElementById("winOverlay_mb");
        const winText_mb = document.getElementById("winText_mb");

        const levelDisplay_mb = document.getElementById("levelDisplay_mb");
        const scoreDisplay_mb = document.getElementById("scoreDisplay_mb");
        const hitsDisplay_mb = document.getElementById("hitsDisplay_mb");
        const missesDisplay_mb = document.getElementById("missesDisplay_mb");
        const equationDisplay_mb = document.getElementById("equationDisplay_mb");

        const nextBtn_mb = document.getElementById("nextLevelBtn_mb");
        const mathBurstModal = document.getElementById("gameModal-math_burst");

        let mbCurrentLevel = 0;
        let mbTiles = [];
        let mbCorrectAnswer = null;

        let mbHits = 0;
        let mbMisses = 0;
        let mbScore = 0;

        let mbCycleCount = 0;
        let mbCycleTimer = null;
        let mbLocked = false;

        let mbGameLog = [];

        const mbRand = (max) => Math.floor(Math.random() * max);

        let mbAnsweredThisCycle = false;

        function mbBuildGrid(level) {
          grid_mb.innerHTML = "";
          mbTiles = [];

          grid_mb.style.gridTemplateRows = `repeat(${level.rows}, 1fr)`;
          grid_mb.style.gridTemplateColumns = `repeat(${level.cols}, 1fr)`;

          const total = level.rows * level.cols;

          for (let i = 0; i < total; i++) {
            const tile = document.createElement("div");
            tile.className = "tile_mb";
            tile.addEventListener("click", () => mbTileClicked(i));
            mbTiles.push(tile);
            grid_mb.appendChild(tile);
          }
        }

        function mbStartLevel(levelIndex) {
          if(mbCycleTimer) clearTimeout(mbCycleTimer);

          mbCurrentLevel = levelIndex;

          mbHits = 0;
          mbMisses = 0;
          mbScore = 0;
          mbCycleCount = 0;
          mbLocked = false;
          mbGameLog = [];

          levelDisplay_mb.textContent = mbCurrentLevel + 1;
          mbUpdateHUD();

          mbBuildGrid(MB_LEVELS[mbCurrentLevel]);
          mbShowCountdown().then(() => mbRunGame());
        }

        function mbShowCountdown() {
          return new Promise((resolve) => {
            countdown_mb.style.opacity = 1;
            let c = 3;
            countdown_mb.textContent = c;

            const timer = setInterval(() => {
              c--;
              countdown_mb.textContent = c;
              if (c === 0) {
                clearInterval(timer);
                countdown_mb.style.opacity = 0;
                resolve();
              }
            }, 900);
          });
        }

        function mbRunGame() {
          mbNextProblem();
        }

        function mbNextProblem() {
          const lvl = MB_LEVELS[mbCurrentLevel];

          if (mbCycleCount >= ROUNDS_PER_LEVEL_MB) {
            return mbEndLevel();
          }

          mbGenerateEquation();
          mbFillTiles();

          mbAnsweredThisCycle = false; 
          
          // Clear previous tile flashes
          mbTiles.forEach(t => t.classList.remove("tap-flash"));

          mbCycleCount++;

          mbCycleTimer = setTimeout(mbNextProblem, lvl.speed);
        }

        function mbGenerateEquation() {
          const lvl = MB_LEVELS[mbCurrentLevel];
          const ops = lvl.ops;

          const op = ops[mbRand(ops.length)];

          let a, b, ans;

          if (op === "+") {
            a = mbRand(10) + 1;
            b = mbRand(10) + 1;
            ans = a + b;
          } else if (op === "-") {
            a = mbRand(15) + 10;
            b = mbRand(10);
            ans = a - b;
          } else if (op === "×") {
            a = mbRand(10) + 1;
            b = mbRand(10) + 1;
            ans = a * b;
          } else {
            // division with whole number
            b = mbRand(9) + 2;
            let m = mbRand(9) + 1;
            a = b * m;
            ans = m;
          }

          mbCorrectAnswer = ans;

          equationDisplay_mb.textContent = `${a} ${op} ${b} = ?`;

          mbGameLog.push({ eq: `${a}${op}${b}`, answer: ans });
        }

        function mbFillTiles() {
          const correctIndex = mbRand(mbTiles.length);

          mbTiles.forEach((tile, i) => {
            if (i === correctIndex) {
              tile.textContent = mbCorrectAnswer;
            } else {
              let wrong;
              do {
                wrong = mbCorrectAnswer + mbRand(11) - 5;
              } while (wrong === mbCorrectAnswer || wrong < -20 || wrong > 200);
              tile.textContent = wrong;
            }
          });
        }

        function mbTileClicked(index) {
          if (mbLocked || mbAnsweredThisCycle) return;

          const value = Number(mbTiles[index].textContent);

          if (value === mbCorrectAnswer) {
            mbAnsweredThisCycle = true; 
            mbHits++;
            mbScore += 10;

            mbTiles[index].classList.add("tap-flash");
            setTimeout(() => mbTiles[index].classList.remove("tap-flash"), 200);
          } else {
            mbMisses++;
            mbScore = Math.max(0, mbScore - 2);
          }

          mbUpdateHUD();
        }

        function mbUpdateHUD() {
          hitsDisplay_mb.textContent = mbHits;
          missesDisplay_mb.textContent = mbMisses;
          scoreDisplay_mb.textContent = mbScore;
        }

        function mbEndLevel() {
          mbLocked = true;
          clearTimeout(mbCycleTimer);

          const result = {
            level: mbCurrentLevel + 1,
            hits: mbHits,
            misses: mbMisses,
            score: mbScore,
          };

          let saved = JSON.parse(localStorage.getItem("math_burst")) || [];
          saved[mbCurrentLevel] = result;
          localStorage.setItem("math_burst", JSON.stringify(saved));

          // Reset state for next launch
          mbHits = 0;
          mbMisses = 0;
          mbScore = 0;
          
          winText_mb.textContent = `Level ${
            mbCurrentLevel + 1
          } Complete! Hits: ${result.hits}, Misses: ${result.misses}, Score: ${result.score}`;

          winOverlay_mb.style.opacity = 1;
          winOverlay_mb.style.pointerEvents = "auto";
        }

        nextBtn_mb.addEventListener("click", () => {
          winOverlay_mb.style.opacity = 0;
          winOverlay_mb.style.pointerEvents = "none";

          if (mbCurrentLevel < MB_LEVELS.length - 1) {
              mbStartLevel(mbCurrentLevel + 1);
          }
          else {
              mathBurstModal.classList.remove('active');
              collectAllGameResults(); // Update progress bar on the hub
          }
        });

        // Wrapper called by the main hub code to start the game
        function startMathBurst() {
            mbStartLevel(0);
        }
        /* MATH BURST SCRIPT END */
      