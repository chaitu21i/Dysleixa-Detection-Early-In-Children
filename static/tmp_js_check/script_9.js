
        /* SEQUENCE MEMORY SCRIPT START (Copied from sequence_memory.html) */
        function saveToSequenceMemory(log) {
          let arr = JSON.parse(localStorage.getItem("sequence_memory") || "[]");
          arr.push(log);
          localStorage.setItem("sequence_memory", JSON.stringify(arr));
        }

        const SQ_LEVELS = [
            { rows: 2, cols: 2, seq: 3 }, // Level 1 → 3 tiles
            { rows: 2, cols: 3, seq: 4 }, // Level 2 → 4 tiles
            { rows: 2, cols: 3, seq: 5 }, // Level 3 → 5 tiles
        ];

        let sqLevel = 0;

        const gridEl_sq = document.getElementById("grid_sq");
        const levelText_sq = document.getElementById("levelText_sq");
        const statusBadge_sq = document.getElementById("statusBadge_sq");
        const timerEl_sq = document.getElementById("timer_sq");
        const mistakesEl_sq = document.getElementById("mistakes_sq");
        const countdownOverlay_sq = document.getElementById("countdownOverlay_sq");
        const countNumber_sq = document.getElementById("countNumber_sq");
        const winOverlay_sq = document.getElementById("winOverlay_sq");
        const winText_sq = document.getElementById("winText_sq");
        const nextBtn_sq = document.getElementById("nextBtn_sq");
        const sequenceMemoryModal = document.getElementById("gameModal-sequence_memory");


        let sqTiles = [];
        let sqSequence = [];
        let sqIndex = 0;
        let sqMistakes = 0;
        let sqStartTime = 0;
        let sqTimerInt = null;
        let sqLocked = false;

        let sqLog = null;

        function sqFmt(t) {
            const s = Math.floor(t / 1000);
            return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(
              s % 60
            ).padStart(2, "0")}`;
        }

        function sqBuildGrid() {
            const cfg = SQ_LEVELS[sqLevel];
            gridEl_sq.style.gridTemplateRows = `repeat(${cfg.rows},1fr)`;
            gridEl_sq.style.gridTemplateColumns = `repeat(${cfg.cols},1fr)`;
            gridEl_sq.innerHTML = "";
            sqTiles = [];

            const count = cfg.rows * cfg.cols;
            for (let i = 0; i < count; i++) {
                const t = document.createElement("div");
                t.className = "tile_sq";
                t.textContent = i + 1;
                t.dataset.index = i;
                t.onclick = sqOnTileTap;
                gridEl_sq.appendChild(t);
                sqTiles.push(t);
            }
        }

        function sqGenerateSequence() {
            const len = SQ_LEVELS[sqLevel].seq;
            sqSequence = [];
            for (let i = 0; i < len; i++) {
                sqSequence.push(Math.floor(Math.random() * sqTiles.length));
            }
        }

        function sqFlash(i) {
            const t = sqTiles[i];
            t.classList.add("glow");
            setTimeout(() => t.classList.remove("glow"), 300);
        }

        async function sqPlaySequence() {
            gridEl_sq.classList.add("blocked");
            statusBadge_sq.textContent = "Watch";
            await new Promise((r) => setTimeout(r, 400));

            for (let i = 0; i < sqSequence.length; i++) {
                sqFlash(sqSequence[i]);
                sqLog.raw.push({
                    time: Date.now() - sqStartTime,
                    event: "flash",
                    value: sqSequence[i],
                });
                await new Promise((r) => setTimeout(r, 600));
            }

            gridEl_sq.classList.remove("blocked");
            statusBadge_sq.textContent = "Your Turn";
            sqLocked = false;
        }

        function sqOnTileTap(e) {
            if(sqLocked) return;
            const idx = Number(e.currentTarget.dataset.index);
            const now = Date.now();
            sqLog.raw.push({ time: now - sqStartTime, event: "tap", value: idx });

            sqFlash(idx);

            if (idx === sqSequence[sqIndex]) {
                sqIndex++;
                if (sqIndex === sqSequence.length) {
                    clearInterval(sqTimerInt);
                    sqLocked = true;
                    sqLog.end = new Date().toISOString();
                    sqLog.duration = now - sqStartTime;
                    sqLog.mistakes = sqMistakes;
                    sqLog.success = 1;

                    // Save
                    saveToSequenceMemory(sqLog);

                    winText_sq.textContent = `Level ${sqLevel + 1} Complete! Mistakes: ${sqMistakes}, Time: ${sqFmt(sqLog.duration)}`;
                    winOverlay_sq.style.opacity = 1;
                    winOverlay_sq.style.pointerEvents = "auto";
                    statusBadge_sq.textContent = "Completed";
                }
            } else {
                sqMistakes++;
                mistakesEl_sq.textContent = sqMistakes;
                sqLog.raw.push({
                    time: now - sqStartTime,
                    event: "mistake",
                    value: { expected: sqSequence[sqIndex], got: idx },
                });
            }
        }

        async function startSequenceMemory(levelIndex = 0) {
            sqLevel = levelIndex;
            sqLocked = true; // Lock during prep/flash

            sqBuildGrid();
            levelText_sq.textContent = sqLevel + 1;
            sqMistakes = 0;
            mistakesEl_sq.textContent = "0";
            statusBadge_sq.textContent = "Ready";
            sqIndex = 0;
            if (sqTimerInt) clearInterval(sqTimerInt);
            timerEl_sq.textContent = "00:00";


            sqLog = {
                game: "SequenceMemory",
                level: sqLevel + 1,
                start: null,
                end: null,
                duration: 0,
                mistakes: 0,
                success: 0,
                sequence: [],
                raw: [],
            };

            await sqCountdown();
            sqStartTime = Date.now();
            sqLog.start = new Date(sqStartTime).toISOString();

            sqTimerInt = setInterval(() => {
                timerEl_sq.textContent = sqFmt(Date.now() - sqStartTime);
            }, 250);

            sqGenerateSequence();
            sqLog.sequence = sqSequence.slice();

            await sqPlaySequence();
        }

        function sqCountdown() {
            return new Promise((res) => {
                countdownOverlay_sq.style.opacity = 1;
                const seq = ["3", "2", "1", "GO!"];
                let i = 0;

                countNumber_sq.textContent = seq[i];

                const t = setInterval(() => {
                    i++;
                    if (i < seq.length) {
                        countNumber_sq.textContent = seq[i];
                    } else {
                        clearInterval(t);
                        setTimeout(() => {
                            countdownOverlay_sq.style.opacity = 0;
                            res();
                        }, 300);
                    }
                }, 700);
            });
        }

        nextBtn_sq.onclick = () => {
            winOverlay_sq.style.opacity = 0;
            winOverlay_sq.style.pointerEvents = "none";
            sqLevel++;
            if (sqLevel >= SQ_LEVELS.length) {
                statusBadge_sq.textContent = "All Levels Done!";
                sequenceMemoryModal.classList.remove('active');
                collectAllGameResults(); 
            } else {
                startSequenceMemory(sqLevel);
            }
        };
        /* SEQUENCE MEMORY SCRIPT END */
      