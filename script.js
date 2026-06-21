const weddingDate = new Date("2026-08-28T16:40:00+03:00");

const app = document.getElementById("inviteApp");
const slides = Array.from(document.querySelectorAll(".slide"));
const dots = document.getElementById("slideDots");

let currentSlide = 0;
let isLocked = false;
let touchStartY = 0;
let touchStartX = 0;

function createDots() {
  slides.forEach((slide, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Перейти к слайду ${index + 1}`);
    dot.addEventListener("click", () => goToSlide(index));
    dots.appendChild(dot);
  });
}

function updateSlideState() {
  slides.forEach((slide, index) => {
    const isActive = index === currentSlide;
    slide.classList.toggle("is-active", isActive);
    slide.classList.toggle("is-prev", index === currentSlide - 1);
    slide.classList.toggle("is-next", index === currentSlide + 1);
    slide.classList.toggle("is-before", index < currentSlide - 1);
    slide.classList.toggle("is-after", index > currentSlide + 1);
    slide.setAttribute("aria-hidden", String(!isActive));
  });

  Array.from(dots.children).forEach((dot, index) => {
    dot.classList.toggle("is-active", index === currentSlide);
    dot.setAttribute("aria-current", index === currentSlide ? "true" : "false");
  });
}

function goToSlide(index) {
  const nextIndex = Math.max(0, Math.min(index, slides.length - 1));

  if (nextIndex === currentSlide || isLocked) {
    return;
  }

  const directionClass = nextIndex > currentSlide ? "is-turning-down" : "is-turning-up";
  app.classList.remove("is-turning-down", "is-turning-up");
  app.classList.add("is-turning", directionClass);
  currentSlide = nextIndex;
  updateSlideState();

  isLocked = true;
  window.setTimeout(() => {
    isLocked = false;
    app.classList.remove("is-turning", "is-turning-down", "is-turning-up");
  }, 1050);
}

function goNext() {
  goToSlide(currentSlide + 1);
}

function goPrev() {
  goToSlide(currentSlide - 1);
}

function setupSliderControls() {
  document.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", goNext);
  });

  app.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();

      if (Math.abs(event.deltaY) < 14) {
        return;
      }

      if (event.deltaY > 0) {
        goNext();
      } else {
        goPrev();
      }
    },
    { passive: false },
  );

  app.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches[0];
      touchStartY = touch.clientY;
      touchStartX = touch.clientX;
    },
    { passive: true },
  );

  app.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
    },
    { passive: false },
  );

  app.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches[0];
      const deltaY = touchStartY - touch.clientY;
      const deltaX = touchStartX - touch.clientX;

      if (Math.abs(deltaY) < 48 || Math.abs(deltaY) < Math.abs(deltaX)) {
        return;
      }

      if (deltaY > 0) {
        goNext();
      } else {
        goPrev();
      }
    },
    { passive: true },
  );

  window.addEventListener("keydown", (event) => {
    if (["ArrowDown", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      goNext();
    }

    if (["ArrowUp", "PageUp"].includes(event.key)) {
      event.preventDefault();
      goPrev();
    }
  });
}

function setupPerspectiveTilt() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const targetTilt = { x: 0, y: 0 };
  const currentTilt = { x: 0, y: 0 };
  let animationFrame = 0;
  let orientationStarted = false;
  let permissionRequested = false;
  let baseGamma = null;
  let baseBeta = null;
  let lastOrientationAt = 0;

  if (reducedMotion.matches) {
    return;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function applyTilt(x, y) {
    app.style.setProperty("--tilt-x", `${(-y * 1.7).toFixed(2)}deg`);
    app.style.setProperty("--tilt-y", `${(x * 2.2).toFixed(2)}deg`);
    app.style.setProperty("--tilt-scene-x", `${(-y * 0.85).toFixed(2)}deg`);
    app.style.setProperty("--tilt-scene-y", `${(x * 1.05).toFixed(2)}deg`);
    app.style.setProperty("--tilt-card-x", `${(-y * 3.5).toFixed(2)}deg`);
    app.style.setProperty("--tilt-card-y", `${(x * 4.6).toFixed(2)}deg`);
    app.style.setProperty("--tilt-layer-x", `${(x * 6).toFixed(2)}px`);
    app.style.setProperty("--tilt-layer-y", `${(y * 5).toFixed(2)}px`);
    app.style.setProperty("--tilt-ui-x", `${(x * 2.6).toFixed(2)}px`);
    app.style.setProperty("--tilt-ui-y", `${(y * 2.2).toFixed(2)}px`);
    app.style.setProperty("--tilt-ui-z", `${(12 + Math.abs(x) * 8 + Math.abs(y) * 6).toFixed(2)}px`);
    app.style.setProperty("--tilt-control-x", `${(x * 5).toFixed(2)}px`);
    app.style.setProperty("--tilt-control-y", `${(y * 4).toFixed(2)}px`);
    app.style.setProperty("--tilt-bg-x", `${(-x * 18).toFixed(2)}px`);
    app.style.setProperty("--tilt-bg-y", `${(-y * 14).toFixed(2)}px`);
    app.style.setProperty("--tilt-photo-x", `${(-x * 12).toFixed(2)}px`);
    app.style.setProperty("--tilt-photo-y", `${(-y * 10).toFixed(2)}px`);
    app.style.setProperty("--tilt-grid-x", `${(x * 16).toFixed(2)}px`);
    app.style.setProperty("--tilt-grid-y", `${(y * 16).toFixed(2)}px`);
    app.style.setProperty("--tilt-spark-x", `${(x * 24).toFixed(2)}px`);
    app.style.setProperty("--tilt-glow-x", `${(50 + x * 24).toFixed(2)}%`);
    app.style.setProperty("--tilt-glow-y", `${(16 + y * 20).toFixed(2)}%`);
  }

  function animateTilt() {
    currentTilt.x += (targetTilt.x - currentTilt.x) * 0.14;
    currentTilt.y += (targetTilt.y - currentTilt.y) * 0.14;
    applyTilt(currentTilt.x, currentTilt.y);

    if (
      Math.abs(targetTilt.x - currentTilt.x) > 0.002 ||
      Math.abs(targetTilt.y - currentTilt.y) > 0.002
    ) {
      animationFrame = window.requestAnimationFrame(animateTilt);
      return;
    }

    animationFrame = 0;
  }

  function setTilt(x, y) {
    targetTilt.x = clamp(x, -1, 1);
    targetTilt.y = clamp(y, -1, 1);

    if (!animationFrame) {
      animationFrame = window.requestAnimationFrame(animateTilt);
    }
  }

  function resetTilt() {
    setTilt(0, 0);
  }

  function handleDeviceOrientation(event) {
    if (!Number.isFinite(event.gamma) || !Number.isFinite(event.beta)) {
      return;
    }

    if (baseGamma === null || baseBeta === null) {
      baseGamma = event.gamma;
      baseBeta = event.beta;
    }

    lastOrientationAt = Date.now();
    setTilt((event.gamma - baseGamma) / 18, (event.beta - baseBeta) / 22);
  }

  function connectDeviceTilt() {
    if (orientationStarted || !("DeviceOrientationEvent" in window)) {
      return;
    }

    orientationStarted = true;
    window.addEventListener("deviceorientation", handleDeviceOrientation, true);
  }

  async function requestDeviceTilt() {
    if (!("DeviceOrientationEvent" in window)) {
      return;
    }

    const orientationEvent = window.DeviceOrientationEvent;

    if (typeof orientationEvent.requestPermission !== "function") {
      connectDeviceTilt();
      return;
    }

    if (permissionRequested) {
      return;
    }

    try {
      permissionRequested = true;
      const state = await orientationEvent.requestPermission();

      if (state === "granted") {
        connectDeviceTilt();
      }
    } catch (error) {
      permissionRequested = false;
      resetTilt();
    }
  }

  app.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    if (Date.now() - lastOrientationAt < 1000) {
      return;
    }

    const rect = app.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    setTilt(x * 2, y * 2);
  });

  app.addEventListener("pointerleave", resetTilt);
  window.addEventListener("blur", resetTilt);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      baseGamma = null;
      baseBeta = null;
      resetTilt();
    }
  });

  document.addEventListener("click", requestDeviceTilt, { capture: true, once: true });
  document.addEventListener("touchend", requestDeviceTilt, { capture: true, once: true, passive: true });

  if (
    !("DeviceOrientationEvent" in window) ||
    typeof window.DeviceOrientationEvent.requestPermission !== "function"
  ) {
    connectDeviceTilt();
  }
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  const diff = weddingDate.getTime() - Date.now();
  const dayMessage = document.getElementById("dayMessage");

  if (diff <= 0) {
    setTimerValue("days", "0");
    setTimerValue("hours", "00");
    setTimerValue("minutes", "00");
    setTimerValue("seconds", "00");
    dayMessage.hidden = false;
    return;
  }

  const secondsTotal = Math.floor(diff / 1000);
  const days = Math.floor(secondsTotal / 86400);
  const hours = Math.floor((secondsTotal % 86400) / 3600);
  const minutes = Math.floor((secondsTotal % 3600) / 60);
  const seconds = secondsTotal % 60;

  setTimerValue("days", days);
  setTimerValue("hours", padNumber(hours));
  setTimerValue("minutes", padNumber(minutes));
  setTimerValue("seconds", padNumber(seconds));
  dayMessage.hidden = true;
}

function setTimerValue(name, value) {
  const element = document.querySelector(`[data-time="${name}"]`);
  if (element) {
    element.textContent = value;
  }
}

const storySteps = [
  {
    image: "images/story-21.jpg",
    position: "50% 52%",
    title: "Ключ 1",
    text: "На высоте, где город кажется тише, спрятан первый ответ: мы уже смотрели в одну сторону.",
    alt: "Алексей и Лияна в Крыму с собакой",
  },
  {
    image: "images/story-01.jpg",
    position: "50% 34%",
    title: "Ключ 2",
    text: "У каждого была своя карта: привычки, победы, дороги и тишина. Но две разные карты иногда ведут к одной двери.",
    alt: "Алексей на солнечном отдыхе",
  },
  {
    image: "images/story-06.jpg",
    position: "50% 42%",
    title: "Ключ 3",
    text: "Она несла в себе море, ветер и характер. Узнать её можно было по свету, который не просит разрешения сиять.",
    alt: "Лияна у моря",
  },
  {
    image: "images/story-02.jpg",
    position: "50% 30%",
    title: "Ключ 4",
    text: "Он умел идти дальше, когда финиш ещё молчал. Так появляются люди, которые держат слово даже на длинной дистанции.",
    alt: "Алексей на забеге",
  },
  {
    image: "images/story-08.jpg",
    position: "50% 44%",
    title: "Ключ 5",
    text: "Она появлялась там, где день становился ярче. Улыбка была подсказкой: счастье бывает смелым и очень живым.",
    alt: "Лияна на празднике спорта",
  },
  {
    image: "images/story-03.jpg",
    position: "50% 39%",
    title: "Ключ 6",
    text: "Бывают полосы препятствий, где проверяют не скорость, а сердце. Он проходил их и становился крепче.",
    alt: "Алексей на гонке героев",
  },
  {
    image: "images/story-09.jpg",
    position: "50% 43%",
    title: "Ключ 7",
    text: "Бывали города, солнце и кадры на память. Но настоящая загадка была не в местах, а в том, кого захочется ждать рядом.",
    alt: "Лияна в путешествии",
  },
  {
    image: "images/story-04.jpg",
    position: "50% 31%",
    title: "Ключ 8",
    text: "Зима спросила: хватит ли тепла? Ответ оказался простым: радость не боится холода, если внутри горит победа.",
    alt: "Алексей с медалью",
  },
  {
    image: "images/story-05.jpg",
    position: "58% 4%",
    title: "Ключ 9",
    text: "Потом появились маленькие хранители дома, смешные привычки и забота, которую невозможно сыграть.",
    alt: "Алексей с собакой",
  },
  {
    image: "images/story-12.jpg",
    position: "50% 44%",
    title: "Ключ 10",
    text: "Высота подсказала: чем шире горизонт, тем важнее рука рядом. Так дорога перестаёт быть одиночной.",
    alt: "Лияна в горах",
  },
  {
    image: "images/story-16.jpg",
    position: "50% 45%",
    title: "Ключ 11",
    text: "Даже обычная поездка стала знаком: семья начинается там, где спокойно ехать вместе в любую сторону.",
    alt: "Алексей за рулём с собакой",
  },
  {
    image: "images/story-17.jpg",
    position: "30% 50%",
    title: "Ключ 12",
    text: "Солнце, тёплый взгляд и объятия без лишних слов. Иногда ответ на загадку написан прямо на лице.",
    alt: "Лияна с собакой на солнце",
  },
  {
    image: "images/story-18.jpg",
    position: "48% 42%",
    title: "Ключ 13",
    text: "Когда рядом любовь, даже случайный кадр выглядит как добрая примета: мир будто тихо ставит печать «верно».",
    alt: "Алексей с собакой и совой",
  },
  {
    image: "images/story-19.jpg",
    position: "50% 50%",
    title: "Ключ 14",
    text: "Вода молчала, лес слушал, а мы поняли: есть места, где время останавливается ради двоих.",
    alt: "Алексей и Лияна у озера",
  },
  {
    image: "images/story-20.jpg",
    position: "53% 55%",
    title: "Ключ 15",
    text: "Близкие люди, цветы и улыбки открыли последнюю подсказку: наша история больше, чем мы вдвоём.",
    alt: "Алексей и Лияна с близкими людьми",
  },
  {
    image: "images/story-14.jpg",
    position: "50% 47%",
    title: "Ключ 16",
    text: "Финальный ответ прост: быть рядом не кадром, не обещанием на день, а настоящей семьёй.",
    alt: "Алексей и Лияна вместе",
  },
];

let storyIndex = 0;

function setupStory() {
  const storyAlbum = document.querySelector(".story-album");
  const storyPhotoFrame = document.querySelector(".story-photo-frame");
  const storyImage = document.getElementById("storyImage");
  const storyKicker = document.getElementById("storyKicker");
  const storyCounter = document.getElementById("storyCounter");
  const storyText = document.getElementById("storyText");
  const storyButton = document.getElementById("storyButton");
  const storyContinueButton = document.getElementById("storyContinueButton");
  const storyProgress = document.getElementById("storyProgress");
  let storyDragStartX = 0;
  let storyDragStartY = 0;
  let isStoryDragging = false;

  storyImage.draggable = false;

  storySteps.forEach((step, index) => {
    const preload = new Image();
    preload.src = step.image;

    const dot = document.createElement("span");
    dot.classList.toggle("is-active", index === 0);
    storyProgress.appendChild(dot);
  });

  function renderStoryStep(withMotion = true) {
    const step = storySteps[storyIndex];

    if (!withMotion) {
      storyImage.src = step.image;
      storyImage.alt = step.alt;
      storyPhotoFrame.style.setProperty("--story-image", `url("${step.image}")`);
      storyPhotoFrame.style.setProperty("--story-position", step.position);
      storyKicker.textContent = step.title;
      storyText.textContent = step.text;
      storyCounter.textContent = `${padNumber(storyIndex + 1)} / ${storySteps.length}`;
      updateStoryControls();
      return;
    }

    storyAlbum.classList.add("is-changing");
    storyText.style.opacity = "0";
    storyText.style.transform = "translateY(8px)";
    storyKicker.style.opacity = "0";

    window.setTimeout(() => {
      storyImage.src = step.image;
      storyImage.alt = step.alt;
      storyPhotoFrame.style.setProperty("--story-image", `url("${step.image}")`);
      storyPhotoFrame.style.setProperty("--story-position", step.position);
      storyKicker.textContent = step.title;
      storyText.textContent = step.text;
      storyCounter.textContent = `${padNumber(storyIndex + 1)} / ${storySteps.length}`;
      storyText.style.opacity = "1";
      storyText.style.transform = "translateY(0)";
      storyKicker.style.opacity = "1";
      storyAlbum.classList.remove("is-changing");
      updateStoryControls();
    }, 220);
  }

  function updateStoryControls() {
    const isLastStep = storyIndex === storySteps.length - 1;
    storyButton.textContent = isLastStep ? "К первому ключу" : "Следующий ключ";
    storyContinueButton.hidden = !isLastStep;

    Array.from(storyProgress.children).forEach((dot, index) => {
      dot.classList.toggle("is-active", index === storyIndex);
    });
  }

  function goToStoryStep(direction) {
    if (storyAlbum.classList.contains("is-changing")) {
      return;
    }

    storyIndex = (storyIndex + direction + storySteps.length) % storySteps.length;
    renderStoryStep();
  }

  function handleStorySwipe(deltaX, deltaY) {
    const swipeThreshold = 44;

    if (Math.abs(deltaX) < swipeThreshold || Math.abs(deltaX) < Math.abs(deltaY) * 1.15) {
      return false;
    }

    goToStoryStep(deltaX < 0 ? 1 : -1);
    return true;
  }

  storyAlbum.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    storyDragStartX = event.clientX;
    storyDragStartY = event.clientY;
    isStoryDragging = true;
    storyAlbum.classList.add("is-dragging");

    try {
      storyAlbum.setPointerCapture(event.pointerId);
    } catch (error) {
      // Pointer capture is optional; swiping still works without it.
    }
  });

  storyAlbum.addEventListener("pointerup", (event) => {
    if (!isStoryDragging) {
      return;
    }

    const deltaX = event.clientX - storyDragStartX;
    const deltaY = event.clientY - storyDragStartY;
    isStoryDragging = false;
    storyAlbum.classList.remove("is-dragging");

    if (handleStorySwipe(deltaX, deltaY)) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      storyAlbum.releasePointerCapture(event.pointerId);
    } catch (error) {
      // The pointer may already be released by the browser.
    }
  });

  storyAlbum.addEventListener("pointercancel", () => {
    isStoryDragging = false;
    storyAlbum.classList.remove("is-dragging");
  });

  storyButton.addEventListener("click", () => {
    goToStoryStep(1);
  });

  storyContinueButton.addEventListener("click", goNext);

  window.addEventListener("keydown", (event) => {
    if (!slides[currentSlide]?.classList.contains("slide--story")) {
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToStoryStep(1);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToStoryStep(-1);
    }
  });

  renderStoryStep(false);
}

function setupCalendarButton() {
  const calendarButton = document.getElementById("calendarButton");

  if (!calendarButton) {
    return;
  }

  calendarButton.addEventListener("click", () => {
    const eventTitle = "Главный ответ Алексея и Лияны";
    const eventLocation =
      "Городской дворец бракосочетания, ул. Советская, 47, Тула, Тульская обл.";
    const eventDescription =
      "День, когда два пути станут одной семьёй. Алексей и Лияна ждут вас рядом.";
    const calendarContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Kulpiny Wedding Invitation//RU",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:kulpiny-wedding-20260828T164000@invitation.local",
      "DTSTAMP:20260621T000000Z",
      "DTSTART;TZID=Europe/Moscow:20260828T164000",
      "DTEND;TZID=Europe/Moscow:20260828T174000",
      `SUMMARY:${escapeCalendarText(eventTitle)}`,
      `LOCATION:${escapeCalendarText(eventLocation)}`,
      `DESCRIPTION:${escapeCalendarText(eventDescription)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([calendarContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "wedding-alexey-liyana.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

function escapeCalendarText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function setupBackgroundMusic() {
  const music = document.getElementById("bgMusic");
  const toggle = document.getElementById("musicToggle");

  if (!music || !toggle) {
    return;
  }

  let userPaused = false;
  let isTryingToPlay = false;
  const enoughDataState = 3;
  const musicStartOffset = 5;
  let isMusicLoading = music.readyState < enoughDataState;

  music.autoplay = true;
  music.loop = false;
  music.preload = "auto";
  music.volume = 0.42;

  function seekPastIntro() {
    if (!Number.isFinite(music.duration) || music.duration <= musicStartOffset + 1) {
      return;
    }

    if (music.currentTime < musicStartOffset || music.ended) {
      try {
        music.currentTime = musicStartOffset;
      } catch (error) {
        window.setTimeout(seekPastIntro, 250);
      }
    }
  }

  function updateMusicButton() {
    const isPlaying = !music.paused && !music.muted;
    const isLoading =
      isTryingToPlay ||
      isMusicLoading ||
      (!music.error && !userPaused && music.readyState < enoughDataState);

    toggle.classList.toggle("is-playing", isPlaying);
    toggle.classList.toggle("is-loading", isLoading);
    toggle.setAttribute("aria-pressed", String(isPlaying));
    toggle.setAttribute(
      "aria-label",
      isLoading
        ? "Музыка загружается"
        : isPlaying
          ? "Выключить музыку"
          : "Включить музыку",
    );
    toggle.setAttribute("aria-busy", String(isLoading));
  }

  function setMusicLoading(value) {
    isMusicLoading = value;
    updateMusicButton();
  }

  async function playMusic() {
    if (isTryingToPlay || userPaused) {
      return;
    }

    isTryingToPlay = true;
    setMusicLoading(music.readyState < enoughDataState);
    music.muted = false;

    try {
      seekPastIntro();
      await music.play();
    } catch (error) {
      updateMusicButton();
    } finally {
      isTryingToPlay = false;
      updateMusicButton();
    }
  }

  function pauseMusic() {
    userPaused = true;
    setMusicLoading(false);
    music.pause();
    updateMusicButton();
  }

  function unlockMusic() {
    playMusic();
  }

  function requestAutoplay() {
    if (!userPaused) {
      playMusic();
    }
  }

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();

    if (music.paused || music.muted) {
      userPaused = false;
      playMusic();
      return;
    }

    pauseMusic();
  });

  music.addEventListener("loadstart", () => setMusicLoading(true));
  music.addEventListener("loadedmetadata", seekPastIntro);
  music.addEventListener("loadeddata", () => {
    setMusicLoading(false);
    seekPastIntro();
    requestAutoplay();
  });
  music.addEventListener("canplay", () => {
    setMusicLoading(false);
    seekPastIntro();
    requestAutoplay();
  });
  music.addEventListener("canplaythrough", () => {
    setMusicLoading(false);
    requestAutoplay();
  });
  music.addEventListener("waiting", () => setMusicLoading(true));
  music.addEventListener("stalled", () => setMusicLoading(true));
  music.addEventListener("playing", () => setMusicLoading(false));
  music.addEventListener("error", () => setMusicLoading(false));
  music.addEventListener("play", updateMusicButton);
  music.addEventListener("pause", updateMusicButton);
  music.addEventListener("volumechange", updateMusicButton);
  music.addEventListener("ended", () => {
    if (!userPaused) {
      seekPastIntro();
      playMusic();
    }
  });
  document.addEventListener("click", unlockMusic, { capture: true, once: true });
  document.addEventListener("touchend", unlockMusic, { capture: true, once: true, passive: true });
  window.addEventListener("load", requestAutoplay, { once: true });
  window.addEventListener("pageshow", requestAutoplay);
  window.addEventListener("focus", requestAutoplay);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      requestAutoplay();
    }
  });

  music.load();
  requestAutoplay();
  window.requestAnimationFrame(requestAutoplay);
  [120, 500, 1200, 2400].forEach((delay) => {
    window.setTimeout(requestAutoplay, delay);
  });
  updateMusicButton();
}

createDots();
setupSliderControls();
setupPerspectiveTilt();
setupStory();
setupCalendarButton();
setupBackgroundMusic();
updateSlideState();
updateCountdown();
window.setInterval(updateCountdown, 1000);
