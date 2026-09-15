(function () {
  var THEME_KEY = "bryandero98:theme";
  var LANG_KEY = "bryandero98:lang";

  function safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // localStorage bloqueado (modo privado, etc.) - el toggle sigue
      // funcionando para esta visita, solo no persiste entre sesiones.
    }
  }

  function announce(message) {
    var region = document.getElementById("a11yAnnouncer");
    if (region && message) region.textContent = message;
  }

  function currentTheme() {
    var stored = safeGet(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
    var prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var icon = document.getElementById("themeToggleIcon");
    if (icon) icon.textContent = theme === "dark" ? "☽" : "☀";
    // El gráfico de actividad es una imagen estática (no puede leer
    // variables CSS), así que se generaron dos variantes con los colores
    // de cada tema y se cambia el src según cuál esté activo.
    var chart = document.getElementById("activityChart");
    if (chart) chart.src = "assets/activity-" + theme + ".svg";
    safeSet(THEME_KEY, theme);
  }

  function currentLang() {
    var stored = safeGet(LANG_KEY);
    if (stored === "es" || stored === "en") return stored;
    var browserLang = (navigator.language || "es").toLowerCase();
    return browserLang.indexOf("en") === 0 ? "en" : "es";
  }

  function applyLang(lang) {
    var applied = window.applyTranslations && window.applyTranslations(lang);
    if (!applied) return false; // sin diccionario: se deja el español embebido tal cual

    var nextCode = lang === "es" ? "EN" : "ES";
    var toggleText = document.getElementById("langToggleText");
    if (toggleText) toggleText.textContent = nextCode;

    // El aria-label debe contener el texto visible del botón ("EN"/"ES"),
    // si no coinciden, control por voz y lectores de pantalla se confunden
    // (regla de accesibilidad "Label in Name" / WCAG 2.5.3).
    var langBtn = document.getElementById("langToggle");
    if (langBtn) {
      var dict = window.I18N[lang];
      langBtn.setAttribute(
        "aria-label",
        nextCode + " — " + dict["nav.langToggleLabel"]
      );
    }

    safeSet(LANG_KEY, lang);
    return true;
  }

  document.addEventListener("DOMContentLoaded", function () {
    // El salto nativo de fragmento (#main-content) no siempre mueve el foco
    // real del teclado en todos los navegadores, solo hace scroll. Se fuerza
    // explícitamente para que el skip-link cumpla su propósito de verdad.
    var skipLink = document.querySelector(".skip-link");
    if (skipLink) {
      skipLink.addEventListener("click", function () {
        var target = document.getElementById("main-content");
        if (target) target.focus();
      });
    }

    applyTheme(currentTheme());

    var hasDictionary = !!window.I18N;
    if (hasDictionary) {
      applyLang(currentLang());
    }

    var themeBtn = document.getElementById("themeToggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", function () {
        var next =
          document.documentElement.getAttribute("data-theme") === "dark"
            ? "light"
            : "dark";
        applyTheme(next);
        var dict = window.I18N && window.I18N[document.documentElement.lang];
        if (dict) {
          announce(
            next === "dark"
              ? dict["a11y.themeChangedDark"]
              : dict["a11y.themeChangedLight"]
          );
        }
      });
    }

    var langBtn = document.getElementById("langToggle");
    if (langBtn) {
      if (!hasDictionary) {
        // i18n.js no cargó (bloqueado, offline, etc.): no ofrecer un botón
        // que no puede hacer nada, en vez de dejarlo roto.
        langBtn.disabled = true;
        langBtn.title = "Language switcher unavailable";
      } else {
        langBtn.addEventListener("click", function () {
          var next = document.documentElement.lang === "es" ? "en" : "es";
          applyLang(next);
          var dict = window.I18N[next];
          if (dict) announce(dict["a11y.langChanged"]);
        });
      }
    }

    initScrollSpy();
    initCopyButtons();
    initHeroCounter();
    initTechFilter();
    initCardSpotlight();
    loadContributionsData();
  });

  // ===== Scrollspy: resalta en el nav la sección visible =====
  function initScrollSpy() {
    var navLinks = Array.prototype.slice.call(
      document.querySelectorAll(".site-nav a[href^='#']")
    );
    if (!navLinks.length || !("IntersectionObserver" in window)) return;

    var sections = navLinks
      .map(function (link) {
        return document.querySelector(link.getAttribute("href"));
      })
      .filter(Boolean);

    var linkBySectionId = {};
    navLinks.forEach(function (link) {
      linkBySectionId[link.getAttribute("href").slice(1)] = link;
    });

    var lastLink = navLinks[navLinks.length - 1];

    // Caso límite: si la última sección es corta, su inicio puede no llegar
    // nunca a cruzar la franja de observación central del IntersectionObserver
    // de abajo (no queda suficiente scroll debajo para "centrarla"). Si el
    // usuario llegó al final real de la página, se fuerza la última sección
    // como activa - se llama tanto desde el scroll como al final del propio
    // callback del observer, para que siempre tenga la última palabra y no
    // haya condición de carrera entre ambos mecanismos.
    function isAtBottom() {
      return (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2
      );
    }

    function forceLastActive() {
      navLinks.forEach(function (l) {
        l.classList.remove("active");
      });
      lastLink.classList.add("active");
    }

    var observer = new IntersectionObserver(
      function (entries) {
        if (isAtBottom()) {
          forceLastActive();
          return;
        }
        entries.forEach(function (entry) {
          var link = linkBySectionId[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach(function (l) {
              l.classList.remove("active");
            });
            link.classList.add("active");
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" } // activa cuando la sección cruza la franja central de la pantalla
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });

    window.addEventListener(
      "scroll",
      function () {
        if (isAtBottom()) forceLastActive();
      },
      { passive: true }
    );
    if (isAtBottom()) forceLastActive();
  }

  // ===== Botones "copiar" en los comandos de instalación =====
  function initCopyButtons() {
    var buttons = document.querySelectorAll(".copy-btn");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-copy");
        if (!text) return;

        function onCopied() {
          var original = btn.textContent;
          btn.textContent = "✓";
          btn.classList.add("copied");
          var dict = window.I18N && window.I18N[document.documentElement.lang];
          if (dict) announce(dict["a11y.copied"]);
          setTimeout(function () {
            btn.textContent = original;
            btn.classList.remove("copied");
          }, 1500);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(onCopied, function () {
            // permisos de portapapeles bloqueados: no romper nada, solo no confirmar
          });
        } else {
          // navegador sin Clipboard API (muy antiguo/inseguro): degradar en silencio
        }
      });
    });
  }

  // ===== Contador animado del hero (cuenta hacia arriba al entrar en pantalla) =====
  function initHeroCounter() {
    var el = document.getElementById("prCount");
    if (!el || !("IntersectionObserver" in window)) return;

    var target = parseInt(el.textContent, 10);
    if (!target) return;

    var reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return; // deja el número final estático, sin animar

    var played = false;
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || played) return;
          played = true;
          var start = null;
          var duration = 900;
          function step(timestamp) {
            if (start === null) start = timestamp;
            var progress = Math.min((timestamp - start) / duration, 1);
            el.textContent = Math.floor(progress * target);
            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              el.textContent = target;
            }
          }
          el.textContent = "0";
          requestAnimationFrame(step);
          observer.disconnect();
        });
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
  }

  // ===== Filtro de proyectos por tecnología =====
  // El botón "Todos" ya está en el HTML; el resto de chips se generan a
  // partir de los data-tag reales de cada tarjeta, para no duplicar a mano
  // la lista de tecnologías en dos lugares distintos.
  function initTechFilter() {
    var filterBar = document.getElementById("techFilter");
    var cards = Array.prototype.slice.call(
      document.querySelectorAll(".card[data-tags]")
    );
    if (!filterBar || !cards.length) return;

    var tagLabels = {};
    cards.forEach(function (card) {
      card.querySelectorAll(".chip[data-tag]").forEach(function (chip) {
        var tag = chip.getAttribute("data-tag");
        if (tag && !tagLabels[tag]) tagLabels[tag] = chip.textContent.trim();
      });
    });

    Object.keys(tagLabels).forEach(function (tag) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-chip";
      btn.setAttribute("data-filter", tag);
      btn.textContent = tagLabels[tag];
      filterBar.appendChild(btn);
    });

    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest(".filter-chip") : null;
      if (!btn) return;
      var filter = btn.getAttribute("data-filter");

      Array.prototype.slice
        .call(filterBar.querySelectorAll(".filter-chip"))
        .forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });

      cards.forEach(function (card) {
        var tags = (card.getAttribute("data-tags") || "").split(",");
        var show = filter === "all" || tags.indexOf(filter) !== -1;
        card.classList.toggle("is-hidden", !show);
      });
    });
  }

  // ===== Spotlight: resplandor que sigue al mouse dentro de cada tarjeta =====
  function initCardSpotlight() {
    document.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty("--spot-x", x + "%");
        card.style.setProperty("--spot-y", y + "%");
      });
    });
  }

  // ===== Datos en vivo de contribuciones (data/contributions.json) =====
  // Generado y refrescado por un GitHub Action programado
  // (.github/workflows/update-contributions.yml). Es una mejora progresiva:
  // si el fetch falla (offline, CORS al abrir el archivo con file://, o el
  // archivo aún no existe la primera vez), la tabla/gráfico de lenguajes
  // simplemente quedan vacíos - nunca rompe nada más de la página.
  //
  // Los grupos que agrupan varios repos bajo una sola etiqueta (hedgehog,
  // node-red, kubestellar) no tienen un único "repo" en los datos - se
  // enlazan a la misma búsqueda de GitHub por organización que ya se usaba
  // en las tarjetas estáticas originales.
  var GROUP_SEARCH_URLS = {
    hedgehog:
      "https://github.com/search?q=is%3Apr+is%3Amerged+author%3ABryandero98+org%3Askyf0xx&type=pullrequests",
    nodered:
      "https://github.com/search?q=is%3Apr+is%3Amerged+author%3ABryandero98+org%3Anode-red&type=pullrequests",
    kubestellar:
      "https://github.com/search?q=is%3Apr+is%3Amerged+author%3ABryandero98+org%3Akubestellar&type=pullrequests",
  };

  function contribGroupUrl(repo) {
    if (GROUP_SEARCH_URLS[repo.key]) return GROUP_SEARCH_URLS[repo.key];
    if (repo.latest && repo.latest.repo) {
      return (
        "https://github.com/" +
        repo.latest.repo +
        "/pulls?q=is%3Apr+is%3Amerged+author%3ABryandero98"
      );
    }
    return "https://github.com/Bryandero98";
  }

  var contribSortKey = "count";
  var contribSortDir = "desc";

  function renderContribTable(repos) {
    var tbody = document.getElementById("contribTableBody");
    var emptyMsg = document.getElementById("contribEmpty");
    if (!tbody) return;

    var query = "";
    var search = document.getElementById("contribSearch");
    if (search) query = search.value.trim().toLowerCase();

    var filtered = repos.filter(function (repo) {
      return !query || repo.label.toLowerCase().indexOf(query) !== -1;
    });

    var sorted = filtered.slice().sort(function (a, b) {
      var dir = contribSortDir === "asc" ? 1 : -1;
      if (contribSortKey === "label") {
        return a.label.localeCompare(b.label) * dir;
      }
      return (a.count - b.count) * dir;
    });

    tbody.innerHTML = "";
    sorted.forEach(function (repo) {
      var tr = document.createElement("tr");

      var repoCell = document.createElement("td");
      var link = document.createElement("a");
      link.href = contribGroupUrl(repo);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = repo.label;
      repoCell.appendChild(link);

      var countCell = document.createElement("td");
      countCell.className = "contrib-count";
      countCell.textContent = repo.count;

      var latestCell = document.createElement("td");
      latestCell.className = "contrib-latest-cell";
      if (repo.latest) {
        var latestLink = document.createElement("a");
        latestLink.href = repo.latest.url;
        latestLink.target = "_blank";
        latestLink.rel = "noopener noreferrer";
        latestLink.textContent = "#" + repo.latest.number + " " + repo.latest.title;
        latestCell.appendChild(latestLink);
      }

      tr.appendChild(repoCell);
      tr.appendChild(countCell);
      tr.appendChild(latestCell);
      tbody.appendChild(tr);
    });

    if (emptyMsg) emptyMsg.hidden = sorted.length > 0;
  }

  function initContribTableControls(repos) {
    var search = document.getElementById("contribSearch");
    if (search) {
      search.addEventListener("input", function () {
        renderContribTable(repos);
      });
    }

    var table = document.getElementById("contribTable");
    if (!table) return;
    table.querySelectorAll(".sort-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-sort");
        if (contribSortKey === key) {
          contribSortDir = contribSortDir === "asc" ? "desc" : "asc";
        } else {
          contribSortKey = key;
          contribSortDir = key === "label" ? "asc" : "desc";
        }

        table.querySelectorAll(".sort-btn").forEach(function (b) {
          b.classList.toggle("active", b === btn);
          b.removeAttribute("data-sort-dir");
        });
        btn.setAttribute("data-sort-dir", contribSortDir);

        renderContribTable(repos);
      });
    });
  }

  function renderLangBars(languages) {
    var container = document.getElementById("langBars");
    if (!container || !languages || !languages.length) return;

    container.innerHTML = "";
    languages.forEach(function (lang) {
      var row = document.createElement("div");
      row.className = "lang-bar";

      var label = document.createElement("span");
      label.className = "lang-bar-label";
      label.textContent = lang.name;

      var track = document.createElement("span");
      track.className = "lang-bar-track";
      var fill = document.createElement("span");
      fill.className = "lang-bar-fill";
      fill.style.width = lang.pct + "%";
      track.appendChild(fill);

      var pct = document.createElement("span");
      pct.className = "lang-bar-pct";
      pct.textContent = lang.pct + "%";

      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(pct);
      container.appendChild(row);
    });
  }

  function loadContributionsData() {
    fetch("data/contributions.json")
      .then(function (res) {
        if (!res.ok) throw new Error("bad status");
        return res.json();
      })
      .then(function (data) {
        if (!data || typeof data.total !== "number") return;

        var counterEl = document.getElementById("prCount");
        if (counterEl) counterEl.textContent = data.total;

        var repos = data.repos || [];
        renderContribTable(repos);
        initContribTableControls(repos);
        renderLangBars(data.languages || []);
      })
      .catch(function () {
        // ver comentario de la función: degradación silenciosa e intencional.
      });
  }
})();
