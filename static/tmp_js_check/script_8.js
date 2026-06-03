
        /* NUMBER ORDER TAP SCRIPT START (Copied from number_order_tap.html) */
        const NOT_LEVELS = [
          { rows: 3, cols: 3 },
          { rows: 3, cols: 4 },
        ];
        const NOT_ROUNDS_PER_LEVEL = 2;

        const grid_not = document.getElementById("grid_not");
        const countdownEl_not = document.getElementById("countdownOverlay_not");
        const winOverlay_not = document.getElementById("winOverlay_not");
        const winText_not = document.getElementById("winText_not");
        const nextBtn_not = document.getElementById("nextLevelBtn_not");
        const numberOrderTapModal = document.getElementById("gameModal-number_order_tap");

        const levelDisplay_not = document.getElementById("levelDisplay_not");
        const targetDisplay_not = document.getElementById("targetDisplay_not");
        const scoreDisplay_not = document.getElementById("scoreDisplay_not");
        const hitsDisplay_not = document.getElementById("hitsDisplay_not");
        const missesDisplay_not = document.getElementById("missesDisplay_not");

        let notCurrentLevel = 0;
        let notCurrentRound = 0;
        let notHits = 0,
          notMisses = 0,
          notScore = 0;

        let notTiles = [];
        let notTileValues = [];
        let notNextNumber = 1;
        let notLocked = false;

        const notRand = (min, max) =>
          Math.floor(Math.random() * (max - min + 1)) + min;
        const notShuffle = (arr) => arr.sort(() => Math.random() - 0.5);

        function notShowCountdown(sec) {
          return new Promise((resolve) => {
            countdownEl_not.style.opacity = 1;
            countdownEl_not.textContent = sec;

            let c = sec;
            const iv = setInterval(() => {
              c--;
              if (c > 0) countdownEl_not.textContent = c;
              else {
                clearInterval(iv);
                countdownEl_not.style.opacity = 0;
                resolve();
              }
            }, 1000);
          });
        }

        function notBuildGrid() {
          grid_not.innerHTML = "";
          notTiles = [];

          const cfg = NOT_LEVELS[notCurrentLevel];
          grid_not.style.gridTemplateRows = `repeat(${cfg.rows}, 1fr)`;
          grid_not.style.gridTemplateColumns = `repeat(${cfg.cols}, 1fr)`;

          for (let i = 0; i < cfg.rows * cfg.cols; i++) {
            const t = document.createElement("div");
            t.className = "tile_not"; // Changed to tile_not
            t.dataset.index = i;
            t.addEventListener("click", () => notTileClicked(i));
            grid_not.appendChild(t);
            notTiles.push(t);
          }
        }

        function notGenerateTiles() {
          const cfg = NOT_LEVELS[notCurrentLevel];
          const total = cfg.rows * cfg.cols;

          let numbers = [];
          while (numbers.length < total) {
            const n = notRand(1, 100);
            if (!numbers.includes(n)) numbers.push(n);
          }

          numbers.sort((a, b) => a - b); 

          notTileValues = [];
          const positions = [...Array(total).keys()];
          notShuffle(positions);

          for (let i = 0; i < total; i++) {
            notTileValues.push({
              index: positions[i],
              val: numbers[i],
              clicked: false,
            });
          }

          notTileValues.forEach((v) => {
            const t = notTiles[v.index];
            t.textContent = v.val;
            t.dataset.val = v.val;
            t.dataset.clicked = "0";
            t.classList.remove("correct-flip", "wrong-flash");
          });

          notNextNumber = 1;
          notUpdateHUD();
        }

        function notTileClicked(i) {
          if (notLocked) return;

          const t = notTiles[i];
          if (t.dataset.clicked === "1") return;

          const val = Number(t.dataset.val);
          const expectedVal = notTileValues.map(v => v.val).sort((a, b) => a - b)[notNextNumber - 1]; // Find the next expected value

          if (val === expectedVal) {
            notHits++;
            notScore += 10;
            t.dataset.clicked = "1";
            t.classList.add("correct-flip");

            notNextNumber++;
          } else {
            notMisses++;
            notScore = Math.max(0, notScore - 2);
            t.classList.add("wrong-flash");
            setTimeout(() => t.classList.remove("wrong-flash"), 250);
          }

          notUpdateHUD();

          if (notNextNumber > notTileValues.length) {
            setTimeout(() => notNextCycle(), 500);
          }
        }

        function notUpdateHUD() {
          hitsDisplay_not.textContent = notHits;
          missesDisplay_not.textContent = notMisses;
          scoreDisplay_not.textContent = notScore;
          targetDisplay_not.textContent =
            notNextNumber <= notTileValues.length ? notNextNumber : "-";
        }

        function notNextCycle() {
          notCurrentRound++;
          if (notCurrentRound > NOT_ROUNDS_PER_LEVEL) return notEndLevel();
          notGenerateTiles();
        }

        function startNumberOrderTap(levelIndex = 0) {
          notCurrentLevel = levelIndex;
          notHits = 0;
          notMisses = 0;
          notScore = 0;
          notCurrentRound = 0;
          notLocked = false;

          notUpdateHUD();
          notBuildGrid();

          levelDisplay_not.textContent = notCurrentLevel + 1;
          notShowCountdown(3).then(() => notNextCycle());
        }

        function notEndLevel() {
          notLocked = true;

          let saved = JSON.parse(localStorage.getItem("number_order_tap")) || [];

          saved[notCurrentLevel] = {
            level: notCurrentLevel + 1,
            hits: notHits,
            misses: notMisses,
            score: notScore,
          };

          localStorage.setItem("number_order_tap", JSON.stringify(saved));

          winText_not.textContent = `Level ${
            notCurrentLevel + 1
          } Complete! Hits: ${notHits}, Misses: ${notMisses}, Score: ${notScore}`;

          winOverlay_not.style.opacity = 1;
          winOverlay_not.style.pointerEvents = "auto";
        }

        nextBtn_not.addEventListener("click", () => {
          winOverlay_not.style.opacity = 0;
          winOverlay_not.style.pointerEvents = "none";

          if (notCurrentLevel < NOT_LEVELS.length - 1) startNumberOrderTap(notCurrentLevel + 1);
          else {
            numberOrderTapModal.classList.remove('active');
            collectAllGameResults(); 
          }
        });
        /* NUMBER ORDER TAP SCRIPT END */
      