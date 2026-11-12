/*
 * Pixel-art naljepnice: ona, on, njihove životinje i "nas dvoje".
 * Likovi su nacrtani točku po točku (bez slika) i bojaju se prema postavkama
 * (config.cast), pa ih isti kod crta i na stranici i u sučelju za unos.
 *
 *   PIXEL.make("her", cast, 6)            -> <canvas> s likom, 6 px po točki
 *   PIXEL.make("pet0", cast, 4, true)     -> tamna silueta (još nije otključano)
 *   PIXEL.order(cast, 5)                  -> ["her", "pet0", "him", "us", "heart"]
 *   PIXEL.label("pet0", cast)             -> "Miki"
 */
window.PIXEL = (function () {
  "use strict";

  var OPTIONS = {
    hair: { crna: "#2b2118", smeda: "#6b4423", plava: "#e2b84f", rida: "#c0522a", sijeda: "#a9a9a9" },
    skin: { svijetla: "#f6d3b3", srednja: "#d9a57a", tamna: "#9b6a45" },
    fur: { crna: "#3b3335", bijela: "#f4efe6", narancasta: "#e8943a", smeda: "#8a5a34", siva: "#9aa0a6" },
    pet: { macka: "Mačka", pas: "Pas", zec: "Zec" },
    labels: {
      crna: "crna", smeda: "smeđa", plava: "plava", rida: "riđa", sijeda: "sijeda",
      svijetla: "svijetla", srednja: "srednja", tamna: "tamna",
      bijela: "bijela", narancasta: "narančasta", siva: "siva",
    },
  };
  var INK = "#2b2118";

  // H kosa, S koža, E oko, M usta, C odjeća, P hlače, B cipele
  var PERSON = [
    "....HHHH....",
    "...HHHHHH...",
    "..HHHHHHHH..",
    "..HHSSSSHH..",
    "..HSSSSSSH..",
    "..SSESSESS..",
    "..SSSSSSSS..",
    "...SSMMSS...",
    "....SSSS....",
    "...CCCCCC...",
    "..CCCCCCCC..",
    "..SCCCCCCS..",
    "..SCCCCCCS..",
    "...PPPPPP...",
    "...PP..PP...",
    "...BB..BB...",
  ];
  // duga kosa pada niz ramena
  var LONG = {
    3: ".HHHSSSSHHH.", 4: ".HHSSSSSSHH.", 5: ".HHSESSESHH.", 6: ".HHSSSSSSHH.",
    7: ".HHSSMMSSHH.", 8: ".HH.SSSS.HH.", 9: ".HHCCCCCCHH.", 10: ".HCCCCCCCCH.",
  };
  // haljina umjesto hlača
  var DRESS = { 13: "..CCCCCCCC..", 14: "...SS..SS..." };

  // K krzno, F tamnije krzno, D oko, N njuška, W bijelo
  var PETS = {
    macka: [
      "..K......K..",
      "..KK....KK..",
      "..KKKKKKKK..",
      "..KDKKKKDK..",
      "..KKKNNKKK..",
      "...KKKKKK..K",
      "..KKKKKKKK.K",
      "..KKKKKKKKKK",
      "..KKKKKKKK..",
      "..KK....KK..",
    ],
    pas: [
      "............",
      ".FFKKKKKKFF.",
      ".FFKKKKKKFF.",
      ".FFKDKKDKFF.",
      "..KKKNNKKK..",
      "...KKKKKK..K",
      "..KKKKKKKK.K",
      "..KKKKKKKKK.",
      "..KKKKKKKK..",
      "..KK....KK..",
    ],
    zec: [
      "...K....K...",
      "...K....K...",
      "...KK..KK...",
      "..KKKKKKKK..",
      "..KDKKKKDK..",
      "..KKKNNKKK..",
      "...KKKKKK...",
      "..KKKKKKKKW.",
      "..KKKKKKKK..",
      "..KK....KK..",
    ],
  };
  var HEART = [".RR.RR.", "RRRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."];

  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16);
    var c = [n >> 16, (n >> 8) & 255, n & 255].map(function (v) { return Math.round(v * k); });
    return "rgb(" + c.join(",") + ")";
  }
  function pick(map, key, fallback) { return map[key] || map[fallback]; }

  function person(p, opts) {
    p = p || {};
    var rows = PERSON.slice();
    var k;
    if (p.long) for (k in LONG) rows[k] = LONG[k];
    if (opts.dress) for (k in DRESS) rows[k] = DRESS[k];
    return {
      rows: rows,
      pal: {
        H: pick(OPTIONS.hair, p.hair, "smeda"), S: pick(OPTIONS.skin, p.skin, "svijetla"),
        E: INK, M: "#c9685a", C: opts.clothes, P: "#3d4a66", B: INK,
      },
    };
  }

  function pet(a) {
    a = a || {};
    var fur = pick(OPTIONS.fur, a.color, "siva");
    return {
      rows: PETS[a.type] || PETS.macka,
      pal: { K: fur, F: shade(fur, 0.7), D: a.color === "crna" ? "#f0c93a" : INK, N: "#e58aa0", W: "#ffffff" },
    };
  }

  // who -> slojevi { rows, pal, x, y }
  function layers(who, cast) {
    cast = cast || {};
    var pets = Array.isArray(cast.pets) ? cast.pets : [];
    var her = person(cast.her || { long: true }, { dress: true, clothes: "#ef6a4c" });
    var him = person(cast.him, { clothes: "#6f9fe0" });
    if (who === "her") return [Object.assign(her, { x: 0, y: 0 })];
    if (who === "him") return [Object.assign(him, { x: 0, y: 0 })];
    if (who === "us") {
      return [
        Object.assign(her, { x: 0, y: 6 }),
        Object.assign(him, { x: 13, y: 6 }),
        { rows: HEART, pal: { R: "#e0457b" }, x: 9, y: 0 },
      ];
    }
    var m = /^pet(\d)$/.exec(who);
    if (m && pets[Number(m[1])]) return [Object.assign(pet(pets[Number(m[1])]), { x: 0, y: 0 })];
    return [{ rows: HEART, pal: { R: "#e0457b" }, x: 0, y: 0 }];
  }

  function make(who, cast, scale, silhouette) {
    var parts = layers(who, cast);
    var w = 0, h = 0;
    parts.forEach(function (l) {
      w = Math.max(w, l.x + l.rows[0].length);
      h = Math.max(h, l.y + l.rows.length);
    });
    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.className = "px" + (silhouette ? " px-locked" : "");
    canvas.style.width = w * (scale || 4) + "px";
    canvas.style.height = h * (scale || 4) + "px";
    canvas.setAttribute("aria-hidden", "true");
    var ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return canvas;
    parts.forEach(function (l) {
      l.rows.forEach(function (row, y) {
        for (var x = 0; x < row.length; x++) {
          var ch = row.charAt(x);
          if (ch === ".") continue;
          ctx.fillStyle = silhouette ? INK : (l.pal[ch] || INK);
          ctx.fillRect(l.x + x, l.y + y, 1, 1);
        }
      });
    });
    return canvas;
  }

  // Redoslijed otključavanja: ona, prva životinja, on, ostale životinje, pa nas dvoje.
  function order(cast, count) {
    var pets = cast && Array.isArray(cast.pets) ? cast.pets : [];
    var seq = ["her"];
    if (pets[0]) seq.push("pet0");
    seq.push("him");
    for (var i = 1; i < pets.length && i < 4; i++) seq.push("pet" + i);
    seq.push("us");
    var out = [];
    for (var n = 0; n < count; n++) out.push(seq[n] || "heart");
    return out;
  }

  function label(who, cast) {
    cast = cast || {};
    if (who === "her") return "Ti";
    if (who === "him") return "Ja";
    if (who === "us") return "Nas dvoje";
    var m = /^pet(\d)$/.exec(who);
    var a = m && cast.pets && cast.pets[Number(m[1])];
    if (a) return a.name || OPTIONS.pet[a.type] || "Ljubimac";
    return "Srce";
  }

  return { make: make, order: order, label: label, OPTIONS: OPTIONS };
})();
