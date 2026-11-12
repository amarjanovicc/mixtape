(function () {
  "use strict";

  var DEFAULTS = {
    to: "",
    from: "",
    timeZone: "Europe/Zagreb",
    noteLead: "podsjetila me na tebe jer…",
  };
  var SEEN_KEY = "pjesma-dana:opened";
  var ISO = /^\d{4}-\d{2}-\d{2}$/;

  var data = window.DAILY_SONG || {};
  var config = Object.assign({}, DEFAULTS, data.config || {});
  var reducedMotion = matchMediaSafe("(prefers-reduced-motion: reduce)");

  function $(id) { return document.getElementById(id); }

  function matchMediaSafe(q) {
    try { return window.matchMedia(q).matches; } catch (e) { return false; }
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function isRealDate(s) {
    if (typeof s !== "string" || !ISO.test(s)) return false;
    var d = new Date(s + "T00:00:00Z");
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }

  function todayISO(timeZone) {
    try {
      var parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      }).formatToParts(new Date());
      var get = function (t) { return parts.find(function (p) { return p.type === t; }).value; };
      return get("year") + "-" + get("month") + "-" + get("day");
    } catch (e) {
      var d = new Date();
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    }
  }

  function formatDate(iso, opts) {
    try {
      var s = new Intl.DateTimeFormat("hr-HR", Object.assign({ timeZone: "UTC" }, opts))
        .format(new Date(iso + "T12:00:00Z"));
      return s.charAt(0).toUpperCase() + s.slice(1);
    } catch (e) {
      var p = iso.split("-");
      return Number(p[2]) + ". " + Number(p[1]) + ". " + p[0] + ".";
    }
  }

  function storageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }

  // ---------- data ----------

  function loadSongs() {
    var raw = Array.isArray(data.songs) ? data.songs : [];
    var seen = {};
    return raw.filter(function (s) {
      if (!s || !isRealDate(s.date) || !s.title) {
        console.warn("[pjesma-dana] preskačem neispravan unos:", s);
        return false;
      }
      if (seen[s.date]) {
        console.warn("[pjesma-dana] dupli datum, preskačem:", s.date);
        return false;
      }
      seen[s.date] = true;
      return true;
    }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
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

  function hueFor(text) {
    var h = 0;
    for (var i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    return (320 + (h % 70)) % 360; // roze → crvena → breskva
  }

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text != null) node.textContent = text;
    return node;
  }

  function renderPlayer(song) {
    var player = $("player");
    player.textContent = "";
    var sp = spotifyEmbed(song.spotify);
    var yt = youtubeId(song.youtube);
    if (sp) {
      player.appendChild(el("iframe", {
        src: sp.src,
        height: String(sp.height),
        title: "Spotify: " + song.title,
        allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
        loading: "lazy",
      }));
    } else if (yt) {
      player.appendChild(el("iframe", {
        src: "https://www.youtube-nocookie.com/embed/" + yt,
        class: "yt",
        title: "YouTube: " + song.title,
        allow: "autoplay; encrypted-media; fullscreen; picture-in-picture",
        allowfullscreen: "",
        loading: "lazy",
      }));
    }
  }

  function renderLinks(song) {
    var links = $("links");
    links.textContent = "";
    var q = encodeURIComponent([song.title, song.artist].filter(Boolean).join(" "));
    var spotifyHref = song.spotify || "https://open.spotify.com/search/" + q;
    var youtubeHref = song.youtube || "https://www.youtube.com/results?search_query=" + q;
    links.appendChild(el("a", { class: "btn btn-primary", href: spotifyHref, target: "_blank", rel: "noopener" }, "▶ Spotify"));
    links.appendChild(el("a", { class: "btn btn-ghost", href: youtubeHref, target: "_blank", rel: "noopener" }, "YouTube"));
  }

  // ---------- render ----------

  function renderSong(song, label) {
    document.documentElement.style.setProperty("--hue", hueFor(song.title + (song.artist || "")));
    document.title = song.title + " · Pjesma dana 💌";

    $("label").textContent = label;
    $("date").textContent = formatDate(song.date, { weekday: "long", day: "numeric", month: "long" });
    $("title").textContent = song.title;
    $("artist").textContent = song.artist || "";
    $("artist").hidden = !song.artist;

    renderPlayer(song);
    renderLinks(song);

    if (song.note) {
      $("note-lead").textContent = config.noteLead;
      $("note").textContent = song.note;
      $("note-wrap").hidden = false;
    }

    $("sign").textContent = config.from ? "— " + config.from : "";
  }

  function renderArchive(songs, current) {
    var others = songs.filter(function (s) { return s !== current; }).reverse();
    if (!others.length) return;
    var list = $("archive-list");
    others.forEach(function (s) {
      var a = el("a", { href: "?d=" + s.date });
      var info = el("span", { class: "a-song" });
      info.appendChild(el("div", { class: "a-title" }, s.title));
      if (s.artist) info.appendChild(el("div", { class: "a-artist" }, s.artist));
      a.appendChild(info);
      a.appendChild(el("span", { class: "a-date" }, formatDate(s.date, { day: "numeric", month: "numeric" })));
      var li = el("li");
      li.appendChild(a);
      list.appendChild(li);
    });
    $("archive-count").textContent = String(others.length);
    $("archive").hidden = false;
  }

  // ---------- hearts ----------

  function backgroundHearts() {
    if (reducedMotion) return;
    var box = $("bg-hearts");
    for (var i = 0; i < 12; i++) {
      var h = el("span", null, "♥");
      h.style.left = Math.random() * 100 + "%";
      h.style.fontSize = 10 + Math.random() * 16 + "px";
      h.style.animationDuration = 14 + Math.random() * 14 + "s";
      h.style.animationDelay = -Math.random() * 28 + "s";
      box.appendChild(h);
    }
  }

  function burst(originEl, count) {
    if (reducedMotion || !originEl) return;
    var r = originEl.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var glyphs = ["♥", "💗", "💕", "♥", "💖"];
    for (var i = 0; i < count; i++) {
      var h = el("span", { class: "burst", "aria-hidden": "true" }, glyphs[i % glyphs.length]);
      var angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
      var dist = 70 + Math.random() * 90;
      h.style.left = cx - 11 + "px";
      h.style.top = cy - 11 + "px";
      h.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      h.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      h.style.animationDelay = Math.random() * 0.12 + "s";
      document.body.appendChild(h);
      h.addEventListener("animationend", function () { this.remove(); });
    }
  }

  // ---------- main ----------

  function main() {
    var songs = loadSongs();
    var today = todayISO(config.timeZone);
    var released = songs.filter(function (s) { return s.date <= today; });

    backgroundHearts();

    if (!released.length) {
      $("empty").hidden = false;
      return;
    }

    var requestedDate = new URLSearchParams(location.search).get("d");
    var requested = released.find(function (s) { return s.date === requestedDate; });
    var current = requested || released.find(function (s) { return s.date === today; }) || released[released.length - 1];
    var isToday = current.date === today;

    var label = requested && !isToday ? "Iz arhive" : isToday ? "Pjesma dana" : "Zadnja pjesma";
    renderSong(current, label);
    renderArchive(released, current);
    if (requested && current !== released[released.length - 1]) $("back").hidden = false;

    var heartBtn = $("heart-btn");
    heartBtn.addEventListener("click", function () {
      heartBtn.classList.remove("pop");
      void heartBtn.offsetWidth;
      heartBtn.classList.add("pop");
      burst(heartBtn, 10);
    });

    var showEnvelope = isToday && !requested && storageGet(SEEN_KEY) !== current.date;
    if (!showEnvelope) {
      $("card").hidden = false;
      return;
    }

    var envelope = $("envelope");
    if (config.to) $("env-title").textContent = config.to + ", imaš novu pjesmu";
    envelope.hidden = false;
    var archiveWasVisible = !$("archive").hidden;
    $("archive").hidden = true;

    $("open-btn").addEventListener("click", function () {
      storageSet(SEEN_KEY, current.date);
      envelope.classList.add("leaving");
      setTimeout(function () {
        envelope.hidden = true;
        $("card").hidden = false;
        $("archive").hidden = !archiveWasVisible;
        burst($("title"), 14);
      }, reducedMotion ? 0 : 320);
    }, { once: true });
  }

  try {
    main();
  } catch (err) {
    console.error(err);
    var empty = $("empty");
    if (empty) {
      empty.querySelector(".title").textContent = "Ups, nešto je zapelo";
      empty.querySelector(".artist").textContent = "osvježi stranicu za koji tren 💗";
      empty.hidden = false;
    }
  }
})();
