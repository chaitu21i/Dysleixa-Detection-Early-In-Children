
        /* MEMORY MATCH SCRIPT START (Modified for Modal) */
        const MM_LEVELS = [
          { rows: 3, cols: 2 },
          { rows: 3, cols: 4 },
          { rows: 4, cols: 4 },
          { rows: 4, cols: 5 },
          { rows: 5, cols: 4 },
        ];
        const MM_TIME_LIMIT = 20; // seconds

        let mmCurrentLevel = 0;
        const grid_mm = document.getElementById("grid_mm");
        const countdownOverlay_mm = document.getElementById("countdownOverlay_mm");
        const winScreen_mm = document.getElementById("winScreen_mm");
        const winText_mm = document.getElementById("winText_mm");
        const nextLevelBtn_mm = document.getElementById("nextLevelBtn_mm");
        const memoryMatchModal = document.getElementById("gameModal-memory_match");

        // HUD elements
        const levelDisplay_mm = document.getElementById("levelDisplay_mm");
        const clicksDisplay_mm = document.getElementById("clicksDisplay_mm");
        const timeDisplay_mm = document.getElementById("timeDisplay_mm");
        const hitsStat_mm = document.getElementById("hitsStat_mm");
        const missesStat_mm = document.getElementById("missesStat_mm");
        const scoreStat_mm = document.getElementById("scoreStat_mm");

        const MM_EMOJIS = [
          "🐶", "🐱", "🐻", "🐼", "🦁", "🐵", "🐸", "🐰", "🦊", "🐯", "🐙", "🦄", "🦋", "🐔", "🍎", "🍉", "🍌", "🍓", "🍇", "🌟",
        ];

        let mmClicks = 0;
        let mmHits = 0;
        let mmMisses = 0;
        let mmTimeRemaining = MM_TIME_LIMIT;
        let mmTimerInterval = null;

        let mmFirstCard = null;
        let mmLock = false;
        let mmMatchedPairs = 0;
        
        // Custom save function for Memory Match to handle its unique metric structure
        function mmSaveTaskResult(levelIndex, clicks, hits, misses) {
          let all = JSON.parse(localStorage.getItem("memory_match")) || [];
          all[levelIndex] = { clicks: clicks, hits: hits, misses: misses, score: hits * 10 - misses * 5, level: levelIndex + 1 };
          localStorage.setItem("memory_match", JSON.stringify(all));
        }

        function mmStartLevel(levelIndex) {
          mmCurrentLevel = levelIndex;

          mmClicks = 0;
          mmHits = 0;
          mmMisses = 0;
          mmTimeRemaining = MM_TIME_LIMIT;

          levelDisplay_mm.textContent = levelIndex + 1;
          clicksDisplay_mm.textContent = 0;
          timeDisplay_mm.textContent = MM_TIME_LIMIT;

          winScreen_mm.classList.remove("win-show");
          mmPrepareLevel();

          mmShowCountdown(() => mmEnableCards());
        }

        function mmPrepareLevel() {
          const { rows, cols } = MM_LEVELS[mmCurrentLevel];

          grid_mm.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
          grid_mm.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
          grid_mm.innerHTML = "";

          const totalCards = rows * cols;
          const pairCount = totalCards / 2;

          const selected = MM_EMOJIS.slice(0, pairCount);
          const cards = [...selected, ...selected].sort(
            () => Math.random() - 0.5
          );

          mmMatchedPairs = 0;
          mmFirstCard = null;
          mmLock = false;

          cards.forEach((symbol, index) => {
            const card = document.createElement("div");
            card.className = "card_mm";
            card.dataset.symbol = symbol;
            card.dataset.index = index;

            const inner = document.createElement("div");
            inner.className = "card-inner_mm";

            const front = document.createElement("div");
            front.className = "card-face_mm card-front_mm";

            const back = document.createElement("div");
            back.className = "card-face_mm card-back_mm";
            back.textContent = symbol;

            inner.appendChild(front);
            inner.appendChild(back);
            card.appendChild(inner);
            grid_mm.appendChild(card);

            card.addEventListener("click", () => mmOnCardClick(card));
          });
        }

        function mmShowCountdown(callback) {
          const sequence = ["Game Starts In", "3", "2", "1", "GO!"];
          let i = 0;

          countdownOverlay_mm.style.opacity = 1;

          function next() {
            countdownOverlay_mm.textContent = sequence[i];
            countdownOverlay_mm.classList.add("count-anim");

            setTimeout(
              () => countdownOverlay_mm.classList.remove("count-anim"),
              600
            );

            if (i < sequence.length - 1) {
              i++;
              setTimeout(next, 900);
            } else {
              setTimeout(() => {
                countdownOverlay_mm.style.opacity = 0;
                callback();
              }, 600);
            }
          }

          next();
        }

        function mmOnCardClick(card) {
          if (mmLock || card.classList.contains("is-flipped")) return;

          mmClicks++; 
          clicksDisplay_mm.textContent = mmClicks;
          card.classList.add("is-flipped");

          if (!mmFirstCard) {
            mmFirstCard = card;
            return;
          }

          mmLock = true;

          if (mmFirstCard.dataset.symbol === card.dataset.symbol) {
            mmHits++; 
            mmMatchedPairs++;

            setTimeout(() => {
              mmLock = false;
              mmFirstCard = null;

              if (
                mmMatchedPairs ===
                (MM_LEVELS[mmCurrentLevel].rows * MM_LEVELS[mmCurrentLevel].cols) / 2
              ) {
                mmStopTimer();
                mmShowWin();
              }
            }, 600);
          } else {
            mmMisses++; 

            setTimeout(() => {
              mmFirstCard.classList.remove("is-flipped");
              card.classList.remove("is-flipped");
              mmFirstCard = null;
              mmLock = false;
            }, 700);
          }
        }

        function mmShowWin() {
          winText_mm.textContent =
            mmCurrentLevel === MM_LEVELS.length - 1
              ? "All Levels Completed!"
              : "Level Complete!";

          winScreen_mm.classList.add("win-show");

          // ------- SAVE RESULT FOR THIS LEVEL ------
          mmSaveTaskResult(mmCurrentLevel, mmClicks, mmHits, mmMisses);
          
          // Reset counters for next level
          mmClicks = 0;
          mmHits = 0;
          mmMisses = 0;

          // Update Next Level Button text
          if (mmCurrentLevel < MM_LEVELS.length - 1) {
            nextLevelBtn_mm.textContent = `Continue to Level ${mmCurrentLevel + 2}`;
          } else {
            nextLevelBtn_mm.textContent = "Finish Game";
          }
        }

        nextLevelBtn_mm.addEventListener("click", () => {
          mmStopTimer();
          if (mmCurrentLevel < MM_LEVELS.length - 1) {
            mmStartLevel(mmCurrentLevel + 1);
          } else {
            memoryMatchModal.classList.remove('active');
            collectAllGameResults(); // Update progress bar on the hub
          }
        });

        function mmEnableCards() {
          [...document.querySelectorAll("#grid_mm .card_mm")].forEach((c) =>
            c.style.pointerEvents = "auto"
          );
          mmStartTimer();
        }

        function mmStartTimer() {
          if (mmTimerInterval) clearInterval(mmTimerInterval);
          mmTimeRemaining = MM_TIME_LIMIT;
          mmTimerInterval = setInterval(() => {
            mmTimeRemaining--;
            timeDisplay_mm.textContent = mmTimeRemaining;

            if (mmTimeRemaining <= 0) {
              clearInterval(mmTimerInterval);
              mmTimerInterval = null;
              mmShowGameOver();
            }
          }, 1000);
        }

        function mmStopTimer() {
          if (mmTimerInterval) {
            clearInterval(mmTimerInterval);
            mmTimerInterval = null;
          }
        }

        function mmShowGameOver() {
          mmLock = true;
          winText_mm.textContent = "Time's Up!";
          winScreen_mm.classList.add("win-show");
          mmSaveTaskResult(mmCurrentLevel, mmClicks, mmHits, mmMisses);
        }
        
        function startMemoryMatch() {
            mmStartLevel(0);
        }
        /* MEMORY MATCH SCRIPT END */
      