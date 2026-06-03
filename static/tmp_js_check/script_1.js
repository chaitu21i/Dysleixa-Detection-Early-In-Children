
    let pendingGameToStart = null;

    function openSignup(gameStarterFunction) {
      pendingGameToStart = gameStarterFunction;
      document.getElementById("signupModal").classList.add("active");
    }

    function submitSignup() {
      const name = document.getElementById("playerName").value.trim();
      const ageInput = document.getElementById("playerAge").value;
      const age = parseInt(ageInput);
      const error = document.getElementById("signupError");

      if (!name) {
        error.textContent = "Please enter your name";
        return;
      }

      if (!ageInput || isNaN(age) || age < 5 || age > 12) {
        error.textContent = "Oops! Age must be between 5 and 12";
        return;
      }

      // Save signup data
      localStorage.setItem("player_profile", JSON.stringify({
        name,
        age,
        time: new Date().toISOString()
      }));

      // Also save user account for UI persistence
      localStorage.setItem("user_account", JSON.stringify({
        name,
        age,
        createdAt: new Date().toISOString()
      }));

      // Update UI
      document.getElementById("userId").textContent = name;
      document.getElementById("profileLetter").textContent = name.charAt(0).toUpperCase();
      document.getElementById("profileContainer").style.display = "block";
      document.getElementById("authButtons").style.display = "none";
      document.getElementById("logoutBtn").style.display = "none";

      // Close modal
      document.getElementById("signupModal").classList.remove("active");
      error.textContent = "";

      // Start the game
      if (pendingGameToStart) {
        pendingGameToStart();
        pendingGameToStart = null;
      }
    }

    function handleLogout() {
      localStorage.removeItem("player_profile");
      localStorage.removeItem("user_account");
      document.getElementById("userId").textContent = "Guest";
      document.getElementById("authButtons").style.display = "flex";
      document.getElementById("logoutBtn").style.display = "none";
      alert("Logged out successfully!");
      location.reload();
    }

    // Toggle the profile dropdown visibility
    function toggleProfileDropdown() {
      const d = document.getElementById('profileDropdown');
      if (!d) return;
      d.classList.toggle('show');
    }

    // Close dropdown if click happens outside
    document.addEventListener('click', function (e) {
      const container = document.getElementById('profileContainer');
      const dropdown = document.getElementById('profileDropdown');
      if (!container || !dropdown) return;
      if (!container.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });

    // Show a small profile modal with name/age and an edit button
    function showMyProfile() {
      const p = JSON.parse(localStorage.getItem('player_profile') || 'null');
      const name = p && p.name ? p.name : 'Guest';
      const age = p && p.age ? p.age : '-';

      const modal = document.createElement('div');
      Object.assign(modal.style, {
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,20,0.9)', zIndex: 9999
      });

      const box = document.createElement('div');
      Object.assign(box.style, {
        width: '92%', maxWidth: '420px', background: '#071028', color: '#dff7ff', padding: '18px', borderRadius: '12px', textAlign: 'center'
      });

      box.innerHTML = `<div style="font-weight:800;font-size:18px;margin-bottom:8px">My Profile</div>
        <div style="margin-bottom:6px"><strong>Name:</strong> ${name}</div>
        <div style="margin-bottom:6px"><strong>Age:</strong> ${age}</div>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:14px">
          <button id="editFromProfile" style="padding:10px 12px;border-radius:8px;background:linear-gradient(90deg,var(--accent2),var(--accent1));border:none;color:#021024;font-weight:800">Edit Profile</button>
          <button id="closeProfile" style="padding:10px 12px;border-radius:8px;background:#333;border:none;color:#cfeeff">Close</button>
        </div>`;

      modal.appendChild(box);
      document.body.appendChild(modal);

      document.getElementById('closeProfile').addEventListener('click', () => modal.remove());
      document.getElementById('editFromProfile').addEventListener('click', () => { modal.remove(); editProfile(); });

      // Hide dropdown
      const dd = document.getElementById('profileDropdown'); if (dd) dd.classList.remove('show');
    }

    // Edit profile inline — opens a modal similar to signup but saves changes in-place
    function editProfile() {
      const existing = JSON.parse(localStorage.getItem('player_profile') || 'null') || {};
      const modal = document.createElement('div');
      Object.assign(modal.style, { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,20,0.9)', zIndex: 9999 });

      const box = document.createElement('div');
      Object.assign(box.style, { width: '92%', maxWidth: '420px', background: '#071028', color: '#dff7ff', padding: '18px', borderRadius: '12px', textAlign: 'left' });

      box.innerHTML = `
        <div style="font-weight:800;font-size:18px;margin-bottom:8px">Edit Profile</div>
        <label style="display:block;margin-bottom:6px;color:#dff7ff">Name</label>
        <input id="editName" value="${existing.name || ''}" style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);margin-bottom:10px;background:#021024;color:#dff7ff" />
        <label style="display:block;margin-bottom:6px;color:#dff7ff">Age</label>
        <input id="editAge" type="number" value="${existing.age || ''}" min="5" max="12" style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);margin-bottom:10px;background:#021024;color:#dff7ff" />
        <div id="editError" style="color:#ffb8b8;margin-bottom:10px;display:none"></div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button id="saveEdit" style="padding:10px 12px;border-radius:8px;background:linear-gradient(90deg,var(--accent2),var(--accent1));border:none;color:#021024;font-weight:800">Save</button>
          <button id="cancelEdit" style="padding:10px 12px;border-radius:8px;background:#333;border:none;color:#cfeeff">Cancel</button>
        </div>
      `;

      modal.appendChild(box);
      document.body.appendChild(modal);

      document.getElementById('cancelEdit').addEventListener('click', () => modal.remove());

      document.getElementById('saveEdit').addEventListener('click', () => {
        const name = document.getElementById('editName').value.trim();
        const age = Number(document.getElementById('editAge').value);
        const errBox = document.getElementById('editError');
        if (!name) { errBox.textContent = 'Please enter name'; errBox.style.display = 'block'; return; }
        if (isNaN(age) || age < 5 || age > 12) { errBox.textContent = 'Age must be between 5 and 12'; errBox.style.display = 'block'; return; }

        const now = new Date().toISOString();
        localStorage.setItem('player_profile', JSON.stringify({ name, age, time: now }));
        const acct = JSON.parse(localStorage.getItem('user_account') || 'null') || {};
        acct.name = name; acct.age = age; acct.updatedAt = now;
        localStorage.setItem('user_account', JSON.stringify(acct));

        // Update UI
        document.getElementById('userId').textContent = name;
        document.getElementById('profileLetter').textContent = name.charAt(0).toUpperCase();
        modal.remove();
      });

      // Hide dropdown
      const dd2 = document.getElementById('profileDropdown'); if (dd2) dd2.classList.remove('show');
    }

    // Simple My Games modal: lists games and number of saved records per game
    function showMyGames() {
      const modal = document.createElement('div');
      Object.assign(modal.style, { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,20,0.9)', zIndex: 9999 });
      const box = document.createElement('div');
      Object.assign(box.style, { width: '92%', maxWidth: '640px', background: '#071028', color: '#dff7ff', padding: '18px', borderRadius: '12px', textAlign: 'left' });

      let html = '<div style="font-weight:800;font-size:18px;margin-bottom:8px">My Games</div>';
      html += '<div style="max-height:60vh;overflow:auto;padding-right:8px">';
      const gm = (typeof gameMap !== 'undefined' && Array.isArray(gameMap)) ? gameMap : (Array.isArray(window.gameMap) ? window.gameMap : []);
      if (!gm || gm.length === 0) html += '<div class="small">No games available</div>';
      else {
        gm.forEach(g => {
          const raw = localStorage.getItem(g.key);
          const count = raw ? (Array.isArray(JSON.parse(raw)) ? JSON.parse(raw).length : 1) : 0;
          html += `<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)"><strong>${prettyLabelFromFile(g.file)}</strong> — Records: ${count}</div>`;
        });
      }
      html += '</div>';
      html += '<div style="display:flex;justify-content:flex-end;margin-top:12px"><button id="closeMyGames" style="padding:8px 10px;border-radius:8px;background:#333;border:none;color:#cfeeff">Close</button></div>';

      box.innerHTML = html;
      modal.appendChild(box);
      document.body.appendChild(modal);

      document.getElementById('closeMyGames').addEventListener('click', () => modal.remove());

      // Hide dropdown
      const dd3 = document.getElementById('profileDropdown'); if (dd3) dd3.classList.remove('show');
    }

    function openSigninModal() {
      document.getElementById("signinModal").classList.add("active");
      document.getElementById("signinError").textContent = "";
    }

    function openLoginModal() {
      document.getElementById("loginModal").classList.add("active");
      document.getElementById("loginError").textContent = "";
    }

    function closeGameModal(modalId) {
      document.getElementById(modalId).classList.remove("active");
    }

    function submitSignin() {
      const name = document.getElementById("signinName").value.trim();
      const ageInput = document.getElementById("signinAge").value;
      const age = parseInt(ageInput);
      const error = document.getElementById("signinError");

      if (!name) {
        error.textContent = "Please enter your name";
        return;
      }

      if (!ageInput || isNaN(age) || age < 5 || age > 12) {
        error.textContent = "Oops! Age must be between 5 and 12";
        return;
      }

      // Save account
      localStorage.setItem("user_account", JSON.stringify({
        name,
        age,
        createdAt: new Date().toISOString()
      }));

      // Also save player profile for games
      localStorage.setItem("player_profile", JSON.stringify({
        name,
        age,
        time: new Date().toISOString()
      }));

      // Update UI
      document.getElementById("userId").textContent = name;
      document.getElementById("profileLetter").textContent = name.charAt(0).toUpperCase();
      document.getElementById("profileContainer").style.display = "block";
      document.getElementById("authButtons").style.display = "none";
      document.getElementById("logoutBtn").style.display = "none";

      // Close modal
      document.getElementById("signinModal").classList.remove("active");
      alert("Account created successfully!");
    }

    function submitLogin() {
      const name = document.getElementById("loginName").value.trim();
      const error = document.getElementById("loginError");

      const userAccount = localStorage.getItem("user_account");
      if (!userAccount) {
        error.textContent = "No account found. Please sign in first";
        return;
      }

      const account = JSON.parse(userAccount);
      if (account.name !== name) {
        error.textContent = "Name does not match";
        return;
      }

      // Update UI
      document.getElementById("userId").textContent = account.name;
      document.getElementById("authButtons").style.display = "none";
      document.getElementById("logoutBtn").style.display = "block";

      // Also save player profile for games
      localStorage.setItem("player_profile", JSON.stringify({
        name: account.name,
        age: account.age,
        time: new Date().toISOString()
      }));

      // Close modal
      document.getElementById("loginModal").classList.remove("active");
      alert("Logged in successfully!");
    }
      function playBubbleMathPop() {
    const profile = localStorage.getItem("player_profile");

    if (!profile) {
      openSignup(() => {
        document.getElementById("gameModal-bubble_math_pop").classList.add("active");
        startBubbleMathPop();
      });
    } else {
      document.getElementById("gameModal-bubble_math_pop").classList.add("active");
      startBubbleMathPop();
    }
  }
  