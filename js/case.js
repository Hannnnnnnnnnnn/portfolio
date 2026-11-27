/* Case-study pages only. Blocks 2, 4b–8 of Hannnnnnnnnnnn.github.io main.js @97cb1a4, unchanged.
   (1, 3, 4, 9 were home-page only.) */
/* CSS가 콘텐츠를 숨기고 이 파일이 되돌리는 구조라, 여기서 예외가 나면 페이지가
   백지로 남는다. 기능 하나가 죽어도 나머지는 살고, 최악의 경우 html.js 를 떼어
   전부 그냥 보이게 만든다.
   CSS hides content and this file reveals it, so a throw here would leave the page
   blank. Each feature is isolated; on failure we drop html.js so everything shows. */
const run = (fn) => {
  try { fn(); }
  catch (e) { console.error("[portfolio]", e); document.documentElement.classList.remove("js"); }
};

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── 2. 스크롤 진입 리빌 ──
   IntersectionObserver 단독에 의존하지 않는다: 숨은 탭에서는 콜백이 오지 않아
   opacity:0 인 콘텐츠가 영구히 안 보이게 된다.
   Never gate visible content on IO alone — a hidden tab delivers no callbacks,
   which would strand opacity:0 content forever. */
run(() => {
  const targets = document.querySelectorAll(".rows li, .section-head, .hero-caption, .prose > *");
  if (!targets.length || reduce) return;
  const show = (el) => el.classList.add("is-in");
  const inView = (el) => {
    const r = el.getBoundingClientRect();
    return r.top < innerHeight * 0.9 && r.bottom > 0;
  };
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }),
    { rootMargin: "0px 0px -10% 0px" }
  );
  targets.forEach((el) => io.observe(el));

  const sweep = () => targets.forEach((el) => { if (inView(el)) show(el); });
  setTimeout(sweep, 0);                                  // 첫 화면분 / above the fold
  document.addEventListener("visibilitychange", sweep);  // 탭이 살아나면 재확인 / re-check on wake
});

/* ── 4b. 리뷰 조건부 렌더 (01 Decision 01) ──
   "리뷰를 없앤 게 아니라 빈 껍데기를 없앴다"는 게 논점이라, 리뷰 없는 상태에서
   자리가 비어 보이면 안 된다 — 행 자체가 사라져야 한다. hidden 하나면 된다.
   The claim is that the empty shell went, not the reviews, so with none the row is
   not rendered at all rather than left standing empty. */
run(() => {
  const demo = document.querySelector("[data-demo-reviews]");
  if (!demo) return;
  const row = demo.querySelector("[data-reviews-row]");
  // 숨길 때 open 을 건드리지 않는다 — 껐다 켜면 접힌 채로 돌아와서, 정작 보여줘야 할
  // 리뷰 내용이 사라진다. 숨은 동안 열려 있어도 보이지 않으므로 상관없다.
  // Hiding does not close it: forcing it shut meant toggling back returned an empty row,
  // and being open while hidden costs nothing.
  const render = () => {
    row.hidden = demo.querySelector("[name='reviews']:checked").value === "none";
  };
  demo.addEventListener("change", render);
  render();
});

/* ── 5. 데모 B: 상품 정보 칼럼의 배지 ──
   임계값을 8~10으로 올려 보면 "이건 거짓말 같다"는 감각이 직접 생긴다. 그게 2를
   고른 근거고, 산문으로 설명하는 것보다 빠르다.
   Drag the threshold up to 8 and the badge starts to feel like a lie. That
   feeling is the argument for 2, and it lands faster than a paragraph. */
run(() => {
  const demo = document.querySelector("[data-demo-stock]");
  if (!demo) return;
  const $ = (sel) => demo.querySelector(sel);
  const LABEL = { low: "Low Stock", new: "New", popular: "Popular" };
  const render = () => {
    const left = +$("[data-stock]").value, limit = +$("[data-threshold]").value;
    $("[data-out-stock]").textContent = left;
    $("[data-out-threshold]").textContent = limit;
    // 배지 자리는 하나뿐이고 Low Stock > New > Popular 순으로 먼저 맞는 규칙이 이긴다.
    // 재고가 0이면 low stock 규칙 자체가 틀리므로 그 아래가 올라온다.
    // One slot, and the first matching rule wins. At zero the low stock rule is
    // false, so the next one takes the place rather than nothing showing.
    const type = left > 0 && left <= limit ? "low"
      : $("[data-new]").checked ? "new"
      : $("[data-popular]").checked ? "popular" : "";
    const badge = $("[data-badge]");
    badge.hidden = !type;
    badge.textContent = LABEL[type] || "";
    badge.className = "product-badge" + (type ? " product-badge--" + type : "");
    $("[data-sold]").hidden = left > 0;
    $("[data-cta]").textContent = left > 0 ? "Add to cart" : "Sold out";
    $("[data-cta]").disabled = left === 0;
    // 품절이면 실물도 다이내믹 체크아웃을 통째로 내린다 / the real page drops it at zero
    $("[data-dynamic]").hidden = left === 0;
  };
  demo.addEventListener("input", render);
  demo.addEventListener("change", render);
  render();
});

/* ── 6. 데모 C: 프리오더 상태 리졸버 (03 Decision 01) ──
   opt-in 을 시장별로 들고 있는 게 핵심이다. CA↔US 를 바꾸면 같은 variant 가 다른
   상태가 되고, "약속은 시장마다 다르다"는 논점이 조작 한 번으로 전달된다.
   The opt-in is held per market on purpose: flipping CA↔US turns the same
   variant into a different state, which is the whole claim of that decision. */
run(() => {
  const demo = document.querySelector("[data-demo-resolver]");
  if (!demo) return;
  const $ = (s) => demo.querySelector(s);
  const val = (name) => demo.querySelector("[name='" + name + "']:checked").value;
  const render = () => {
    const market = val("market");
    // 두 마켓의 플래그를 동시에 보여주고, 마켓 토글은 어느 쪽을 읽을지만 고른다
    // Both markets' flags stay visible; the market toggle only picks which one is read.
    const where = market === "CA" ? "Canada" : "US";
    const optedIn = val("preorder_" + market.toLowerCase()) === "true";
    const policy = val("policy"), n = +val("stock");
    const preorder = n === 0 && policy === "continue" && optedIn;
    $("[data-cta]").textContent = n > 0 ? "Add to cart" : preorder ? "Pre-order now" : "Sold out";
    $("[data-cta]").disabled = n === 0 && !preorder;
    $("[data-copy]").hidden = !preorder;
    $("[data-why]").textContent = n > 0
      ? n + " in stock, so the promise never comes up."
      : policy === "deny"
        ? "Selling past zero is turned off for this variant."
        : preorder
          ? "Pre-order in " + where + " is true, so the page can name a wait."
          : "Selling past zero is allowed, but pre-order in " + where + " is false.";
  };
  demo.addEventListener("change", render);
  render();
});

/* ── 6b. 데모 B: 스크롤 착시 토글 (02 §6 Scroll) ──
   같은 데이터가 보기에 따라 반대 결론이 된다는 것을 막대 높이로 보여준다. 퍼센트로 보면
   두 막대가 같은 높이라 "아무 일도 없었다"로 읽히고, 절대 거리로 바꾸면 리디자인이
   길어진다. 높이는 각 보기 안에서 큰 쪽을 100%로 정규화한 값이다 — 두 보기의 축이
   다르다는 게 논점이므로 공통 축을 쓰면 안 된다.
   The same data flips conclusion depending on the view. Heights are normalised
   within each view on purpose: the two views not sharing an axis is the point. */
run(() => {
  const demo = document.querySelector("[data-demo-scroll]");
  if (!demo) return;
  const VIEW = {
    pct: { old: [99.9, "37.74%"], new: [100, "37.76%"],
      note: "Scroll depth is a share of page length. Nothing appears to have changed." },
    abs: { old: [91.4, "baseline"], new: [100, "+9.4%"],
      note: "The redesigned page is 9.5% longer. The same share is more scrolling." },
  };
  const render = () => {
    const v = VIEW[demo.querySelector("[name='scrollview']:checked").value];
    ["old", "new"].forEach((k) => {
      demo.querySelector("[data-bar-" + k + "]").style.height = v[k][0] + "%";
      demo.querySelector("[data-val-" + k + "]").textContent = v[k][1];
    });
    demo.querySelector("[data-note]").textContent = v.note;
  };
  demo.addEventListener("change", render);
  render();
});

/* ── 6d. 데모 A′: 임팩트 카운터가 화면에 들어오면 센다 (02 Dec 03) ──
   최종값은 HTML 에 그대로 들어 있다. JS 가 없거나 모션을 줄이라고 했으면 그 숫자가 그냥
   보이고, 그게 맞는 값이다 — 세는 동작은 그 위에 얹을 뿐 값을 만들어내지 않는다.
   The final number lives in the HTML. Without JS, or with reduced motion, it simply shows
   and it is already correct; the counting is layered on top and never sources the value.
   라이브 블록과 같은 2000ms. 한 번 세고 나면 observer 를 끊는다 — 스크롤할 때마다
   0 으로 되돌아가면 값이 아니라 장식으로 읽힌다.
   Same 2000ms as the live block, and it runs once: resetting to zero on every scroll pass
   would make it read as decoration rather than as a number.
   2번 리빌과 달리 여기서는 IO 하나로 충분하다. 숨은 탭에서 콜백이 안 와도 최종값이 이미
   화면에 있기 때문이다 — 리빌은 콘텐츠를 숨겨 두고 IO 로 되돌리는 구조라 콜백이 없으면
   영영 안 보이지만, 이쪽은 콜백이 없으면 애니메이션만 없다.
   Unlike the reveal in 2, IO alone is enough here: a hidden tab delivers no callback, but
   the final value is already on screen. The reveal hides content and needs IO to undo that;
   this only ever adds motion on top of a number that is already correct. */
run(() => {
  const el = document.querySelector("[data-icount-value]");
  if (!el || reduce) return;
  const target = Number(el.textContent.replace(/,/g, ""));
  if (!Number.isFinite(target)) return;
  const fmt = (n) => n.toLocaleString("en-US");
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / 2000, 1);
      el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    el.textContent = fmt(0);
    requestAnimationFrame(tick);
  }, { threshold: 0.6 });
  io.observe(el);
});

/* ── 6e. 상품 카드 (02 Dec 01) — 색을 고르면 사진이 바뀌고, 비워진 모서리를 켤 수 있다 ──
   Product card: pick a colour to swap the photo, and optionally outline the vacated corner.

   사진 경로는 마크업의 data-photo 에 들어 있다 — 여기서 파일명을 만들지 않는다.
   기본 상태(첫 색 선택됨, 모서리 비어 있음)는 HTML 에 이미 들어 있으므로 JS 가 없으면
   카드는 그냥 그 상태로 보인다.
   The paths live on the markup; this never builds a filename. The default state ships in
   the HTML, so without JS the card simply shows as it is. */
run(() => {
  const demo = document.querySelector("[data-demo-card]");
  if (!demo) return;

  /* 카드가 둘(Before/After)이므로 전부 같은 규칙으로 돌린다 — 두 벌을 따로 쓰지 않는다.
     사진 경로는 마크업의 data-photo 에 들어 있고, 기본 상태(첫 색 선택됨)는 HTML 에 이미
     있으므로 JS 가 없으면 카드는 그냥 그 상태로 보인다.
     Two cards now, driven by one rule rather than a copy each. The paths live on the markup
     and the default state ships in the HTML, so without JS the cards simply show as they are. */
  demo.querySelectorAll(".pcard").forEach((card) => {
    const photo = card.querySelector("[data-card-photo]");
    const photoHover = card.querySelector("[data-card-photo-hover]");
    const swatches = [...card.querySelectorAll(".pcard__swatch")];

    const pick = (sw) => {
      photo.src = sw.dataset.photo;
      photoHover.src = sw.dataset.photoHover;   // 호버 사진도 그 색의 두 번째 컷으로 / hover shot follows the colour
      swatches.forEach((o) => {
        o.classList.toggle("is-active", o === sw);
        o.setAttribute("aria-pressed", String(o === sw));
      });
      // 라이브에서는 이 시점에 view=card 를 가져와 버튼 슬롯을 채운다 — 여기서는 상태 하나로 대신한다
      // The live page fills the button slot from a view=card fetch at exactly this point
      card.classList.add("is-picked");
      // Before 카드의 제목은 선택된 변형명을 뒤에 달고 있었다 / the Before title carried the variant name
      const vl = card.querySelector("[data-variant-label]");
      if (vl) vl.innerHTML = "&nbsp;&ndash;&nbsp;" + sw.getAttribute("aria-label");
    };
    // 라이브 트리거는 스워치의 mouseenter 다(클릭이 아니다). 클릭은 터치·키보드용으로 같이 둔다
    // The live trigger is mouseenter on the swatch; click is kept for touch and keyboard
    swatches.forEach((sw) => {
      sw.addEventListener("mouseenter", () => pick(sw));
      sw.addEventListener("click", () => pick(sw));
    });
  });
});

/* ── 6c. 히어로 영상: 모션을 줄이라고 했으면 재생하지 않는다 ──
   autoplay 는 CSS 로 못 끈다. 대신 컨트롤을 켜서 원하면 직접 볼 수 있게 남긴다.
   Autoplay cannot be disabled from CSS; hand the reader controls instead of motion. */
run(() => {
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll("video[autoplay]").forEach((v) => {
    v.autoplay = false;
    v.controls = !v.closest(".demo");   // 데모 배경 영상은 멈추기만 / a demo's background video just stops
    v.pause();
  });
});

/* ── 7. 케이스 페이지 섹션 가이드 ──
   IntersectionObserver 하나. rootMargin 이 핵심이다 — 기본값이면 섹션이 화면에
   들어오는 즉시 활성화돼서 스크롤 내내 목차가 깜빡인다. 위아래를 잘라 화면 중앙을
   지날 때만 전환시킨다. 스크롤 이벤트 + getBoundingClientRect 는 매 프레임 레이아웃을
   읽어 스크롤을 버벅이게 하므로 쓰지 않는다.
   One observer. The rootMargin is the whole trick: at its default a section goes
   active the moment it enters the viewport and the index flickers the entire way
   down, so the band is cropped to the middle of the screen. */
run(() => {
  const nav = document.querySelector(".toc");
  if (!nav) return;
  const links = [...nav.querySelectorAll("a")];
  const setActive = (id) => {
    const inDecision = id.indexOf("decision-") === 0;
    nav.classList.toggle("is-decisions", inDecision || id === "decisions");
    // 결정 안에 있어도 '현재 섹션'은 Decisions 다 / inside a decision the section is still Decisions
    const current = "#" + (inDecision ? "decisions" : id);
    links.forEach((a) => {
      a.classList.toggle("is-on", a.hash === "#" + id);
      if (a.hash === current) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  };
  const spy = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
    { rootMargin: "-40% 0px -55% 0px" }
  );
  links.forEach((a) => {
    const target = document.getElementById(a.hash.slice(1));
    if (target) spy.observe(target);
  });
  // 앵커로 바로 들어오면 그 섹션은 이미 관찰 밴드 위에 있어서 관찰자가 한 번도 발화하지
  // 않는다 — 목차가 아무것도 가리키지 않은 채로 남는다. 클릭도 같은 이유로 먼저 반영한다.
  // Arriving on an anchor lands the section above the band, so the observer never
  // fires and the index sits blank; a click has the same problem, so both lead.
  nav.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (link) setActive(link.hash.slice(1));
  });
  if (location.hash) setActive(location.hash.slice(1));
  // 관찰 밴드는 화면의 5% 라 점프·빠른 스크롤은 그걸 건너뛴다 — 스크롤이 멈추면 화면 45% 선 위의 마지막 섹션으로 맞춘다 (2026-11-21).
  // 멈출 때 한 번만 읽으므로 매 프레임 레이아웃을 읽는 문제는 없다.
  // The band is 5% of the screen, so a jump or a fast fling skips it; once scrolling stops, settle on the last
  // section above the 45% line. One read per stop, not per frame.
  const targets = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
  let settle;
  addEventListener("scroll", () => {
    clearTimeout(settle);
    settle = setTimeout(() => {
      const line = innerHeight * 0.45;
      let last = null;
      for (const t of targets) if (t.getBoundingClientRect().top < line) last = t;
      if (last) setActive(last.id);
    }, 150);
  }, { passive: true });
  // 히어로에서는 목차가 제목·스냅샷과 경쟁한다 — 첫 본문 섹션(h2)이 화면 위 60% 에 들어온 뒤에 들인다.
  // 예전 기준(h1 이 화면을 뜰 때)은 히어로 스냅샷이 아직 보이는 동안 목차를 켰다 (2026-11-18).
  // At the hero it competes with the title and snapshots; let it in once the first body
  // section (h2) reaches the top 60% of the screen. Keying it to the h1 leaving switched
  // it on while the hero snapshots were still in view.
  const body = document.querySelector(".prose h2[id]");
  if (body) {
    new IntersectionObserver(
      ([e]) => nav.classList.toggle("is-live", e.isIntersecting || e.boundingClientRect.top < 0),
      { rootMargin: "0px 0px -40% 0px" }
    ).observe(body);
  }
});

/* ── 8. 스크롤 진행 바 (1200px 미만에서 사이드바를 대신한다) ──
   scrollTop 하나만 읽는다 — 섹션 판정에 쓰는 레이아웃 측정과는 비용이 다르다.
   Reads scrollTop and nothing else; this is not the per-frame layout read that
   section detection must avoid. */
run(() => {
  const bar = document.querySelector(".progress span");
  if (!bar) return;
  const doc = document.documentElement;
  const draw = () => {
    const done = doc.scrollTop / (doc.scrollHeight - doc.clientHeight) || 0;
    bar.style.transform = "scaleX(" + done + ")";
  };
  addEventListener("scroll", draw, { passive: true });
  draw();
});

/* ── 6f0. 04 데모: 데스크톱과 폰을 나란히 — 마크업은 한 벌, 폰 프레임은 그 복제 ──
   렌즈·스케일·스크롤 핸들러보다 먼저 돌아야 복제본에도 붙는다.
   Desktop and phone side by side: one copy of the markup, the phone frame is its clone.
   Runs before the lens, scale and scroll blocks so the clone gets them too. */
run(() => {
  document.querySelectorAll(".demo__stage--devs .devcol").forEach((col) => {
    const phone = col.cloneNode(true);
    phone.querySelector(".dev").classList.remove("dev--desk");
    phone.querySelector(".devcol__name").textContent = "Phone";
    phone.querySelectorAll("[aria-label]").forEach((el) => el.setAttribute("aria-label", el.getAttribute("aria-label").replace(/desktop$/, "phone")));
    col.after(phone);
    if (!reduce) phone.querySelectorAll("video[autoplay]").forEach((v) => v.play().catch(() => {}));
  });
});

/* ── 6f. 04 Dec 02·03: 리퀴드 글래스 렌즈는 Chromium 에서만 ──
   테마와 같은 판정이다. url() 을 backdrop-filter 에 쓰면 다른 브라우저는 선언 전체(블러까지)를
   버리므로, 클래스가 붙은 곳에서만 렌즈 값을 쓴다.
   Same gate as the theme: elsewhere url() in backdrop-filter voids the whole declaration,
   blur included, so the lens values apply only where this class lands. */
run(() => {
  if (!(navigator.userAgentData && navigator.userAgentData.brands.some((b) => b.brand === "Chromium"))) return;
  document.querySelectorAll(".demo :is(.gl, .sb)").forEach((el) => el.classList.add("is-lens"));
});

/* ── 6f2. 05: 박스마다 곡면 림 — 테마 ver2 header.liquid 의 모듈 스크립트를 옮김 ──
   공용 박스 렌즈는 그라데이션 하나를 어떤 박스에든 늘려 써서 림이 납작한 띠다. 여기서는 박스마다 실제 px 크기로
   맵을 그려(스퀘어클 단면 + 스넬 법칙, 굴절률 1.5 — Aceternity UI 의 Liquid Glass 방식) 박스의 --gl-box-filter 로 건다.
   #LensBox[data-rim] 이 있는 페이지(05)에서만. 데모 박스는 바뀌지 않으니 테마의 MutationObserver 는 뺐다.
   Per-box curved rim, ported from the theme's ver2 header.liquid module script. Each box gets a map drawn at its own pixel size
   (Snell's law over a squircle profile, index 1.5 — Aceternity UI's Liquid Glass method), hung on the box as --gl-box-filter.
   Only on a page whose #LensBox carries data-rim (05). Demo boxes never re-render, so the theme's MutationObserver is left out. */
run(() => {
  const template = document.querySelector("#LensBox[data-rim]");
  const boxes = document.querySelectorAll(".demo .gl.is-lens .gl__box");
  if (!template || !boxes.length) return;

  const BEVEL = 14; // 림 폭(px) / rim width, px
  const GAIN = 1.35; // 림의 변위 배율 / displacement gain at the rim
  const SCALE = 44; // 박스 렌즈의 최대 채널 scale (40 + 4), 필터 여백용 / largest channel scale of the box lens, for the filter padding

  // 원점 중심 둥근 사각형까지의 부호 거리, 안쪽 < 0 / signed distance to a rounded box centred on the origin, < 0 inside
  const distance = (px, py, halfW, halfH, r) => {
    const qx = Math.abs(px) - halfW + r;
    const qy = Math.abs(py) - halfH + r;
    return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
  };

  // 깊이 x(0 림, 1 안쪽)에서 스퀘어클 돔의 굴절 / bend of a squircle dome at depth x (0 rim, 1 inside)
  const bend = (x) => {
    const u = 1 - Math.min(1, Math.max(0, x));
    const denom = (1 - u ** 4) ** 0.75;
    if (denom < 1e-6) return 0;
    const incident = Math.atan(Math.min(u ** 3 / denom, 8));
    return Math.sin(incident - Math.asin(Math.sin(incident) / 1.5));
  };

  // R = 가로, G = 세로 변위 (128 = 없음) / R = horizontal, G = vertical displacement (128 = none)
  const drawMap = (w, h, radius) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(w * dpr);
    const H = Math.round(h * dpr);
    const halfW = W / 2;
    const halfH = H / 2;
    const r = Math.min(radius * dpr, halfW, halfH);
    const n = Math.ceil(Math.max(1, Math.min(BEVEL * dpr, halfW, halfH)));
    const phi = new Float32Array(n + 1);
    for (let d = 1; d <= n; d++) phi[d] = phi[d - 1] + bend(d / n);

    const sd = new Float32Array(W * H);
    const field = new Float32Array(W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const d = (sd[i] = distance(x - halfW + 0.5, y - halfH + 0.5, halfW, halfH, r));
        const t = Math.min(n, -d);
        const k = Math.floor(t);
        field[i] = d > 0 ? 0 : k >= n ? phi[n] : phi[k] + (phi[k + 1] - phi[k]) * (t - k);
      }
    }

    const data = new Uint8ClampedArray(W * H * 4).fill(128);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (sd[i] > 0) { data[i * 4 + 3] = 0; continue; }
        const x0 = Math.max(0, x - 1);
        const x1 = Math.min(W - 1, x + 1);
        const y0 = Math.max(0, y - 1);
        const y1 = Math.min(H - 1, y + 1);
        // 림이 압축되되 겹쳐 접히지 않게 상한 / capped so the rim compresses but never folds over
        const dx = Math.max(-1, Math.min(1, ((field[y * W + x1] - field[y * W + x0]) / (x1 - x0 || 1)) * GAIN));
        const dy = Math.max(-1, Math.min(1, ((field[y1 * W + x] - field[y0 * W + x]) / (y1 - y0 || 1)) * GAIN));
        data[i * 4] = 128 + dx * 127;
        data[i * 4 + 1] = 128 + dy * 127;
        data[i * 4 + 3] = 255;
      }
    }
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    canvas.getContext("2d").putImageData(new ImageData(data, W, H), 0, 0);
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob && URL.createObjectURL(blob)), "image/png"));
  };

  // 공용 박스 렌즈의 복사본: 맵을 박스 px 에 고정하고, 휜 빛이 밖에서 올 수 있게 둘레에 여백
  // A copy of the shared box lens: the map pinned to the box's pixels, with room around it for the bend to reach outside
  const state = new Map(); // box -> { w, h, timer, token, filter, url }
  const build = async (box, s) => {
    const token = (s.token = (s.token || 0) + 1);
    const url = await drawMap(s.w, s.h, parseFloat(getComputedStyle(box).getPropertyValue("--gl-radius")) || 0);
    if (!url) return;
    // 필터를 걸기 전에 디코드 — 아니면 굴절 없이 깜빡임 / decode before the filter attaches, or the box flashes unrefracted
    await new Promise((resolve) => { const img = new Image(); img.onload = img.onerror = resolve; img.src = url; });
    if (token !== s.token) return URL.revokeObjectURL(url);
    const filter = template.cloneNode(true);
    filter.removeAttribute("data-rim");
    // 매번 새 id — Chromium 은 필터 결과를 id 로 캐시함 / a new id every time: Chromium caches filter output by id
    filter.id = `LensBox-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const padX = ((SCALE + 4) / s.w) * 100;
    const padY = ((SCALE + 4) / s.h) * 100;
    filter.setAttribute("x", `-${padX}%`);
    filter.setAttribute("y", `-${padY}%`);
    filter.setAttribute("width", `${100 + 2 * padX}%`);
    filter.setAttribute("height", `${100 + 2 * padY}%`);
    const map = filter.querySelector("feImage");
    map.setAttribute("href", url);
    map.setAttribute("x", 0);
    map.setAttribute("y", 0);
    map.setAttribute("width", s.w);
    map.setAttribute("height", s.h);
    template.parentNode.append(filter);
    box.style.setProperty("--gl-box-filter", `url(#${filter.id})`);
    s.filter?.remove();
    if (s.url) URL.revokeObjectURL(s.url);
    s.filter = filter;
    s.url = url;
  };

  // 크기가 멈추고 150ms 뒤 다시 그림 (닫힌 박스는 보고되지 않다가 열릴 때 그려짐) / rebuild 150ms after a box stops changing size (a closed box reports nothing until it opens)
  const resizes = new ResizeObserver((entries) => entries.forEach(({ target, borderBoxSize }) => {
    const s = state.get(target);
    const w = Math.round(borderBoxSize[0].inlineSize);
    const h = Math.round(borderBoxSize[0].blockSize);
    if (w <= 1 || h <= 1 || (w === s.w && h === s.h)) return;
    s.w = w;
    s.h = h;
    clearTimeout(s.timer);
    s.timer = setTimeout(() => build(target, s), 150);
  }));
  boxes.forEach((box) => { state.set(box, {}); resizes.observe(box); });
});

/* ── 6g. 04 Dec 04: 스크롤하면 스티키가 된다 — 테마 StickyHeader.onScroll 의 두 갈래 ──
   홈(투명 헤더)은 공지 바가 사라지는 지점(headerBounds.top)에서 붙고 200px 동안 0..1,
   상품 페이지(흰 헤더)는 헤더 바닥(headerBounds.bottom)에서 붙는다. 쓰는 값은 --p 와,
   붙기 전 헤더의 위치 --y 둘뿐이고 나머지는 전부 CSS calc() 다.
   The two branches of the theme's onScroll: the transparent homepage header sticks where the
   announcement bar ends and runs 0..1 over 200px; a solid product-page header sticks at its
   bottom edge. JS writes only --p and --y (where the header sits before it sticks). */
run(() => {
  const demo = document.querySelector("[data-demo-progress]");
  if (!demo) return;
  const ANN = 26;  // 공지 바 높이, 드래프트 실측 / announcement bar height, measured on the draft
  // 프레임(데스크톱·폰)마다 따로 스크롤하고 따로 계산한다 / each frame, desktop and phone, scrolls and computes on its own
  const frames = [...demo.querySelectorAll(".devcol")].map((col) => {
    const frame = col.querySelector(".sb");
    const scroller = col.querySelector("[data-sb-scroll]");
    const out = (k) => col.querySelector("[data-sb-" + k + "]");
    // 헤더 높이: 데스크톱 18 + 44 + 10 실측, 폰은 아이콘 행 34 / header height: desktop measured, phone with the 34px row
    const headerH = col.querySelector(".dev--desk") ? 72 : 62;
    const update = () => {
      const y = scroller.scrollTop;
      const home = demo.querySelector('[name="sb-page"][value="home"]').checked;
      // Before = 라이브 테마: enable_sticky_header 꺼짐 → 헤더가 페이지와 함께 스크롤되고 sticky ATC 없음
      // Before = the live theme: enable_sticky_header is off, so the header scrolls away and there is no sticky ATC
      const before = demo.querySelector('[name="sb-ver"][value="before"]').checked;
      const stuck = !before && y >= (home ? ANN : ANN + headerH);
      const p = before ? 0 : home ? Math.min(Math.max((y - ANN) / 200, 0), 1) : stuck ? 1 : 0;
      frame.style.setProperty("--p", p);
      frame.style.setProperty("--y", stuck ? 0 : ANN - y);
      frame.classList.toggle("is-stuck", stuck);
      // 상품 페이지: 메인 버튼이 프레임 위로 완전히 지나가면 sticky ATC (테마의 IntersectionObserver 조건)
      // Product page: the sticky ATC once the main button is fully above the frame (the theme's IO condition)
      const atc = col.querySelector("[data-sb-atc]");
      frame.classList.toggle("is-satc", !before && !home && atc.getBoundingClientRect().bottom < scroller.getBoundingClientRect().top);
      out("y").textContent = Math.round(y);
      out("on").textContent = stuck ? "on" : "off";
      out("value").textContent = home ? p.toFixed(2) : "n/a";
    };
    scroller.addEventListener("scroll", update, { passive: true });
    return { scroller, update };
  });
  // data-sb-start="atc" (05): 상품 페이지는 메인 ATC 와 결제 버튼 바로 아래까지 내려간 상태로 시작 — sticky ATC 가 처음부터 보인다.
  // 프레임이 축소돼 있으니 화면 px 을 배율로 나눠 스크롤 px 로 바꾼다
  // data-sb-start="atc" (05): the product page starts scrolled just past the main ATC and payment buttons, so the sticky ATC shows from
  // the start. The frame is scaled, so screen px are divided by the scale to get scroll px
  const startAtAtc = demo.dataset.sbStart === "atc";
  const start = (f) => {
    const pdp = demo.querySelector('[name="sb-page"][value="pdp"]').checked;
    let y = 0;
    if (startAtAtc && pdp) {
      const box = f.scroller.getBoundingClientRect();
      const scale = box.height / f.scroller.clientHeight || 1;
      // 결제 버튼 묶음(Shop Pay·More payment options)까지 지나서 — 바 위 틈으로 보라색 버튼이 비치지 않게
      // Past the payment group (Shop Pay, More payment options), so no purple button shows in the gap above the bar
      const end = f.scroller.querySelector(".pp__more").getBoundingClientRect();
      y = f.scroller.scrollTop + (end.bottom - box.top) / scale + 12;
    }
    f.scroller.scrollTop = 0;
    f.scroller.scrollTop = y;
    f.update();
  };
  demo.addEventListener("change", () => frames.forEach((f) => { f.scroller.scrollTop = 0; f.update(); start(f); }));
  frames.forEach(start);
  // 폰트·이미지가 늦게 와서 ATC 위치가 바뀔 수 있으니, 아직 아무도 스크롤하지 않았다면 load 후 한 번 더
  // Fonts and images can move the ATC after first paint, so redo it on load unless someone has scrolled already
  let touched = false;
  frames.forEach((f) => ["wheel", "touchstart", "keydown", "pointerdown"].forEach((e) => f.scroller.addEventListener(e, () => { touched = true; }, { passive: true, once: true })));
  if (startAtAtc) window.addEventListener("load", () => { if (!touched) frames.forEach(start); }, { once: true });
});

/* ── 6h. 04 Dec 06: 보틀 — 테마 블록의 launchBottle 그대로 ──
   속도는 px/초, 회전은 도/초라 주사율과 무관하게 같은 궤적이다. 동시 30개 상한, 키보드로
   누르면(detail 0) 숫자 가운데에서 출발. 병은 데모 안에 붙고 position: fixed 로 화면 기준이다.
   The theme block's launchBottle: time-based, 30 in flight at most, keyboard presses start
   from the centre of the number. Bottles live inside the demo and are fixed to the viewport. */
run(() => {
  const demo = document.querySelector("[data-demo-bottle]");
  if (!demo) return;
  const template = demo.querySelector("[data-bottle-template]");
  let flying = 0;
  demo.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-bottle-trigger]");
    if (!trigger || flying >= 30 || reduce) return;
    const rect = trigger.getBoundingClientRect();
    const x0 = event.detail ? event.clientX : rect.left + rect.width / 2;
    const y0 = event.detail ? event.clientY : rect.top + rect.height / 2;
    const vx = (Math.random() - 0.5) * 600;
    const vy = -(800 + Math.random() * 400);
    const spin = (Math.random() - 0.5) * 1440;
    const bottle = template.content.firstElementChild.cloneNode(true);
    demo.append(bottle);
    flying++;
    const t0 = performance.now();
    const step = (now) => {
      const t = (now - t0) / 1000;
      const y = y0 + vy * t + 1200 * t * t;   // 중력 2400px/s² 의 절반 / half of 2400px/s² gravity
      bottle.style.transform = `translate(${x0 + vx * t}px, ${y}px) translate(-50%, -50%) rotate(${spin * t}deg)`;
      if (y < innerHeight + 60) requestAnimationFrame(step);
      else { bottle.remove(); flying--; }
    };
    requestAnimationFrame(step);
  });
});

/* ── 6i. 04 데모: 데스크톱 프레임 = 1440px 캔버스를 래퍼 폭에 맞춰 축소 ──
   --s 하나만 쓴다. 폰 모드에선 쓰이지 않는다(스케일 없음).
   Desktop frames are a 1440px canvas scaled to the wrapper; this writes --s only. */
run(() => {
  const devs = document.querySelectorAll(".demo .dev");
  // 데스크톱 캔버스 1440, 폰 캔버스 360 / a 1440 canvas on desktop, 360 on a phone
  const fit = (el) => el.style.setProperty("--s", el.getBoundingClientRect().width / (el.classList.contains("dev--desk") ? 1440 : 360));
  // RO 가 주 경로지만 숨은 탭에선 콜백이 없으므로 로드·토글 때도 직접 잰다
  // RO is the main path, but a hidden tab delivers no callbacks, so measure on load and on toggles too
  const ro = new ResizeObserver((entries) => entries.forEach((e) => fit(e.target)));
  devs.forEach((el) => { ro.observe(el); fit(el); el.closest(".demo").addEventListener("change", () => fit(el)); });
});
