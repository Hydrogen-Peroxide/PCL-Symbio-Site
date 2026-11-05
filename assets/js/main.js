(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.getElementById("site-header");
  var nav = document.getElementById("site-nav");
  var menuBtn = document.getElementById("menu-btn");
  var sections = ["features", "bedrock", "download", "faq"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  /* 顶部导航背景 */
  function onScrollHeader() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }
  }

  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* 移动端菜单 */
  function setMenu(open) {
    if (!nav || !menuBtn) return;
    nav.classList.toggle("is-open", open);
    menuBtn.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "关闭导航菜单" : "打开导航菜单");
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      setMenu(!nav.classList.contains("is-open"));
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("click", function (event) {
      if (!nav.contains(event.target) && !menuBtn.contains(event.target)) {
        setMenu(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setMenu(false);
    });

    var desktopQuery = window.matchMedia("(min-width: 901px)");
    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener("change", function (event) {
        if (event.matches) setMenu(false);
      });
    }
  }

  /* 滚动时高亮当前区块 */
  if (nav && sections.length) {
    var navLinks = Array.prototype.slice.call(nav.querySelectorAll("a"));
    var spyTicking = false;

    function updateSpy() {
      spyTicking = false;
      var current = "";
      var marker = window.innerHeight * 0.34;

      sections.forEach(function (section) {
        var rect = section.getBoundingClientRect();
        if (rect.top <= marker && rect.bottom > marker) {
          current = section.id;
        }
      });

      navLinks.forEach(function (link) {
        var isCurrent = link.getAttribute("href") === "#" + current;
        link.classList.toggle("is-current", isCurrent);
        if (isCurrent) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    window.addEventListener("scroll", function () {
      if (spyTicking) return;
      spyTicking = true;
      window.requestAnimationFrame(updateSpy);
    }, { passive: true });

    updateSpy();
  }

  /* 入场动画 */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
  } else {
    revealItems.forEach(function (item) {
      var group = Array.prototype.slice.call(item.parentElement.children)
        .filter(function (child) { return child.classList.contains("reveal"); });
      var index = group.indexOf(item);
      item.style.setProperty("--delay", Math.min(index, 5) * 60 + "ms");
    });

    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    revealItems.forEach(function (item) { revealObserver.observe(item); });
  }

  /* Hero 视差 */
  var heroVisual = document.getElementById("hero-visual");
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  if (heroVisual && finePointer && !reduceMotion && window.innerWidth > 1024) {
    var resetParallax = function () {
      heroVisual.style.setProperty("--mx", "0");
      heroVisual.style.setProperty("--my", "0");
    };

    heroVisual.addEventListener("pointermove", function (event) {
      var rect = heroVisual.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      heroVisual.style.setProperty("--mx", (x * 1.6).toFixed(3));
      heroVisual.style.setProperty("--my", (y * 1.6).toFixed(3));
    });

    heroVisual.addEventListener("pointerleave", resetParallax);
  }

  /* 复制构建命令 */
  var copyBtn = document.querySelector(".copy-btn");
  var feedback = document.getElementById("copy-feedback");

  function showFeedback(message) {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.add("is-visible");
    window.clearTimeout(showFeedback.timer);
    showFeedback.timer = window.setTimeout(function () {
      feedback.classList.remove("is-visible");
    }, 1800);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.top = "-200px";
      document.body.appendChild(helper);
      helper.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(helper);
      }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var target = document.getElementById(copyBtn.dataset.copyTarget);
      if (!target) return;

      copyText(target.textContent.trim()).then(function () {
        var label = copyBtn.querySelector("span");
        if (label) label.textContent = "已复制";
        showFeedback("构建命令已复制到剪贴板");
        window.setTimeout(function () {
          if (label) label.textContent = "复制";
        }, 1800);
      }).catch(function () {
        showFeedback("复制失败，请手动选择命令");
      });
    });
  }

  /* FAQ：一次只展开一项 */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll(".faq-item"));

  faqItems.forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      faqItems.forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* 年份 */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
