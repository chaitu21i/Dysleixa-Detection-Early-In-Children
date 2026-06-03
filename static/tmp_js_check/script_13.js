
  // Robust initializer to ensure games render and provide a visible badge.
  function initApp(){
    try {
      // Default games list used when the project does not populate one.
      const _defaultGames = [
        { file: "bubble_math_pop.html", key: "bubble_math_pop", levels: 3, isModal: true },
        { file: "color_fuse.html", key: "color_fuse", levels: 3, isModal: true },
        { file: "direction_dash.html", key: "direction_dash", levels: 3, isModal: true },
        { file: "lightning_tap.html", key: "lightning_tap", levels: 3, isModal: true },
        { file: "math_burst.html", key: "math_burst", levels: 3, isModal: true },
        { file: "memory_match.html", key: "memory_match", levels: 3, isModal: true },
        { file: "multiples_tap.html", key: "multiples_tap", levels: 3, isModal: true },
        { file: "number_order_tap.html", key: "number_order_tap", levels: 2, isModal: true },
        { file: "sequence_memory.html", key: "sequence_memory", levels: 3, isModal: true },
        { file: "shape_pop.html", key: "shape_pop", levels: 3, isModal: true },
        { file: "speed_tap.html", key: "speed_tap", levels: 3, isModal: true }
      ];

      if (typeof gameMap === 'undefined' || !gameMap) {
        // No gameMap defined — create a global one
        window.gameMap = _defaultGames.slice();
      } else if (Array.isArray(gameMap) && gameMap.length === 0) {
        // gameMap exists but is empty — push defaults into it so renderGames uses them
        gameMap.push(..._defaultGames);
      } else if (!Array.isArray(gameMap)) {
        // Unexpected type — set a sane default on window
        window.gameMap = _defaultGames.slice();
      }

      if (typeof renderGames === 'function') renderGames();
      const gamesGridEl = document.getElementById('gamesGrid');
      const count = gamesGridEl ? gamesGridEl.children.length : 0;

      // Status badge
      let badge = document.getElementById('gamesStatusBadge');
      if(!badge){
        badge = document.createElement('div');
        badge.id = 'gamesStatusBadge';
        badge.style = 'position:fixed;left:12px;bottom:12px;padding:8px 12px;border-radius:8px;background:#072;color:#fff;font-weight:700;z-index:12000;box-shadow:0 6px 18px rgba(0,0,0,0.2)';
        document.body.appendChild(badge);
      }
      badge.textContent = `Games loaded: ${count}`;

      // If no games, show inline message
      if (count === 0 && gamesGridEl) {
        let msg = document.getElementById('noGamesMsg');
        if (!msg) {
          msg = document.createElement('div');
          msg.id = 'noGamesMsg';
          msg.textContent = 'No games available — check the static folder or refresh.';
          msg.style = 'padding:12px;margin-top:10px;border-radius:8px;background:#fff3;color:#333;';
          gamesGridEl.parentNode.insertBefore(msg, gamesGridEl.nextSibling);
        }
      } else {
        const existing = document.getElementById('noGamesMsg'); if(existing) existing.remove();
      }

      // Ensure listeners initialized
      if (typeof setupGameButtonListeners === 'function') setupGameButtonListeners();
      if (typeof initSpeechRecognition === 'function') initSpeechRecognition();

    } catch(err){
      console.error('initApp failed', err);
      let ebox = document.getElementById('initErrorBox');
      if(!ebox){ ebox = document.createElement('div'); ebox.id='initErrorBox'; ebox.style='position:fixed;left:12px;top:12px;padding:12px;border-radius:8px;background:#fee;color:#600;z-index:12000;'; document.body.appendChild(ebox); }
      ebox.textContent = 'Initialization error: '+(err && err.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
