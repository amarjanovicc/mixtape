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
  var GAMES = ["scratch", "tap", "hold", "guess"];
  var REACTIONS = [
    { id: "love", icon: "heart", label: "Obožavam" },
    { id: "fire", icon: "flame", label: "Vatra" },
    { id: "dance", icon: "music", label: "Pleše mi se" },
    { id: "laugh", icon: "smile", label: "Nasmijala me" },
    { id: "cry", icon: "tear", label: "Rasplakala me" },
  ];
  var SVG_NS = "http://www.w3.org/2000/svg";
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

  // Na stranici nema emojija ni znakova: sve su SVG ikone iz <defs> u index.html.
  function icon(name) {
    var svg = document.createElementNS(SVG_NS, "svg");
    var use = document.createElementNS(SVG_NS, "use");
    svg.setAttribute("class", "icon");
    svg.setAttribute("aria-hidden", "true");
    use.setAttribute("href", "#i-" + name);
    svg.appendChild(use);
    return svg;
  }
  // setContent(el, "tekst", icon("heart"), ...) — zamijeni sadržaj tekstom i ikonama
  function setContent(node) {
    node.textContent = "";
    for (var i = 1; i < arguments.length; i++) {
      var part = arguments[i];
      node.appendChild(typeof part === "string" ? document.createTextNode(part) : part);
    }
  }
  // 1 dan, 2 dana, 21 dan
  function days(n) { return n + (n % 10 === 1 && n % 100 !== 11 ? " dan" : " dana"); }
  function reactionById(id) {
    for (var i = 0; i < REACTIONS.length; i++) if (REACTIONS[i].id === id) return REACTIONS[i];
    return null;
  }

  // ---------- storage ----------

  function loadState() {
    var s = {};
    try { s = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) {}
    return {
      opened: s.opened && typeof s.opened === "object" ? s.opened : {},
      reactions: s.reactions && typeof s.reactions === "object" ? s.reactions : {},
      days: Array.isArray(s.days) ? s.days : [],
      muted: s.muted === true,
      collected: s.collected && typeof s.collected === "object" ? s.collected : {},
      best: Number(s.best) || 0,
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
      src: "https://open.spotify.com/embed/" + m[1] + "/" + m[2] + "?utm_source=generator",
      height: m[1] === "track" ? 152 : 352,
    };
  }

  function youtubeId(url) {
    var m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/.exec(url || "");
    return m ? m[1] : null;
  }

  // Jedna ravna boja po pjesmi, iz male palete tiskarskih boja (uvijek ista za istu pjesmu).
  var INKS = ["#ef6a4c", "#f0b429", "#43b6a3", "#6f9fe0", "#f08aa5", "#86c267"];
  var STICKERS = ["heart", "star", "music", "sparkle", "flame"];
  // Svaka kaseta je drugačija, ali uvijek ista za istu pjesmu: boja, uzorak naljepnice,
  // oblik prozorčića, naljepnica i nagib izvode se iz njenog datuma i naslova.
  function designFor(song) {
    var text = song.at + song.title;
    var h = 0;
    for (var i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    return {
      color: INKS[h % INKS.length],
      pattern: (h >>> 3) % 4,
      window: (h >>> 5) % 2,
      sticker: STICKERS[(h >>> 7) % STICKERS.length],
      tilt: ((h >>> 11) % 7) - 3,
    };
  }

  // ---------- confetti ----------

  function confetti(originEl, count) {
    if (reducedMotion || !originEl) return;
    var r = originEl.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var glyphs = ["heart", "music", "sparkle", "music", "heart"];
    var colors = ["var(--accent)", "var(--ink)", "var(--accent)"];
    for (var i = 0; i < count; i++) {
      var b = el("span", { class: "bit", "aria-hidden": "true" });
      b.appendChild(icon(glyphs[i % glyphs.length]));
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
    var look = designFor(song);
    document.documentElement.style.setProperty("--accent", look.color);
    $("tape").classList.add("w" + look.window);
    document.querySelector(".tape-label").classList.add("p" + look.pattern);
    setContent($("tape-sticker"), icon(look.sticker));
    document.title = "Mixtape #" + pad(trackNo);

    $("brand").textContent = config.to ? "mixtape za " + config.to : "mixtape za tebe";
    setContent($("tape-line1"), config.to ? "za " + config.to : "za tebe", icon("heart"));
    $("tape-line2").textContent = "pjesma #" + pad(trackNo) + " · " + formatDate(song.day, { day: "numeric", month: "long" });

    $("label").textContent = label;
    $("title").textContent = song.title;
    $("artist").textContent = song.artist || "";
    $("artist").hidden = !song.artist;
    if (song.cover) {
      $("cover").src = song.cover;
      $("cover").hidden = false;
      $("cover").addEventListener("error", function () { this.hidden = true; });
    }

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
    var spotifyBtn = el("a", {
      class: "btn btn-primary", target: "_blank", rel: "noopener",
      href: song.spotify || "https://open.spotify.com/search/" + q,
    });
    setContent(spotifyBtn, icon("play"), "Spotify");
    links.appendChild(spotifyBtn);
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

    function apply(id) {
      var r = reactionById(id);
      if (!r) return; // stara ili nepoznata vrijednost
      row.classList.add("chosen");
      Array.prototype.forEach.call(row.children, function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-id") === id));
      });
      if (song.ps) {
        $("ps").textContent = song.ps;
        $("ps").hidden = false;
      }
      var text = r.label + ": " + song.title + (song.artist ? " — " + song.artist : "");
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

    REACTIONS.forEach(function (r) {
      var b = el("button", { type: "button", "aria-pressed": "false", "aria-label": r.label, title: r.label, "data-id": r.id });
      b.appendChild(icon(r.icon));
      b.addEventListener("click", function () {
        state.reactions[song.at] = r.id;
        saveState();
        apply(r.id);
        confetti(b, 8);
        buzz(15);
        refreshBox();
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
      out.textContent = "nova pjesma stiže uskoro";
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
        out.textContent = "nova pjesma je stigla — ";
        out.appendChild(el("a", { href: "./" }, "otvori"));
        return;
      }
      var h = Math.floor(left / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
      b.textContent = (h >= 24 ? Math.floor(h / 24) + " d " : "") + pad(h % 24) + ":" + pad(m) + ":" + pad(s);
    }
    tick();
  }

  // ---------- render: kutija, nagrade, niz ----------

  var refreshBox = function () {};   // postavlja main(); poziva se kad se nešto promijeni

  function miniTape(song, n, isCurrent, href) {
    var look = designFor(song);
    var a = el("a", { class: "mini p" + look.pattern + " w" + look.window, href: href });
    a.style.setProperty("--c", look.color);
    a.style.setProperty("--tilt", look.tilt * 0.6 + "deg");
    if (isCurrent) a.setAttribute("aria-current", "true");
    var label = el("span", { class: "mini-label" });
    label.appendChild(el("b", null, song.title));
    label.appendChild(el("span", null, "#" + pad(n) + (song.artist ? " · " + song.artist : "")));
    a.appendChild(label);
    var win = el("span", { class: "mini-win" });
    win.appendChild(el("i"));
    win.appendChild(el("i"));
    a.appendChild(win);
    var st = el("span", { class: "sticker" });
    st.appendChild(icon(look.sticker));
    a.appendChild(st);
    var rx = reactionById(state.reactions[song.at]);
    if (rx) {
      var badge = el("span", { class: "rx", title: rx.label });
      badge.appendChild(icon(rx.icon));
      a.appendChild(badge);
    }
    return a;
  }

  function slot(n, text, iconName, href) {
    var a = el("a", { class: "slot", href: href });
    a.appendChild(icon(iconName));
    a.appendChild(el("b", null, "#" + pad(n)));
    a.appendChild(el("span", null, text));
    return a;
  }

  // Kutija: spremljene kasete kao male kasete, ostalo kao prazna mjesta.
  // Naslov neotvorene pjesme ne smije se vidjeti ni ovdje.
  function renderBox(released, current) {
    var grid = $("box-grid");
    var latest = released[released.length - 1];
    var have = 0;
    grid.textContent = "";
    released.slice().reverse().forEach(function (s) {
      var n = released.indexOf(s) + 1;
      var href = s === latest ? "./" : "?t=" + encodeURIComponent(s.at);
      var opened = Boolean(state.opened[s.at]);
      if (state.collected[s.at]) {
        have++;
        grid.appendChild(miniTape(s, n, s === current, href));
      } else if (s === latest && !opened) {
        grid.appendChild(slot(n, "čeka te danas", "lock", href));
      } else {
        grid.appendChild(slot(n, opened ? "nije spremljena" : "propuštena", "cassette", href));
      }
    });
    $("box-count").textContent = have + "/" + released.length;
    $("box-tip").textContent = have === released.length
      ? "Sve su na broju. Dodirni kasetu da je opet poslušaš."
      : "Prazna mjesta čekaju: otvori pjesmu pa je spremi u kutiju.";
    var missing = released.length - have;
    $("box-badge").textContent = String(have);
    $("box-badge").hidden = !have;
    return missing;
  }

  // Nagrade za niz: kuponi koji se otključaju nakon N dana zaredom (najbolji niz se pamti).
  function renderRewards(streak) {
    var rewards = (Array.isArray(config.rewards) ? config.rewards : []).filter(function (r) {
      return r && Number(r.days) > 0 && r.text;
    }).sort(function (a, b) { return a.days - b.days; });
    if (!rewards.length) return;
    var list = $("reward-list");
    list.textContent = "";
    $("reward-streak").textContent = "Tvoj niz: " + days(streak) +
      (state.best > streak ? " (najdulji: " + days(state.best) + ")" : "") + ".";
    rewards.forEach(function (r) {
      var open = state.best >= r.days;
      var c = el("div", { class: "coupon " + (open ? "open" : "locked") });
      c.appendChild(icon(open ? "gift" : "lock"));
      c.appendChild(el("b", null, days(r.days) + " zaredom"));
      c.appendChild(el("p", null, open ? r.text : "Još " + days(r.days - state.best) + " do iznenađenja."));
      list.appendChild(c);
    });
    $("rewards").hidden = false;
  }

  // ---------- pogledi: Danas / Kutija ----------

  var VIEWS = ["today", "box"];
  var currentView = "today";
  function showView(name, animate) {
    if (VIEWS.indexOf(name) === -1 || name === currentView) return;
    var dir = VIEWS.indexOf(name) > VIEWS.indexOf(currentView) ? "enter-right" : "enter-left";
    currentView = name;
    VIEWS.forEach(function (v) {
      var node = $("view-" + v);
      node.hidden = v !== name;
      node.classList.remove("enter-left", "enter-right");
      if (v === name && animate !== false && !reducedMotion) node.classList.add(dir);
    });
    Array.prototype.forEach.call($("tabs").querySelectorAll("button"), function (b) {
      b.setAttribute("aria-current", String(b.getAttribute("data-view") === name));
    });
    window.scrollTo(0, 0);
  }

  function initViews() {
    var tabs = $("tabs");
    tabs.hidden = false;
    tabs.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (b) { fx.click(); showView(b.getAttribute("data-view")); }
    });
    // povlačenje prstom lijevo/desno mijenja pogled (osim preko kasete, srećke i tipki)
    var sx = 0, sy = 0, ok = false;
    document.addEventListener("touchstart", function (e) {
      var t = e.touches[0];
      sx = t.clientX; sy = t.clientY;
      ok = e.touches.length === 1 && !e.target.closest(".tape, .scratch, .deck, .game, .tabs, iframe");
    }, { passive: true });
    document.addEventListener("touchend", function (e) {
      if (!ok) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < 70 || Math.abs(dy) > 50) return;
      showView(dx < 0 ? "box" : "today");
    }, { passive: true });
  }

  function touchStreak(today) {
    if (state.days.indexOf(today) === -1) {
      state.days.push(today);
      state.days = state.days.sort().slice(-400);
    }
    var n = 0;
    var d = today;
    while (state.days.indexOf(d) !== -1) { n++; d = shiftDay(d, -1); }
    if (n > state.best) state.best = n;
    saveState();
    if (n >= 2) {
      setContent($("streak"), icon("flame"), days(n) + " zaredom");
      $("streak").hidden = false;
    }
    return n;
  }

  // ---------- fx: zvučni efekti (Web Audio, bez datoteka) ----------
  //
  // Premotavanje: isječak se dekodira i pušta ubrzano UNAZAD/unaprijed, kao kad se
  // vrpca ili ploča povuče rukom. Ako se zvuk ne može dekodirati, ostaje šum motora.

  var fx = (function () {
    var AC = window.AudioContext || window.webkitAudioContext;
    var ctx = null, master = null, noiseBuf = null;
    var raw = null, buf = null, rev = null;       // preuzeti bajtovi -> dekodirano -> obrnuto
    var scrubSrc = null, scrubGain = null, scrubDir = 0;
    var whirr = null, scr = null, scrTimer = 0;
    var loadState = "none";   // none | loading | ready | failed
    var waiters = [], clip = null;
    function settle(st) {
      loadState = st;
      var w = waiters;
      waiters = [];
      w.forEach(function (cb) { cb(st === "ready"); });
    }

    function ready() {
      if (!AC) return false;
      if (!ctx) {
        try {
          ctx = new AC();
          master = ctx.createGain();
          master.gain.value = state.muted ? 0 : 1;
          master.connect(ctx.destination);
          var n = ctx.sampleRate * 2;
          noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
          var d = noiseBuf.getChannelData(0);
          for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        } catch (e) { ctx = null; return false; }
        decode();
      }
      if (ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
      return true;
    }

    function decode() {
      if (!ctx || !raw || buf) return;
      var bytes = raw;
      raw = null;
      try {
        ctx.decodeAudioData(bytes, function (b) {
          buf = b;
          rev = ctx.createBuffer(b.numberOfChannels, b.length, b.sampleRate);
          for (var c = 0; c < b.numberOfChannels; c++) {
            var data = new Float32Array(b.getChannelData(c));
            data.reverse();
            rev.getChannelData(c).set(data);
          }
          settle("ready");
        }, function () { settle("failed"); });
      } catch (e) { settle("failed"); }
    }

    function noise() {
      var src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      return src;
    }

    function tone(freq, at, dur, type, vol) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(vol || 0.2, at + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g); g.connect(master);
      o.start(at); o.stop(at + dur + 0.05);
    }

    function setWhirr(on, loud) {
      if (!ready()) return;
      if (on && !whirr) {
        var src = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        var lfo = ctx.createOscillator(), lg = ctx.createGain();
        f.type = "bandpass"; f.frequency.value = 1500; f.Q.value = 1.4;
        lfo.frequency.value = 11; lg.gain.value = 260;      // lagano "zavijanje" motora
        lfo.connect(lg); lg.connect(f.frequency);
        g.gain.value = 0;
        src.connect(f); f.connect(g); g.connect(master);
        src.start(); lfo.start();
        whirr = { src: src, lfo: lfo, g: g };
      }
      if (!whirr) return;
      whirr.g.gain.setTargetAtTime(on ? (loud ? 0.2 : 0.06) : 0, ctx.currentTime, 0.04);
      if (!on) {
        var w = whirr;
        whirr = null;
        setTimeout(function () { try { w.src.stop(); w.lfo.stop(); } catch (e) {} }, 350);
      }
    }

    function dropScrub() {
      if (!scrubSrc) return;
      var src = scrubSrc, g = scrubGain;
      scrubSrc = null; scrubGain = null; scrubDir = 0;
      try { g.gain.setTargetAtTime(0, ctx.currentTime, 0.02); } catch (e) {}
      setTimeout(function () { try { src.stop(); } catch (e) {} }, 120);
    }

    return {
      // preuzmi zvuk za premotavanje (mali isječci; cijele pjesme bi pojele memoriju mobitela)
      load: function (url) {
        if (!AC || !window.fetch) return;
        loadState = "loading";
        fetch(url).then(function (r) {
          if (!r.ok) throw new Error("fetch");
          return r.arrayBuffer();
        }).then(function (ab) {
          if (ab.byteLength > 3 * 1024 * 1024) { settle("failed"); return; }
          raw = ab;
          decode();
        }).catch(function () { settle("failed"); });
      },
      unlock: ready,
      // javi kad je zvuk spreman za puštanje unazad (ili da neće biti)
      onBuffer: function (cb) {
        ready();
        if (buf) return cb(true);
        if (loadState !== "loading") return cb(false);
        var done = false;
        var once = function (ok) { if (!done) { done = true; cb(ok); } };
        waiters.push(once);
        setTimeout(function () { once(false); }, 7000);
      },
      // pusti nekoliko sekundi pjesme unatrag, normalnom brzinom (igra "pogodi unazad")
      reverseClip: function (seconds, onEnd) {
        if (!ready() || !rev) return false;
        if (clip) { try { clip.onended = null; clip.stop(); } catch (e) {} }
        var src = ctx.createBufferSource(), g = ctx.createGain();
        src.buffer = rev;
        g.gain.value = 0.95;
        src.connect(g); g.connect(master);
        var off = Math.max(0, Math.min(rev.duration - seconds, rev.duration * 0.35));
        src.onended = function () { if (clip === src) clip = null; if (onEnd) onEnd(); };
        src.start(0, off, seconds);
        clip = src;
        return true;
      },
      stopClip: function () {
        if (!clip) return;
        try { clip.onended = null; clip.stop(); } catch (e) {}
        clip = null;
      },
      setMuted: function (m) { if (master) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.02); },

      // dir: -1 unazad, +1 unaprijed; rate: koliko puta brže; pos: sekunda u pjesmi
      scrub: function (dir, rate, pos) {
        if (!ready()) return;
        if (!buf) { setWhirr(true, true); return; }
        rate = Math.max(0.05, Math.min(14, rate));
        if (!scrubSrc || dir !== scrubDir) {
          dropScrub();
          scrubSrc = ctx.createBufferSource();
          scrubSrc.buffer = dir > 0 ? buf : rev;
          scrubGain = ctx.createGain();
          scrubGain.gain.value = 0;
          scrubSrc.connect(scrubGain); scrubGain.connect(master);
          var off = Math.max(0, Math.min(buf.duration - 0.02, dir > 0 ? pos : buf.duration - pos));
          scrubSrc.playbackRate.value = rate;
          scrubSrc.start(0, off);
          scrubDir = dir;
        }
        scrubSrc.playbackRate.setTargetAtTime(rate, ctx.currentTime, 0.03);
        scrubGain.gain.setTargetAtTime(0.9, ctx.currentTime, 0.015);
        setWhirr(true, false);
      },
      // prst miruje na kaseti: zvuk stane, kao ploča pod rukom
      hush: function () {
        if (scrubSrc) {
          scrubGain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
          scrubSrc.playbackRate.setTargetAtTime(0.05, ctx.currentTime, 0.03);
        }
        if (whirr) whirr.g.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
      },
      stopScrub: function () { dropScrub(); setWhirr(false); },
      whirr: function (on) { setWhirr(on, true); },

      // tipka kazetofona
      click: function () {
        if (!ready()) return;
        var src = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime;
        f.type = "highpass"; f.frequency.value = 1800;
        g.gain.setValueAtTime(0.35, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        src.connect(f); f.connect(g); g.connect(master);
        src.start(t); src.stop(t + 0.07);
        tone(140, t, 0.06, "square", 0.08);
      },

      // grebanje folije: šum čija glasnoća prati brzinu prsta
      scratch: function (speed) {
        if (!ready()) return;
        if (!scr) {
          var src = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
          f.type = "bandpass"; f.frequency.value = 3200; f.Q.value = 0.7;
          g.gain.value = 0;
          src.connect(f); f.connect(g); g.connect(master);
          src.start();
          scr = { src: src, f: f, g: g };
        }
        var v = Math.min(1, speed / 1.6);                    // px/ms -> 0..1
        scr.g.gain.setTargetAtTime(0.05 + v * 0.3, ctx.currentTime, 0.012);
        scr.f.frequency.setTargetAtTime(2400 + v * 3200, ctx.currentTime, 0.02);
        clearTimeout(scrTimer);
        scrTimer = setTimeout(function () { if (scr) scr.g.gain.setTargetAtTime(0, ctx.currentTime, 0.03); }, 60);
      },
      scratchEnd: function () {
        clearTimeout(scrTimer);
        if (!scr) return;
        var x = scr;
        scr = null;
        x.g.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
        setTimeout(function () { try { x.src.stop(); } catch (e) {} }, 250);
      },

      // dobitak: zvon novčića + uzlazni akord
      win: function () {
        if (!ready()) return;
        var t = ctx.currentTime + 0.02;
        tone(1976, t, 0.09, "square", 0.1);
        tone(2637, t + 0.07, 0.5, "square", 0.1);
        [1047, 1319, 1568, 2093].forEach(function (f, i) { tone(f, t + 0.22 + i * 0.085, 0.5, "triangle", 0.18); });
        tone(3136, t + 0.6, 0.9, "sine", 0.1);
      },
      // tap po srcu: svaki malo viši
      blip: function (step) {
        if (!ready()) return;
        tone(392 * Math.pow(2, step / 12 * 2), ctx.currentTime, 0.16, "triangle", 0.22);
      },
      // otkrivanje u ostalim igrama
      reveal: function () {
        if (!ready()) return;
        var t = ctx.currentTime + 0.02;
        [784, 1047, 1319].forEach(function (f, i) { tone(f, t + i * 0.08, 0.45, "triangle", 0.18); });
      },
    };
  })();

  // ---------- deck: zvuk + kaseta koja se stvarno premotava ----------

  var deck = (function () {
    var tape, audio, spoolL, spoolR, playBtn, timeEl, barFill;
    var hasAudio = false;
    var virtualPlaying = false; // bez zvuka: kolutovi se samo vrte
    var angle = 0;              // kut kolutova u stupnjevima
    var boost = 0;              // igra "drži gumb" ubrzava vrtnju
    var seekDir = 0;            // -1 premotavanje unazad, +1 unaprijed
    var resumeAfterSeek = false;
    var dragging = false, dragX = 0, dragT = 0, hushTimer = 0;
    var last = 0;
    var SEEK_RATE = 7;          // sekundi pjesme po sekundi držanja tipke

    function fmt(t) {
      t = Math.max(0, Math.floor(t || 0));
      return Math.floor(t / 60) + ":" + pad(t % 60);
    }
    function duration() { return hasAudio && isFinite(audio.duration) ? audio.duration : 0; }
    function isPlaying() { return hasAudio ? !audio.paused : virtualPlaying; }

    function seekBy(sec) {
      var d = duration();
      if (!d) return;
      try { audio.currentTime = Math.max(0, Math.min(d - 0.05, audio.currentTime + sec)); } catch (e) {}
    }

    function paint() {
      tape.style.setProperty("--a", angle.toFixed(1) + "deg");
      var d = duration();
      var f = d ? audio.currentTime / d : 0.5;
      spoolL.style.setProperty("--fill", (1 - f).toFixed(3)); // lijevi kolut se prazni
      spoolR.style.setProperty("--fill", f.toFixed(3));       // desni se puni
      if (hasAudio) {
        timeEl.textContent = fmt(audio.currentTime) + (d ? " / " + fmt(d) : "");
        barFill.style.transform = "scaleX(" + (d ? f : 0).toFixed(4) + ")";
      }
    }

    function syncButton() {
      var on = isPlaying();
      setContent(playBtn, icon(on ? "pause" : "play"));
      playBtn.setAttribute("aria-label", on ? "Pauza" : "Pusti");
    }

    function loop(t) {
      var dt = last ? Math.min((t - last) / 1000, 0.1) : 0;
      last = t;
      var rate = seekDir ? seekDir * 9 : boost ? 8 * boost : (isPlaying() && !dragging ? 1 : 0);
      if (rate && !reducedMotion) angle += rate * 150 * dt;
      if (seekDir) {
        seekBy(seekDir * SEEK_RATE * dt);
        var d = duration();
        // došli smo do kraja vrpce: zvuk premotavanja stane
        if (d && (seekDir < 0 ? audio.currentTime <= 0.05 : audio.currentTime >= d - 0.1)) fx.hush();
      }
      if (rate || dragging) paint();
      requestAnimationFrame(loop);
    }

    function play() {
      if (!hasAudio) { virtualPlaying = true; return; }
      var pr = audio.play();
      if (pr && pr.catch) pr.catch(function () { syncButton(); }); // preglednik traži dodir: ostaje gumb za puštanje
    }

    function holdSeek(btn, dir) {
      var start = function (e) {
        e.preventDefault();
        if (seekDir) return;
        seekDir = dir;
        resumeAfterSeek = hasAudio && !audio.paused;
        if (hasAudio) audio.pause();
        btn.classList.add("on");
        buzz(8);
        fx.click();
        fx.scrub(dir, SEEK_RATE, hasAudio ? audio.currentTime : 0);
        try { if (e.pointerId != null) btn.setPointerCapture(e.pointerId); } catch (err) {}
      };
      var stop = function () {
        if (seekDir !== dir) return;
        seekDir = 0;
        btn.classList.remove("on");
        fx.stopScrub();
        fx.click();
        if (resumeAfterSeek) play();
      };
      btn.addEventListener("pointerdown", start);
      btn.addEventListener("pointerup", stop);
      btn.addEventListener("pointercancel", stop);
      btn.addEventListener("lostpointercapture", stop);
      btn.addEventListener("contextmenu", function (e) { e.preventDefault(); });
      btn.addEventListener("keydown", function (e) { if ((e.key === " " || e.key === "Enter") && !e.repeat) start(e); });
      btn.addEventListener("keyup", stop);
    }

    function initDrag() {
      tape.classList.add("live");
      tape.addEventListener("pointerdown", function (e) {
        dragging = true;
        dragX = e.clientX;
        dragT = performance.now();
        fx.unlock();
        tape.classList.remove("nudge");
        resumeAfterSeek = !audio.paused;
        audio.pause();
        try { tape.setPointerCapture(e.pointerId); } catch (err) {}
      });
      tape.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - dragX;
        if (!dx) return;
        var now = performance.now();
        var dt = Math.max(8, now - dragT) / 1000;
        dragX = e.clientX;
        dragT = now;
        angle += dx * 5;          // povlačenje ulijevo vrti kolutove unazad
        var sec = dx * 0.07;
        // zvuk prati ruku: smjer i brzina povlačenja = smjer i brzina reprodukcije
        fx.scrub(dx < 0 ? -1 : 1, Math.abs(sec) / dt, audio.currentTime);
        seekBy(sec);
        clearTimeout(hushTimer);
        hushTimer = setTimeout(fx.hush, 90);
      });
      var end = function () {
        if (!dragging) return;
        dragging = false;
        clearTimeout(hushTimer);
        fx.stopScrub();
        if (resumeAfterSeek) play();
      };
      tape.addEventListener("pointerup", end);
      tape.addEventListener("pointercancel", end);
    }

    return {
      init: function (song) {
        tape = $("tape"); audio = $("audio"); spoolL = $("spool-l"); spoolR = $("spool-r");
        playBtn = $("play"); timeEl = $("time"); barFill = $("bar-fill");
        var src = song.audio || song.preview;
        if (src) {
          hasAudio = true;
          audio.preload = "metadata";
          audio.src = src;
          audio.muted = state.muted;
          fx.load(src);
          ["play", "pause", "ended"].forEach(function (ev) { audio.addEventListener(ev, syncButton); });
          ["loadedmetadata", "timeupdate", "seeked"].forEach(function (ev) { audio.addEventListener(ev, paint); });
          audio.addEventListener("error", function () { $("deck").hidden = true; hasAudio = false; virtualPlaying = true; });
          playBtn.addEventListener("click", function () { fx.click(); if (audio.paused) play(); else audio.pause(); });
          holdSeek($("rew"), -1);
          holdSeek($("ffw"), 1);
          initDrag();
        }
        paint();
        requestAnimationFrame(loop);
      },
      // nakon otkrivanja: pokaži tipke i pusti (otkrivanje je dodir, pa preglednik dopušta zvuk)
      start: function (teach) {
        if (hasAudio) $("deck").hidden = false;
        if (hasAudio && teach && !reducedMotion) tape.classList.add("nudge"); // pokaži da se kaseta može povući
        play();
        syncButton();
      },
      boost: function (on) { boost = on ? 1 : 0; fx.whirr(on); },
      spin: function (speed) { boost = speed; },   // tiho vrti kolutove (negativno = unazad)
      setMuted: function (m) { if (audio) audio.muted = m; },
    };
  })();

  // ---------- games ----------

  function startGame(type, song, ticketNo, decoys, onDone) {
    var game = $("game");
    var text = $("game-text");
    var finished = false;
    var cleanup = function () {};

    function finish() {
      if (finished) return;
      finished = true;
      cleanup();
      game.hidden = true;
      $("stage").classList.remove("gaming", "guessing");
      document.body.classList.remove("in-game");
      if (type === "scratch" && $("reveal").classList.contains("ticket")) fx.win(); else fx.reveal();
      onDone();
    }

    if (song.hint) {
      $("hint").textContent = "trag: " + song.hint;
      $("hint").hidden = false;
    }
    game.hidden = false;
    $("stage").classList.add("gaming");
    document.body.classList.add("in-game");   // igra ima cijeli ekran: kartice na dnu se sklone
    $("skip").addEventListener("click", finish);

    if (type === "guess") {
      var veilG = $("veil");
      var listen = $("guess-play");
      var opts = $("guess-opts");
      veilG.hidden = false;
      $("guess").hidden = false;
      $("stage").classList.add("guessing");
      text.textContent = "poslušaj unazad pa pogodi";
      var say = function (t) { setContent(listen, icon("rewind"), t); };
      listen.addEventListener("click", function () {
        say("učitavam…");
        fx.onBuffer(function (ok) {
          if (finished) return;
          if (!ok) { say("ne da se pustiti — pogodi napamet"); listen.disabled = true; return; }
          say("svira unazad…");
          deck.spin(-0.35);
          fx.reverseClip(5, function () { deck.spin(0); if (!finished) say("pusti opet"); });
        });
      });
      // točan naslov + dva kriva, promiješano
      var titles = [song.title].concat(decoys).sort(function () { return Math.random() - 0.5; });
      titles.forEach(function (t) {
        var b = el("button", { class: "btn btn-ghost", type: "button" }, t);
        b.addEventListener("click", function () {
          if (t === song.title) return finish();
          b.disabled = true;
          b.classList.add("wrong");
          buzz(60);
          fx.blip(-6);
          text.textContent = "nije ta — probaj opet";
        });
        opts.appendChild(b);
      });
      cleanup = function () {
        fx.stopClip();
        deck.spin(0);
        $("guess").hidden = true;
        veilG.classList.add("gone");
      };
      return;
    }

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
        fx.blip(count);
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
        deck.boost(true);
        buzz(10);
        if (!raf) { last = Date.now(); raf = setInterval(step, 30); }
      };
      var release = function () {
        down = false;
        deck.boost(false);
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
        deck.boost(false);
        veil2.classList.add("gone");
      };
      return;
    }

    // srećka: srebrna folija koja se grebe
    var canvas = $("scratch");
    var ctx = canvas.getContext && canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) { $("veil").hidden = false; cleanup = function () { $("veil").classList.add("gone"); }; text.textContent = "dodirni „samo otvori”"; return; }
    $("reveal").classList.add("ticket");
    $("ticket-head").hidden = false;
    $("ticket-foot").hidden = false;
    $("ticket-no").textContent = "br. " + String(ticketNo).padStart(4, "0");
    setContent($("label"), icon("heart"), icon("heart"), icon("heart"), " dobitak");
    canvas.hidden = false;
    text.textContent = "ogrebi srećku prstom";

    var box = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = canvas.width = Math.max(1, Math.round(box.width * dpr));
    var H = canvas.height = Math.max(1, Math.round(box.height * dpr));

    // folija: metalni preljev + zrno + sitni tisak "OGREBI"
    var g = ctx.createLinearGradient(0, 0, W, H);
    [[0, "#d9dce2"], [0.3, "#a2a7b0"], [0.48, "#eceef2"], [0.62, "#9a9fa9"], [0.85, "#d2d5db"], [1, "#b0b5bd"]]
      .forEach(function (st) { g.addColorStop(st[0], st[1]); });
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < 1400; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.28)" : "rgba(60,64,74,0.16)";
      ctx.fillRect(Math.random() * W, Math.random() * H, dpr, dpr);
    }
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.35);
    ctx.fillStyle = "rgba(70,74,84,0.2)";
    ctx.font = "800 " + 11 * dpr + "px \"Courier Prime\", monospace";
    ctx.textAlign = "center";
    for (var ry = -H; ry < H; ry += 22 * dpr) {
      for (var rx = -W; rx < W; rx += 78 * dpr) ctx.fillText("OGREBI", rx + ((ry / (22 * dpr)) % 2 ? 39 * dpr : 0), ry);
    }
    ctx.restore();
    var pw = 190 * dpr, ph = 40 * dpr;
    ctx.fillStyle = "rgba(245,246,248,0.9)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect((W - pw) / 2, (H - ph) / 2, pw, ph, ph / 2); else ctx.rect((W - pw) / 2, (H - ph) / 2, pw, ph);
    ctx.fill();
    ctx.fillStyle = "#3d4250";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 " + 15 * dpr + "px \"Courier Prime\", monospace";
    ctx.fillText("OGREBI OVDJE", W / 2 + 12 * dpr, H / 2 + dpr);
    // novčić lijevo od natpisa (nacrtan, ne emoji)
    var cx0 = W / 2 - 70 * dpr, cy0 = H / 2;
    ctx.fillStyle = "#c9a23a";
    ctx.beginPath(); ctx.arc(cx0, cy0, 10 * dpr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#8a6a14";
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath(); ctx.arc(cx0, cy0, 6.500 * dpr, 0, Math.PI * 2); ctx.stroke();

    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 30 * dpr;

    var drawing = false, px = 0, py = 0, moves = 0, lastMove = 0;
    function pos(e) {
      var r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
    }
    // neravan rub poteza, kao trag novčića
    function rough(x, y) {
      for (var k = 0; k < 6; k++) {
        ctx.beginPath();
        ctx.arc(x + (Math.random() - 0.5) * 40 * dpr, y + (Math.random() - 0.5) * 40 * dpr, (2 + Math.random() * 6) * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    function flake(e) {
      if (reducedMotion) return;
      var f = el("i", { class: "flake", "aria-hidden": "true" });
      f.style.left = e.clientX + (Math.random() - 0.5) * 24 + "px";
      f.style.top = e.clientY + "px";
      f.style.setProperty("--fx", (Math.random() - 0.5) * 60 + "px");
      document.body.appendChild(f);
      f.addEventListener("animationend", function () { this.remove(); });
    }
    function cleared() {
      try {
        var d = ctx.getImageData(0, 0, W, H).data;
        var clear = 0, total = 0;
        for (var k = 3; k < d.length; k += 4 * 24) { total++; if (d[k] < 40) clear++; }
        return clear / total;
      } catch (e) { return 1; }
    }
    function check() { if (cleared() > 0.6) finish(); }

    canvas.addEventListener("pointerdown", function (e) {
      drawing = true;
      var p0 = pos(e);
      px = p0[0]; py = p0[1];
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      lastMove = performance.now();
      fx.scratch(0.4);
      ctx.beginPath();
      ctx.arc(px, py, 15 * dpr, 0, Math.PI * 2);
      ctx.fill();
      rough(px, py);
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!drawing) return;
      var p1 = pos(e);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(p1[0], p1[1]);
      ctx.stroke();
      rough(p1[0], p1[1]);
      var tNow = performance.now();
      fx.scratch(Math.hypot(p1[0] - px, p1[1] - py) / dpr / Math.max(8, tNow - lastMove));
      lastMove = tNow;
      px = p1[0]; py = p1[1];
      moves++;
      if (moves % 3 === 0) flake(e);
      if (moves % 6 === 0) buzz(4);
      if (moves % 10 === 0) check();
    });
    var stop = function () { if (drawing) { drawing = false; fx.scratchEnd(); check(); } };
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);
    cleanup = function () {
      fx.scratchEnd();
      canvas.classList.add("gone");
      $("reveal").classList.add("won");   // sjaj preko listića
      $("stamp").hidden = false;          // pečat "dobitak"
    };
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

    var muteBtn = $("mute");
    var paintMute = function () {
      setContent(muteBtn, icon(state.muted ? "volume-off" : "volume"));
      muteBtn.setAttribute("aria-pressed", String(state.muted));
      muteBtn.setAttribute("aria-label", state.muted ? "Uključi zvuk" : "Isključi zvuk");
    };
    muteBtn.addEventListener("click", function () {
      state.muted = !state.muted;
      saveState();
      fx.setMuted(state.muted);
      deck.setMuted(state.muted);
      paintMute();
    });
    paintMute();

    renderSong(current, trackNo, label);
    deck.init(current);
    renderReactions(current);
    var streak = touchStreak(today);
    refreshBox = function () { renderBox(released, current); };
    refreshBox();
    renderRewards(streak);
    initViews();

    // spremanje kasete u kutiju
    var collectBtn = $("collect");
    var paintCollect = function () {
      var done = Boolean(state.collected[current.at]);
      collectBtn.classList.toggle("done", done);
      collectBtn.disabled = done;
      if (done) setContent(collectBtn, icon("check"), "u kutiji je");
      else setContent(collectBtn, icon("box"), "spremi kasetu u kutiju");
    };
    collectBtn.addEventListener("click", function () {
      if (state.collected[current.at]) return;
      state.collected[current.at] = Date.now();
      saveState();
      fx.click();
      fx.reveal();
      buzz([15, 30, 15]);
      paintCollect();
      refreshBox();
      var badge = $("box-badge");
      badge.classList.remove("pop");
      void badge.offsetWidth;
      badge.classList.add("pop");
      if (reducedMotion) return;
      // kaseta odleti prema kutiji pa se vrati na mjesto
      var tape = $("tape");
      tape.classList.remove("nudge");
      tape.classList.add("fly");
      setTimeout(function () { tape.classList.remove("fly"); }, 900);
    });
    paintCollect();
    $("back").hidden = isLatest;
    $("stage").hidden = false;

    function showAfter(celebrate) {
      deck.start(celebrate);
      $("after").hidden = false;
      renderNext(upcoming[0], isLatest);
      if (celebrate) {
        confetti($("reveal"), 26);
        buzz([20, 40, 30]);
      }
    }

    // ?igra=scratch|tap|hold|guess — ponovno odigraj otkrivanje (za isprobavanje)
    var forced = new URLSearchParams(location.search).get("igra");
    if (GAMES.indexOf(forced) === -1) forced = null;

    if (!forced && (!isLatest || state.opened[current.at])) {
      showAfter(false);
      return;
    }

    var type = forced || (GAMES.indexOf(current.reveal) !== -1 ? current.reveal : GAMES[(trackNo - 1) % GAMES.length]);
    // "pogodi unazad" treba zvuk i dva druga naslova za krive odgovore; inače srećka
    var decoys = [];
    released.forEach(function (s) {
      if (s.title !== current.title && decoys.indexOf(s.title) === -1) decoys.push(s.title);
    });
    decoys = decoys.sort(function () { return Math.random() - 0.5; }).slice(0, 2);
    if (type === "guess" && (decoys.length < 2 || !(current.audio || current.preview))) type = "scratch";

    startGame(type, current, trackNo, decoys, function () {
      state.opened[current.at] = Date.now();
      saveState();
      refreshBox();
      showAfter(true);
    });
  }

  try {
    main();
  } catch (err) {
    console.error(err);
    ["stage", "after", "view-box", "tabs"].forEach(function (id) { if ($(id)) $(id).hidden = true; });
    if ($("empty")) {
      $("empty-title").textContent = "Ups, nešto je zapelo";
      $("empty-text").textContent = "osvježi stranicu za koji tren";
      $("empty").hidden = false;
    }
  }
})();
