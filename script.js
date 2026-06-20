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
    app.style.setProperty("--tilt-x", `${(-y * 3.2).toFixed(2)}deg`);
    app.style.setProperty("--tilt-y", `${(x * 4.4).toFixed(2)}deg`);
    app.style.setProperty("--tilt-layer-x", `${(x * 8).toFixed(2)}px`);
    app.style.setProperty("--tilt-layer-y", `${(y * 7).toFixed(2)}px`);
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
    image: "images/story-01.jpg",
    position: "50% 34%",
    title: "Глава 1",
    text: "Когда-то каждый из нас шёл своей дорогой, собирал воспоминания, характер и свои маленькие победы.",
    alt: "Алексей на солнечном отдыхе",
  },
  {
    image: "images/story-06.jpg",
    position: "50% 42%",
    title: "Глава 2",
    text: "Лияна тоже шла своим путём: с ветром, морем, характером и внутренним светом.",
    alt: "Лияна у моря",
  },
  {
    image: "images/story-02.jpg",
    position: "50% 30%",
    title: "Глава 3",
    text: "Алексей всегда умел двигаться вперёд. Даже когда дистанция большая, а финиш ещё далеко.",
    alt: "Алексей на забеге",
  },
  {
    image: "images/story-08.jpg",
    position: "50% 44%",
    title: "Глава 4",
    text: "Лияна умела появляться там, где сразу становилось ярче, легче и веселее.",
    alt: "Лияна на празднике спорта",
  },
  {
    image: "images/story-03.jpg",
    position: "50% 39%",
    title: "Глава 5",
    text: "Были испытания, новые старты, дороги, которые проверяли силу и терпение.",
    alt: "Алексей на гонке героев",
  },
  {
    image: "images/story-09.jpg",
    position: "50% 43%",
    title: "Глава 6",
    text: "Были путешествия, солнце, красивые места и кадры, которые хочется пересматривать.",
    alt: "Лияна в путешествии",
  },
  {
    image: "images/story-04.jpg",
    position: "50% 31%",
    title: "Глава 7",
    text: "Даже зима не мешала радоваться победам. Иногда счастье выглядит как медаль и красная форма.",
    alt: "Алексей с медалью",
  },
  {
    image: "images/story-07.jpg",
    position: "50% 45%",
    title: "Глава 8",
    text: "Иногда история будто ждала подходящей сцены, света и момента, чтобы всё красиво началось.",
    alt: "Лияна в интерьере",
  },
  {
    image: "images/story-05.jpg",
    position: "58% 4%",
    title: "Глава 9",
    text: "Потом в кадрах стало больше домашнего тепла, заботы и тех самых деталей, из которых строится близость.",
    alt: "Алексей с собакой",
  },
  {
    image: "images/story-12.jpg",
    position: "50% 44%",
    title: "Глава 10",
    text: "Были дороги повыше, виды пошире и чувство, что впереди ещё столько общего.",
    alt: "Лияна в горах",
  },
  {
    image: "images/story-16.jpg",
    position: "50% 45%",
    title: "Глава 11",
    text: "Появились дороги, где даже обычная поездка становилась маленьким семейным приключением.",
    alt: "Алексей за рулём с собакой",
  },
  {
    image: "images/story-17.jpg",
    position: "30% 50%",
    title: "Глава 12",
    text: "Появилось больше нежности в простых моментах: солнце, объятия и тот самый взгляд, в котором всё понятно.",
    alt: "Лияна с собакой на солнце",
  },
  {
    image: "images/story-18.jpg",
    position: "48% 42%",
    title: "Глава 13",
    text: "Иногда семейные кадры становятся почти сказочными: рядом любимые, а на плече будто знак доброй удачи.",
    alt: "Алексей с собакой и совой",
  },
  {
    image: "images/story-19.jpg",
    position: "50% 50%",
    title: "Глава 14",
    text: "Были места, где хотелось остановить время: вода, лес, тишина и мы вдвоём.",
    alt: "Алексей и Лияна у озера",
  },
  {
    image: "images/story-20.jpg",
    position: "53% 55%",
    title: "Глава 15",
    text: "Были важные люди рядом, цветы, улыбки и чувство, что наша история становится больше нас двоих.",
    alt: "Алексей и Лияна с близкими людьми",
  },
  {
    image: "images/story-21.jpg",
    position: "50% 52%",
    title: "Глава 16",
    text: "Были высоты, на которых особенно ясно понимаешь: дальше хочется смотреть в одну сторону.",
    alt: "Алексей и Лияна в горах с собакой",
  },
  {
    image: "images/story-14.jpg",
    position: "50% 47%",
    title: "Глава 17",
    text: "А теперь мы выбираем быть рядом не только в кадре. Мы выбираем стать семьёй.",
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
    storyButton.textContent = isLastStep ? "Сначала" : "Следующий кадр";
    storyContinueButton.hidden = !isLastStep;

    Array.from(storyProgress.children).forEach((dot, index) => {
      dot.classList.toggle("is-active", index === storyIndex);
    });
  }

  storyButton.addEventListener("click", () => {
    storyIndex = (storyIndex + 1) % storySteps.length;
    renderStoryStep();
  });

  storyContinueButton.addEventListener("click", goNext);

  renderStoryStep(false);
}

function setupCalendarButton() {
  const calendarButton = document.getElementById("calendarButton");

  if (!calendarButton) {
    return;
  }

  calendarButton.addEventListener("click", () => {
    const eventTitle = "Свадьба Алексея и Лияны";
    const eventLocation =
      "Городской дворец бракосочетания, ул. Советская, 47, Тула, Тульская обл.";
    const eventDescription =
      "Свадебная роспись Алексея и Лияны. Будущая семья Кульпины.";
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

function setupRsvpForm() {
  const form = document.getElementById("rsvpForm");
  const message = document.getElementById("formMessage");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = {
      guestName: formData.get("guestName"),
      attendance: formData.get("attendance"),
      comment: formData.get("comment"),
      submittedAt: new Date().toISOString(),
    };

    localStorage.setItem("wedding-rsvp", JSON.stringify(payload));
    await sendGuestReply(payload);

    message.textContent = "Спасибо! Ваш ответ сохранён.";
    form.reset();
    form.querySelector('input[name="attendance"][value="Приду"]').checked = true;
  });
}

async function sendGuestReply(payload) {
  // Здесь позже можно подключить Telegram-бота, Google Таблицу или Битрикс24.
  // Например: return fetch("ВАШ_WEBHOOK_URL", { method: "POST", body: JSON.stringify(payload) });
  return payload;
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
  let isMusicLoading = music.readyState < enoughDataState;

  music.volume = 0.42;

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
  music.addEventListener("loadeddata", () => setMusicLoading(false));
  music.addEventListener("canplay", () => setMusicLoading(false));
  music.addEventListener("canplaythrough", () => setMusicLoading(false));
  music.addEventListener("waiting", () => setMusicLoading(true));
  music.addEventListener("stalled", () => setMusicLoading(true));
  music.addEventListener("playing", () => setMusicLoading(false));
  music.addEventListener("error", () => setMusicLoading(false));
  music.addEventListener("play", updateMusicButton);
  music.addEventListener("pause", updateMusicButton);
  music.addEventListener("volumechange", updateMusicButton);
  document.addEventListener("click", unlockMusic, { capture: true, once: true });
  document.addEventListener("touchend", unlockMusic, { capture: true, once: true, passive: true });

  window.setTimeout(playMusic, 250);
  updateMusicButton();
}

createDots();
setupSliderControls();
setupPerspectiveTilt();
setupStory();
setupCalendarButton();
setupRsvpForm();
setupBackgroundMusic();
updateSlideState();
updateCountdown();
window.setInterval(updateCountdown, 1000);
