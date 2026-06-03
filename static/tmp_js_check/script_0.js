
        /* BUBBLE MATH POP SCRIPT START (Modified for Modal) */
        const BUBBLE_LEVELS = [
          { rows: 3, cols: 4, time: 10000, bubbles: 3, maxNum: 5 },
          { rows: 3, cols: 4, time: 10000, bubbles: 3, maxNum: 10 },
          { rows: 4, cols: 3, time: 10000, bubbles: 4, maxNum: 5 },
        ];
        const BUBBLE_OPERATORS = ["+", "-", "×", "÷"];

        const gameGrid = document.getElementById("gameGrid");
        const gameCountdownEl = document.getElementById("gameCountdownOverlay");
        const gameWinOverlay = document.getElementById("gameWinOverlay");
        const gameWinText = document.getElementById("winText");
        const gameNextBtn = document.getElementById("nextLevelBtn");
        const gameLevelDisplay = document.getElementById("levelDisplay");
        const gameScoreDisplay = document.getElementById("scoreDisplay");
        const gameHitsDisplay = document.getElementById("hitsDisplay");
        const gameMissesDisplay = document.getElementById("missesDisplay");
        const gameTimerDisplay = document.getElementById("timerDisplay");
        const bubbleMathModal = document.getElementById("gameModal-bubble_math_pop");

        let gameCurrentLevel = 0, gameHits = 0, gameMisses = 0, gameScore = 0, gameLocked = false, gameTimerInterval = null, gameCurrentTime = 0;
        let gameBubbles = [], gameBubbleValues = [], gameClickOrder = [];

        function gameRand(max) { return Math.floor(Math.random() * max); }
        function gamePick(arr) { return arr[gameRand(arr.length)]; }

        function gameEvalExpr(expr) {
          if (expr.includes("+")) return expr.split("+").map(Number).reduce((a, b) => a + b);
          if (expr.includes("-")) return expr.split("-").map(Number).reduce((a, b) => a - b);
          if (expr.includes("×")) return expr.split("×").map(Number).reduce((a, b) => a * b);
          if (expr.includes("÷")) return expr.split("÷").map(Number).reduce((a, b) => a / b);
        }

        function gameShowCountdown(sec) {
          return new Promise((res) => {
            gameCountdownEl.style.opacity = 1;
            gameCountdownEl.textContent = sec;
            let c = sec;
            let iv = setInterval(() => {
              c--;
              if (c > 0) gameCountdownEl.textContent = c;
              else {
                clearInterval(iv);
                gameCountdownEl.style.opacity = 0;
                res();
              }
            }, 1000);
          });
        }

        function gameBuildGrid() {
          gameGrid.innerHTML = "";
          gameBubbles = [];
          const cfg = BUBBLE_LEVELS[gameCurrentLevel];
          gameGrid.style.gridTemplateRows = `repeat(${cfg.rows},1fr)`;
          gameGrid.style.gridTemplateColumns = `repeat(${cfg.cols},1fr)`;

          for (let i = 0; i < cfg.rows * cfg.cols; i++) {
            const b = document.createElement("div");
            b.className = "bubble";
            b.dataset.index = i;
            b.addEventListener("click", () => gameBubbleClicked(i));
            gameGrid.appendChild(b);
            gameBubbles.push(b);
          }
        }

        function gameGenerateBubbles() {
          const cfg = BUBBLE_LEVELS[gameCurrentLevel];
          gameBubbleValues = [];
          gameClickOrder = [];

          const used = new Set();
          const positions = [...Array(cfg.rows * cfg.cols).keys()].sort(
            () => Math.random() - 0.5
          );

          for (let i = 0; i < cfg.bubbles; i++) {
            let expr, val;
            do {
              const a = gameRand(cfg.maxNum) + 1;
              const b = gameRand(cfg.maxNum) + 1;
              const op = gamePick(BUBBLE_OPERATORS);
              if (op === "÷" && b === 0) continue;
              expr = `${a}${op}${b}`;
              val = gameEvalExpr(expr);
            } while (used.has(val));

            used.add(val);
            gameBubbleValues.push({
              expr, val, index: positions[i], selected: false,
            });
          }

          for (let i = 0; i < gameBubbles.length; i++) {
            const b = gameBubbles[i];
            const found = gameBubbleValues.find((v) => v.index === i);
            if (found) {
              b.textContent = found.expr;
              b.dataset.val = found.val;
              found.el = b;
            } else {
              b.textContent = "";
              b.dataset.val = "";
            }
            b.classList.remove("tap-flash");
          }
          gameBubbleValues.sort((a, b) => a.val - b.val);
        }

        function gameBubbleClicked(i) {
          if (gameLocked) return;

          const b = gameBubbles[i];
          const value = Number(b.dataset.val);
          if (!value) return;

          const entry = gameBubbleValues.find((v) => v.index === i);
          if (entry.selected) {
            entry.selected = false;
            b.classList.remove("tap-flash");
            gameClickOrder = gameClickOrder.filter((v) => v !== value);
            return;
          }

          entry.selected = true;
          b.classList.add("tap-flash");
          gameClickOrder.push(value);

          const correctOrder = gameBubbleValues.map((v) => v.val);

          for (let k = 0; k < gameClickOrder.length; k++) {
            if (gameClickOrder[k] !== correctOrder[k]) {
              gameMisses++;
              gameScore = Math.max(0, gameScore - 2);
              gameUpdateHUD();
              return;
            }
          }

          gameHits++;
          gameScore += 10;
          gameUpdateHUD();
        }

        function gameStartTimer(duration) {
          gameCurrentTime = duration / 1000;
          gameTimerDisplay.textContent = gameCurrentTime;
          if(gameTimerInterval) clearInterval(gameTimerInterval);

          gameTimerInterval = setInterval(() => {
            gameCurrentTime--;
            gameTimerDisplay.textContent = gameCurrentTime;
            if (gameCurrentTime <= 0) {
              clearInterval(gameTimerInterval);
              gameFinishLevel();
            }
          }, 1000);
        }

        function gameFinishLevel() {
          gameLocked = true;
          if(gameTimerInterval) clearInterval(gameTimerInterval);


          const correctOrder = gameBubbleValues.map((v) => v.val);
          let correctSequence = true;

          for (let k = 0; k < gameClickOrder.length; k++) {
            if (gameClickOrder[k] !== correctOrder[k]) {
              correctSequence = false;
              break;
            }
          }

          if (!correctSequence) gameMisses++;

          const result = {
            level: gameCurrentLevel + 1,
            hits: gameHits,
            misses: gameMisses,
            score: gameScore,
          };

          let saved = JSON.parse(localStorage.getItem("bubble_math_pop")) || [];
          saved[gameCurrentLevel] = result;
          localStorage.setItem("bubble_math_pop", JSON.stringify(saved));
          
          // Reset state for next launch
          gameHits = 0;
          gameMisses = 0;
          gameScore = 0;

          gameWinText.textContent = `Level ${
            gameCurrentLevel + 1
          } Complete! Hits:${result.hits}, Misses:${result.misses}, Score:${result.score}`;
          gameWinOverlay.style.opacity = 1;
          gameWinOverlay.style.pointerEvents = "auto";
        }

        // Main function to launch a level. Called by hub via `startBubbleMathPop`
        function gameStartLevel(levelIndex) {
          if(gameTimerInterval) clearInterval(gameTimerInterval);
          
          gameCurrentLevel = levelIndex;
          gameLocked = false;
          gameClickOrder = [];

          gameUpdateHUD();
          gameBuildGrid();

          gameLevelDisplay.textContent = gameCurrentLevel + 1;

          gameShowCountdown(3).then(() => {
            gameGenerateBubbles();
            gameStartTimer(BUBBLE_LEVELS[gameCurrentLevel].time);
          });
        }
        
        function gameUpdateHUD() {
          gameHitsDisplay.textContent = gameHits;
          gameMissesDisplay.textContent = gameMisses;
          gameScoreDisplay.textContent = gameScore;
        }

        // Handler for the "Next Level" button inside the game modal
        gameNextBtn.addEventListener("click", () => {
          gameWinOverlay.style.opacity = 0;
          gameWinOverlay.style.pointerEvents = "none";

          if (gameCurrentLevel < BUBBLE_LEVELS.length - 1) {
            gameStartLevel(gameCurrentLevel + 1);
          } else {
            // If all levels complete, close modal and update hub progress
            bubbleMathModal.classList.remove('active');
            collectAllGameResults(); // Update progress bar on the hub
          }
        });
        
        // Wrapper called by the main hub code to start the game
        function startBubbleMathPop() {
            gameStartLevel(0);
        }
        /* BUBBLE MATH POP SCRIPT END */
      