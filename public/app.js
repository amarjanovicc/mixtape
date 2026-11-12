(function () {
  "use strict";

  var DEFAULTS = {
    to: "",
    from: "",
    whatsapp: "",
    timeZone: "Europe/Zagreb",
    noteLead: "podsjetila me na tebe jer…",
  };
  var STORE = "pjesma-dana:v2";
  var GAMES = ["scratch", "tap", "hold"];
  var REACTIONS = ["🥹", "😍", "💃", "😂", "😭"];
  var WHEN = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?$/;

  var data = window.DAILY_SONG || {};
  var config = Object.assign({}, DEFAULTS, data.config || {});
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  function $(id) { return document.getElementById(id); }
  function pad(n) { return String(n).padStart(2, "0"); }

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text != null) node.textContent = text;
    return node;
  }

  // ---------- storage ----------

  function loadState() {
    var s = {};
    try { s = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) {}
    return {
      opened: s.opened && typeof s.opened === "object" ? s.opened : {},
      reactions: s.reactions && typeof s.reactions === "object" ? s.reactions : {},
      days: Array.isArray(s.days) ? s.days : [],
    };
  }
  function saveState() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }
  var state = loadState();

  // ---------- time ----------

  // "Zidni sat" u zadanoj zoni kao "YYYY-MM-DDTHH:MM:SS" — uspoređuje se kao tekst.
  function nowWall() {
    try {
      var parts = new Intl.DateTimeFormat("en-US", {
        timeZone: config.timeZone, hourCycle: "h23",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      }).formatToParts(new Date());
      var p = {};
      parts.forEach(function (x) { p[x.type] = x.value; });
      return p.year + "-" + p.month + "-" + p.day + "T" + p.hour + ":" + p.minute + ":" + p.second;
    } catch (e) {
      var d = new Date();
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
        "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    }
  }

  function normalizeWhen(s) {
    var m = WHEN.exec(typeof s === "string" ? s.trim() : "");
    if (!m) return null;
    var at = m[1] + "T" + (m[2] || "00:00");
    var d = new Date(at + ":00Z");
    if (isNaN(d.getTime()) || d.toISOString().slice(0, 16) !== at) return null;
    return at;
  }

  function formatDate(day, opts) {
    try {
      return new Intl.DateTimeFormat("hr-HR", Object.assign({ timeZone: "UTC" }, opts))
        .format(new Date(day + "T12:00:00Z"));
    } catch (e) {
      var p = day.split("-");
      return Number(p[2]) + ". " + Number(p[1]) + ".";
    }
  }

  function shiftDay(day, delta) {
    var d = new Date(day + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + delta);
    return d.toISOString().slice(0, 10);
  }

  // ---------- data ----------

  function loadSongs() {
    var seen = {};
    return (Array.isArray(data.songs) ? data.songs : []).map(function (s) {
      var at = s && s.title ? normalizeWhen(s.date) : null;
      if (!at || seen[at]) {
        console.warn("[mixtape] preskačem neispravan ili dupli unos:", s);
        return null;
      }
      seen[at] = true;
      return Object.assign({}, s, { at: at, day: at.slice(0, 10) });
    }).filter(Boolean).sort(function (a, b) { return a.at < b.at ? -1 : 1; });
  }

  // ---------- media ----------

  function spotifyEmbed(url) {
    var m = /open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode)\/([A-Za-z0-9]{10,})/.exec(url || "");
    if (!m) return null;
    return {
      src: "https://open.spotify.com/embed/" + m[1] + "/" + m[2] + "?utm_source=generator&theme=0",
      height: m[1] === "track" ? 152 : 352,
    };
  }

  function youtubeId(url) {
    var m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/.exec(url || "");
    return m ? m[1] : null;
  }

  function hueFor(text) {
    var h = 0;
    for (var i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    return h % 360;
  }

  // ---------- confetti ----------

  function confetti(originEl, count) {
    if (reducedMotion || !originEl) return;
    var r = originEl.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var glyphs = ["♥", "♪", "✦", "♫", "♥"];
    var colors = ["var(--accent)", "var(--accent-2)", "var(--cream)"];
    for (var i = 0; i < count; i++) {
      var b = el("span", { class: "bit", "aria-hidden": "true" }, glyphs[i % glyphs.length]);
      var angle = Math.random() * Math.PI * 2;
      var dist = 80 + Math.random() * 150;
      b.style.left = cx - 11 + "px";
      b.style.top = cy - 11 + "px";
      b.style.color = colors[i % colors.length];
      b.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      b.style.setProperty("--dy", Math.sin(angle) * dist - 60 + "px");
      b.style.setProperty("--rot", (Math.random() - 0.5) * 240 + "deg");
      b.style.animationDelay = Math.random() * 0.15 + "s";
      document.body.appendChild(b);
      b.addEventListener("animationend", function () { this.remove(); });
    }
  }

  function buzz(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
  }

  // ---------- render: song ----------

  function renderSong(song, trackNo, label) {
    document.documentElement.style.setProperty("--hue", hueFor(song.title + (song.artist || "")));
    document.title = "Mixtape 💌 #" + pad(trackNo);

    $("brand").textContent = config.to ? "mixtape za " + config.to : "mixtape za tebe";
    $("tape-line1").textContent = config.to ? "za " + config.to + " ♥" : "za tebe ♥";
    $("tape-line2").textContent = "pjesma #" + pad(trackNo) + " · " + formatDate(song.day, { day: "numeric", month: "long" });

    $("label").textContent = label;
    $("title").textContent = song.title;
    $("artist").textContent = song.artist || "";
    $("artist").hidden = !song.artist;

    var player = $("player");
    var sp = spotifyEmbed(song.spotify);
    var yt = youtubeId(song.youtube);
    if (sp) {
      player.appendChild(el("iframe", {
        src: sp.src, height: String(sp.height), title: "Spotify: " + song.title, loading: "lazy",
        allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
      }));
    } else if (yt) {
      player.appendChild(el("iframe", {
        src: "https://www.youtube-nocookie.com/embed/" + yt, class: "yt", title: "YouTube: " + song.title,
        allow: "autoplay; encrypted-media; fullscreen; picture-in-picture", allowfullscreen: "", loading: "lazy",
      }));
    }

    var q = encodeURIComponent([song.title, song.artist].filter(Boolean).join(" "));
    var links = $("links");
    links.appendChild(el("a", {
      class: "btn btn-primary", target: "_blank", rel: "noopener",
      href: song.spotify || "https://open.spotify.com/search/" + q,
    }, "▶ Spotify"));
    links.appendChild(el("a", {
      class: "btn btn-ghost", target: "_blank", rel: "noopener",
      href: song.youtube || "https://www.youtube.com/results?search_query=" + q,
    }, "YouTube"));

    if (song.note) {
      $("note-lead").textContent = config.noteLead;
      $("note").textContent = song.note;
      $("sign").textContent = config.from ? "— " + config.from : "";
      $("note-wrap").hidden = false;
    }
  }

  // ---------- render: reactions ----------

  function renderReactions(song) {
    var row = $("react-row");
    var tell = $("tell");

    function apply(emoji) {
      row.classList.add("chosen");
      Array.prototype.forEach.call(row.children, function (b) {
        b.setAttribute("aria-pressed", String(b.textContent === emoji));
      });
      if (song.ps) {
        $("ps").textContent = song.ps;
        $("ps").hidden = false;
      }
      var text = emoji + " " + song.title + (song.artist ? " — " + song.artist : "");
      var phone = String(config.whatsapp || "").replace(/\D/g, "");
      if (phone) {
        tell.href = "https://wa.me/" + phone + "?text=" + encodeURIComponent(text);
        tell.target = "_blank";
        tell.rel = "noopener";
        tell.hidden = false;
      } else if (navigator.share) {
        tell.onclick = function (e) {
          e.preventDefault();
          navigator.share({ text: text }).catch(function () {});
        };
        tell.hidden = false;
      }
    }

    REACTIONS.forEach(function (emoji) {
      var b = el("button", { type: "button", "aria-pressed": "false", "aria-label": "Reakcija " + emoji }, emoji);
      b.addEventListener("click", function () {
        state.reactions[song.at] = emoji;
        saveState();
        apply(emoji);
        confetti(b, 8);
        buzz(15);
        renderShelfReaction(song.at, emoji);
      });
      row.appendChild(b);
    });

    if (state.reactions[song.at]) apply(state.reactions[song.at]);
  }

  // ---------- render: countdown ----------

  function renderNext(nextSong, isLatest) {
    var out = $("next");
    if (!isLatest) return;
    out.hidden = false;
    if (!nextSong) {
      out.textContent = "nova pjesma stiže uskoro 💌";
      return;
    }
    var target = Date.parse(nextSong.at + ":00Z");
    out.textContent = "sljedeća pjesma za ";
    var b = el("b");
    out.appendChild(b);
    var timer = setInterval(tick, 1000);
    function tick() {
      var left = Math.floor((target - Date.parse(nowWall() + "Z")) / 1000);
      if (left <= 0) {
        clearInterval(timer);
        out.textContent = "nova pjesma je stigla ✨ ";
        out.appendChild(el("a", { href: "./" }, "otvori"));
        return;
      }
      var h = Math.floor(left / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
      b.textContent = (h >= 24 ? Math.floor(h / 24) + " d " : "") + pad(h % 24) + ":" + pad(m) + ":" + pad(s);
    }
    tick();
  }

  // ---------- render: shelf + streak ----------

  function renderShelf(released, current) {
    var list = $("shelf-list");
    released.slice().reverse().forEach(function (s) {
      var n = released.indexOf(s) + 1;
      var a = el("a", { href: s === released[released.length - 1] ? "./" : "?t=" + encodeURIComponent(s.at) });
      if (s === current) a.setAttribute("aria-current", "true");
      a.appendChild(el("span", { class: "n" }, pad(n)));
      var info = el("span", { class: "s" });
      info.appendChild(el("div", { class: "t" }, s.title));
      if (s.artist) info.appendChild(el("div", { class: "a" }, s.artist));
      a.appendChild(info);
      a.appendChild(el("span", { class: "r", "data-at": s.at }, state.reactions[s.at] || ""));
      a.appendChild(el("span", { class: "d" }, formatDate(s.day, { day: "numeric", month: "numeric" })));
      var li = el("li");
      li.appendChild(a);
      list.appendChild(li);
    });
    $("shelf-count").textContent = "· " + released.length;
  }

  function renderShelfReaction(at, emoji) {
    var cell = document.querySelector('.shelf .r[data-at="' + at + '"]');
    if (cell) cell.textContent = emoji;
  }

  function touchStreak(today) {
    if (state.days.indexOf(today) === -1) {
      state.days.push(today);
      state.days = state.days.sort().slice(-400);
      saveState();
    }
    var n = 0;
    var d = today;
    while (state.days.indexOf(d) !== -1) { n++; d = shiftDay(d, -1); }
    if (n >= 2) {
      $("streak").textContent = "🔥 " + n + " dana zaredom";
      $("streak").hidden = false;
    }
  }

  // ---------- games ----------

  function startGame(type, song, onDone) {
    var game = $("game");
    var text = $("game-text");
    var tape = $("tape");
    var finished = false;
    var cleanup = function () {};

    function finish() {
      if (finished) return;
      finished = true;
      cleanup();
      game.hidden = true;
      onDone();
    }

    if (song.hint) {
      $("hint").textContent = "trag: " + song.hint;
      $("hint").hidden = false;
    }
    game.hidden = false;
    $("skip").addEventListener("click", finish);

    if (type === "tap") {
      var veil = $("veil");
      var pump = $("pump");
      var need = 7, count = 0;
      veil.hidden = false;
      pump.hidden = false;
      text.textContent = "napuni srce — tapni " + need + " puta";
      pump.addEventListener("click", function () {
        if (finished) return;
        count++;
        pump.style.setProperty("--p", count / need);
        pump.classList.remove("bump");
        void pump.offsetWidth;
        pump.classList.add("bump");
        buzz(10);
        confetti(pump, 3);
        if (count >= need) finish();
        else text.textContent = "još " + (need - count) + "…";
      });
      cleanup = function () { veil.classList.add("gone"); };
      return;
    }

    if (type === "hold") {
      var veil2 = $("veil");
      var hold = $("hold");
      var p = 0, down = false, captured = false, last = 0, raf = 0;
      veil2.hidden = false;
      hold.hidden = false;
      text.textContent = "drži gumb da premotaš kasetu";
      // mjeri stvarno proteklo vrijeme (setInterval, ne rAF) da radi i kad preglednik štedi frameove
      var step = function () {
        var t = Date.now();
        var dt = last ? t - last : 0;
        last = t;
        p = Math.max(0, Math.min(1, p + (down ? dt / 1800 : -dt / 900)));
        hold.style.setProperty("--p", p);
        if (p >= 1) { finish(); return; }
        if (!down && p <= 0) { clearInterval(raf); raf = 0; last = 0; }
      };
      var press = function (e) {
        e.preventDefault();
        if (finished) return;
        down = true;
        captured = false;
        // uhvati pokazivač da mali pomak prsta ne prekine držanje
        try { if (e.pointerId != null) { hold.setPointerCapture(e.pointerId); captured = true; } } catch (err) {}
        tape.classList.add("fast");
        buzz(10);
        if (!raf) { last = Date.now(); raf = setInterval(step, 30); }
      };
      var release = function () {
        down = false;
        tape.classList.remove("fast");
      };
      hold.addEventListener("pointerdown", press);
      hold.addEventListener("pointerup", release);
      hold.addEventListener("pointercancel", release);
      hold.addEventListener("lostpointercapture", release);
      hold.addEventListener("pointerleave", function () { if (!captured) release(); });
      hold.addEventListener("contextmenu", function (e) { e.preventDefault(); });
      hold.addEventListener("keydown", function (e) { if ((e.key === " " || e.key === "Enter") && !e.repeat) press(e); });
      hold.addEventListener("keyup", release);
      cleanup = function () {
        clearInterval(raf);
        tape.classList.remove("fast");
        veil2.classList.add("gone");
      };
      return;
    }

    // scratch
    var canvas = $("scratch");
    var ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) { $("veil").hidden = false; cleanup = function () { $("veil").classList.add("gone"); }; text.textContent = "dodirni „samo otvori”"; return; }
    canvas.hidden = false;
    text.textContent = "ogrebi karticu prstom";

    var box = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = canvas.width = Math.max(1, Math.round(box.width * dpr));
    var H = canvas.height = Math.max(1, Math.round(box.height * dpr));
    var cs = getComputedStyle(document.documentElement);
    var hue = cs.getPropertyValue("--hue").trim() || "335";
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "hsl(" + hue + " 95% 70%)");
    g.addColorStop(1, "hsl(" + ((Number(hue) + 45) % 360) + " 95% 68%)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (var i = 0; i < 70; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, (1 + Math.random() * 2.5) * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#2a1830";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 " + 30 * dpr + "px Caveat, cursive";
    ctx.fillText("ogrebi me ✨", W / 2, H / 2);

    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 46 * dpr;

    var drawing = false, px = 0, py = 0, moves = 0;
    function pos(e) {
      var r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
    }
    function cleared() {
      try {
        var d = ctx.getImageData(0, 0, W, H).data;
        var clear = 0, total = 0;
        for (var k = 3; k < d.length; k += 4 * 24) { total++; if (d[k] < 40) clear++; }
        return clear / total;
      } catch (e) { return 1; }
    }
    function check() { if (cleared() > 0.45) finish(); }

    canvas.addEventListener("pointerdown", function (e) {
      drawing = true;
      var p0 = pos(e);
      px = p0[0]; py = p0[1];
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      ctx.beginPath();
      ctx.arc(px, py, 23 * dpr, 0, Math.PI * 2);
      ctx.fill();
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!drawing) return;
      var p1 = pos(e);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(p1[0], p1[1]);
      ctx.stroke();
      px = p1[0]; py = p1[1];
      if (++moves % 10 === 0) check();
    });
    var stop = function () { if (drawing) { drawing = false; check(); } };
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);
    cleanup = function () { canvas.classList.add("gone"); };
  }

  // ---------- main ----------

  function main() {
    var songs = loadSongs();
    var now = nowWall();
    var today = now.slice(0, 10);
    var released = songs.filter(function (s) { return s.at <= now.slice(0, 16); });
    var upcoming = songs.filter(function (s) { return s.at > now.slice(0, 16); });

    if (!released.length) {
      $("brand").textContent = config.to ? "mixtape za " + config.to : "mixtape za tebe";
      $("empty").hidden = false;
      return;
    }

    var latest = released[released.length - 1];
    var wanted = new URLSearchParams(location.search).get("t");
    var current = released.find(function (s) { return s.at === wanted; }) || latest;
    var isLatest = current === latest;
    var trackNo = released.indexOf(current) + 1;
    var label = !isLatest ? "Iz arhive" : current.day === today ? "Pjesma dana" : "Zadnja pjesma";

    renderSong(current, trackNo, label);
    renderReactions(current);
    renderShelf(released, current);
    touchStreak(today);
    $("back").hidden = isLatest;
    $("stage").hidden = false;

    function showAfter(celebrate) {
      $("tape").classList.add("playing");
      $("after").hidden = false;
      $("shelf").hidden = released.length < 2; // tek nakon otkrivanja, da popis ne oda pjesmu
      renderNext(upcoming[0], isLatest);
      if (celebrate) {
        confetti($("reveal"), 26);
        buzz([20, 40, 30]);
      }
    }

    // ?igra=scratch|tap|hold — ponovno odigraj otkrivanje (za isprobavanje)
    var forced = new URLSearchParams(location.search).get("igra");
    if (GAMES.indexOf(forced) === -1) forced = null;

    if (!forced && (!isLatest || state.opened[current.at])) {
      showAfter(false);
      return;
    }

    var type = forced || (GAMES.indexOf(current.reveal) !== -1 ? current.reveal : GAMES[(trackNo - 1) % GAMES.length]);
    startGame(type, current, function () {
      state.opened[current.at] = Date.now();
      saveState();
      showAfter(true);
    });
  }

  try {
    main();
  } catch (err) {
    console.error(err);
    ["stage", "after", "shelf"].forEach(function (id) { if ($(id)) $(id).hidden = true; });
    if ($("empty")) {
      $("empty-title").textContent = "Ups, nešto je zapelo";
      $("empty-text").textContent = "osvježi stranicu za koji tren 💗";
      $("empty").hidden = false;
    }
  }
})();
