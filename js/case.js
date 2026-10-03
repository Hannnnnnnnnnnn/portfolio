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
    v.controls = true;
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
  // 히어로에서는 목차가 제목과 나란히 서서 경쟁한다 — 제목이 화면을 뜬 뒤에 들인다
  // At the hero it stands level with the H1 and competes; let it in once the
  // title has left the screen
  const hero = document.querySelector(".prose h1");
  if (hero) {
    new IntersectionObserver(
      ([e]) => nav.classList.toggle("is-live", !e.isIntersecting),
      { rootMargin: "-64px 0px 0px 0px" }
    ).observe(hero);
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

