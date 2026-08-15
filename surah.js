const API = "https://api.alquran.cloud/v1";
const EVERY_AYAH = "https://everyayah.com/data";

const params = new URLSearchParams(window.location.search);
const surahNumber = Number(params.get("surah") || 1);


/* =========================================================
   ELEMENTS
========================================================= */

const title = document.getElementById("surahTitle");
const content = document.getElementById("quranContent");

const audioBar = document.getElementById("audioBar");

const playButton = document.getElementById("playButton");
const fullPlayButton = document.getElementById("fullPlayButton");

const previousButton =
  document.getElementById("previousAyahButton");

const nextButton =
  document.getElementById("nextAyahButton");

const fullPreviousButton =
  document.getElementById("fullPreviousButton");

const fullNextButton =
  document.getElementById("fullNextButton");

const seekBar =
  document.getElementById("seekBar");

const fullSeekBar =
  document.getElementById("fullSeekBar");

const currentTimeEl =
  document.getElementById("currentTime");

const remainingTimeEl =
  document.getElementById("remainingTime");

const fullCurrentTime =
  document.getElementById("fullCurrentTime");

const fullRemainingTime =
  document.getElementById("fullRemainingTime");

const audioTitle =
  document.getElementById("audioTitle");

const audioSubtitle =
  document.getElementById("audioSubtitle");

const fullPlayerTitle =
  document.getElementById("fullPlayerTitle");

const fullPlayerReciter =
  document.getElementById("fullPlayerReciter");

const playerSheet =
  document.getElementById("playerSheet");

const speedButton =
  document.getElementById("speedButton");

const speedLabel =
  document.getElementById("speedLabel");

const repeatButton =
  document.getElementById("repeatButton");

const fullRepeatButton =
  document.getElementById("fullRepeatButton");

const repeatLabel =
  document.getElementById("repeatLabel");

const reciterSelect =
  document.getElementById("reciterSelect");

const openPlayerButton =
  document.getElementById("openPlayerButton");

const openPlayerButton2 =
  document.getElementById("openPlayerButton2");

const closePlayerButton =
  document.getElementById("closePlayerButton");


/* =========================================================
   AUDIO
========================================================= */

const audio = new Audio();

audio.preload = "auto";


/* =========================================================
   STATE
========================================================= */

let surah = null;
let translation = null;

let currentAyahIndex = 0;

let playing = false;

let repeatAyah = false;

let playbackSpeed = 1;

let reciter = "Alafasy_128kbps";

let loadToken = 0;


/* =========================================================
   RECITERS
========================================================= */

const reciterNames = {

  "Alafasy_128kbps":
    "Mishary Rashid Alafasy",

  "Abdul_Basit_Murattal_192kbps":
    "Abdul Basit Abdul Samad",

  "Abdurrahmaan_As-Sudais_192kbps":
    "Abdul Rahman Al-Sudais",

  "Husary_128kbps":
    "Mahmoud Khalil Al-Husary",

  "Saood_ash-Shuraym_128kbps":
    "Saud Al-Shuraim",

  "Abu_Bakr_Ash-Shaatree_128kbps":
    "Abu Bakr Al-Shatri"

};


/* =========================================================
   BISMILLAH
========================================================= */

const BISMILLAH =
  "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";


/* =========================================================
   ARABIC NORMALIZATION
========================================================= */

function normalizeArabic(text) {

  return text
    .normalize("NFD")
    .replace(
      /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g,
      ""
    )
    .replace(/[إأٱآ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ")
    .trim();

}


/* =========================================================
   REMOVE BISMILLAH
========================================================= */

function removeBismillah(text) {

  if (!text) {
    return text;
  }

  const original = text.trim();

  const normalizedText =
    normalizeArabic(original);

  const normalizedBismillah =
    normalizeArabic(BISMILLAH);

  if (
    normalizedText.startsWith(
      normalizedBismillah
    )
  ) {

    let result = original;

    for (let i = 0; i < 4; i++) {

      result = result.trim();

      const match =
        result.match(/^\S+/);

      if (!match) {
        break;
      }

      result =
        result
          .slice(match[0].length)
          .trim();

    }

    return result;

  }

  return original;

}


/* =========================================================
   LOAD SURAH
========================================================= */

async function loadSurah() {

  try {

    const response =
      await fetch(
        `${API}/surah/${surahNumber}/editions/quran-uthmani,en.asad`
      );

    if (!response.ok) {
      throw new Error("Unable to load Surah");
    }

    const result =
      await response.json();

    surah =
      result.data[0];

    translation =
      result.data[1];


    surah.ayahs.forEach(
      ayah => {

        ayah.displayText =
          ayah.text;

      }
    );


    if (
      surah.number !== 1 &&
      surah.number !== 9 &&
      surah.ayahs.length
    ) {

      surah.ayahs[0].displayText =
        removeBismillah(
          surah.ayahs[0].text
        );

    }


    title.textContent =
      surah.englishName;

    audioTitle.textContent =
      surah.englishName;

    fullPlayerTitle.textContent =
      surah.englishName;


    renderSurah();

    setupAudio();

  } catch (error) {

    console.error(error);

    content.innerHTML = `

      <div class="py-16 text-center">

        <p class="font-semibold">
          Couldn't load Surah
        </p>

        <button
          onclick="loadSurah()"
          class="
            mt-5
            rounded-xl
            bg-emerald-500
            px-5
            py-3
            font-semibold
            text-slate-950
          "
        >
          Try Again
        </button>

      </div>

    `;

  }

}


/* =========================================================
   RENDER SURAH
========================================================= */

function renderSurah() {

  let html = `

    <section
      class="
        mb-8
        rounded-3xl
        bg-gradient-to-br
        from-emerald-600
        to-teal-800
        p-6
        text-center
      "
    >

      <p class="text-sm text-emerald-100">
        Surah ${surah.number}
      </p>

      <h2
        class="
          mt-2
          font-arabic
          text-4xl
          font-bold
        "
        dir="rtl"
      >
        ${surah.name}
      </h2>

      <h3 class="mt-3 text-xl font-bold">
        ${surah.englishName}
      </h3>

      <p class="mt-1 text-sm text-emerald-100">
        ${surah.englishNameTranslation}
      </p>

      <p class="mt-3 text-xs text-emerald-100">
        ${surah.numberOfAyahs} Ayahs
      </p>

    </section>

  `;


  if (
    surah.number !== 1 &&
    surah.number !== 9
  ) {

    html += `

      <div class="mb-8 overflow-hidden text-center">

        <p
          class="
            font-arabic
            text-3xl
            leading-loose
            text-slate-200
          "
          dir="rtl"
        >
          ${BISMILLAH}
        </p>

      </div>

    `;

  }


  html += `

    <div class="w-full space-y-5">

      ${surah.ayahs.map(
        (ayah, index) => {

          const translated =
            translation.ayahs[index];

          return `

            <article
              id="ayah-${ayah.numberInSurah}"
              data-ayah-index="${index}"
              class="
                ayah
                rounded-2xl
                p-4
              "
            >

              <div
                class="
                  mb-5
                  flex
                  items-center
                  justify-between
                "
              >

                <span
                  class="
                    grid
                    h-9
                    w-9
                    shrink-0
                    place-items-center
                    rounded-full
                    bg-emerald-500/10
                    text-xs
                    font-bold
                    text-emerald-400
                  "
                >
                  ${ayah.numberInSurah}
                </span>


                <button
                  type="button"
                  class="
                    ayah-play-button
                    rounded-full
                    border
                    border-white/10
                    p-2.5
                    text-slate-400
                  "
                  data-index="${index}"
                >

                  <i
                    data-lucide="play"
                    class="h-4 w-4"
                  ></i>

                </button>

              </div>


              <p
                class="
                  quran-arabic
                  font-arabic
                  text-right
                  text-[28px]
                  text-white
                "
                dir="rtl"
              >
                ${ayah.displayText}
              </p>


              <p
                class="
                  translation
                  mt-5
                  text-sm
                  leading-7
                  text-slate-400
                "
              >
                ${translated.text}
              </p>

            </article>

          `;

        }
      ).join("")}

    </div>

  `;


  content.innerHTML =
    html;


  /*
   * IMPORTANT:
   * Attach ayah buttons after
   * rendering them.
   */

  document
    .querySelectorAll(
      ".ayah-play-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.dataset.index
              );

            playFromAyah(
              index
            );

          }
        );

      }
    );


  lucide.createIcons();

}


/* =========================================================
   AUDIO URL
========================================================= */

function getAyahAudioUrl(index) {

  const ayah =
    surah.ayahs[index];

  if (!ayah) {
    return null;
  }

  const surahPart =
    String(
      surah.number
    ).padStart(
      3,
      "0"
    );

  const ayahPart =
    String(
      ayah.numberInSurah
    ).padStart(
      3,
      "0"
    );

  return (
    `${EVERY_AYAH}/` +
    `${reciter}/` +
    `${surahPart}${ayahPart}.mp3`
  );

}


/* =========================================================
   SETUP AUDIO
========================================================= */

function setupAudio() {

  audioBar.classList.remove(
    "hidden"
  );

  audio.playbackRate =
    playbackSpeed;


  audio.addEventListener(
    "loadedmetadata",
    updateTimes
  );

  audio.addEventListener(
    "timeupdate",
    updateTimes
  );


  audio.addEventListener(
    "play",
    () => {

      playing = true;

      updatePlayButtons();

    }
  );


  audio.addEventListener(
    "pause",
    () => {

      playing = false;

      updatePlayButtons();

    }
  );


  audio.addEventListener(
    "ended",
    handleAyahEnded
  );


  loadAyahAudio(
    currentAyahIndex,
    false
  );

}


/* =========================================================
   LOAD AYAH
========================================================= */

function loadAyahAudio(
  index,
  autoPlay = false
) {

  if (!surah) {
    return;
  }

  const ayah =
    surah.ayahs[index];

  if (!ayah) {
    return;
  }


  currentAyahIndex =
    index;


  const token =
    ++loadToken;


  highlightAyah(
    index
  );


  const url =
    getAyahAudioUrl(
      index
    );


  audio.pause();

  audio.src =
    url;

  audio.load();


  audio.playbackRate =
    playbackSpeed;


  if (autoPlay) {

    const playWhenReady =
      () => {

        if (
          token !==
          loadToken
        ) {
          return;
        }

        audio
          .play()
          .catch(
            error =>
              console.error(
                error
              )
          );

      };


    audio.addEventListener(
      "canplay",
      playWhenReady,
      {
        once: true
      }
    );

  }

}


/* =========================================================
   PLAY FROM AYAH
========================================================= */

function playFromAyah(index) {

  loadAyahAudio(
    index,
    true
  );

}


/* =========================================================
   AYAH END
========================================================= */

function handleAyahEnded() {

  if (
    repeatAyah
  ) {

    audio.currentTime =
      0;

    audio
      .play()
      .catch(
        console.error
      );

    return;

  }


  const next =
    currentAyahIndex + 1;


  if (
    next >=
    surah.ayahs.length
  ) {

    playing = false;

    updatePlayButtons();

    return;

  }


  loadAyahAudio(
    next,
    true
  );

}


/* =========================================================
   PLAY / PAUSE
========================================================= */

async function togglePlay() {

  if (!surah) {
    return;
  }


  if (
    audio.paused
  ) {

    try {

      await audio.play();

    } catch (error) {

      console.error(error);

    }

  } else {

    audio.pause();

  }

}


playButton.addEventListener(
  "click",
  togglePlay
);

fullPlayButton.addEventListener(
  "click",
  togglePlay
);


/* =========================================================
   NEXT
========================================================= */

function nextAyah() {

  const next =
    currentAyahIndex + 1;

  if (
    next >=
    surah.ayahs.length
  ) {
    return;
  }

  loadAyahAudio(
    next,
    playing
  );

}


nextButton.addEventListener(
  "click",
  nextAyah
);

fullNextButton.addEventListener(
  "click",
  nextAyah
);


/* =========================================================
   PREVIOUS
========================================================= */

function previousAyah() {

  if (
    audio.currentTime > 3
  ) {

    audio.currentTime =
      0;

    return;

  }


  const previous =
    currentAyahIndex - 1;


  if (
    previous < 0
  ) {

    audio.currentTime =
      0;

    return;

  }


  loadAyahAudio(
    previous,
    playing
  );

}


previousButton.addEventListener(
  "click",
  previousAyah
);

fullPreviousButton.addEventListener(
  "click",
  previousAyah
);


/* =========================================================
   SEEK
========================================================= */

function seek(value) {

  if (
    !audio.duration ||
    !isFinite(audio.duration)
  ) {
    return;
  }

  audio.currentTime =
    (
      Number(value) /
      100
    ) *
    audio.duration;

}


seekBar.addEventListener(
  "input",
  event =>
    seek(
      event.target.value
    )
);


fullSeekBar.addEventListener(
  "input",
  event =>
    seek(
      event.target.value
    )
);


/* =========================================================
   TIMES
========================================================= */

function updateTimes() {

  if (
    !audio.duration ||
    !isFinite(audio.duration)
  ) {
    return;
  }


  const percent =
    (
      audio.currentTime /
      audio.duration
    ) * 100;


  seekBar.value =
    percent;

  fullSeekBar.value =
    percent;


  const current =
    formatTime(
      audio.currentTime
    );


  const remaining =
    formatTime(
      Math.max(
        0,
        audio.duration -
        audio.currentTime
      )
    );


  currentTimeEl.textContent =
    current;

  fullCurrentTime.textContent =
    current;

  remainingTimeEl.textContent =
    `-${remaining}`;

  fullRemainingTime.textContent =
    `-${remaining}`;

}


/* =========================================================
   HIGHLIGHT
========================================================= */

function highlightAyah(index) {

  document
    .querySelectorAll(
      ".ayah"
    )
    .forEach(
      element => {

        element.classList.remove(
          "active"
        );

      }
    );


  const ayah =
    surah.ayahs[index];

  if (!ayah) {
    return;
  }


  const element =
    document.getElementById(
      `ayah-${ayah.numberInSurah}`
    );


  if (!element) {
    return;
  }


  element.classList.add(
    "active"
  );


  if (playing) {

    element.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  }

}


/* =========================================================
   REPEAT AYAH
========================================================= */

function updateRepeatUI() {

  repeatLabel.textContent =
    repeatAyah
      ? "Ayah"
      : "Off";


  repeatButton.classList.toggle(
    "text-emerald-400",
    repeatAyah
  );


  fullRepeatButton.classList.toggle(
    "border-emerald-500",
    repeatAyah
  );


  fullRepeatButton.classList.toggle(
    "bg-emerald-500/10",
    repeatAyah
  );

}


function toggleRepeat(
  event
) {

  /*
   * Prevent the button from
   * accidentally opening another
   * player control.
   */

  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }


  repeatAyah =
    !repeatAyah;


  updateRepeatUI();

}


repeatButton.addEventListener(
  "click",
  toggleRepeat
);

fullRepeatButton.addEventListener(
  "click",
  toggleRepeat
);


/*
 * Extra touch support for Android.
 */

repeatButton.addEventListener(
  "touchend",
  event => {

    event.preventDefault();

    toggleRepeat(
      event
    );

  },
  {
    passive: false
  }
);


fullRepeatButton.addEventListener(
  "touchend",
  event => {

    event.preventDefault();

    toggleRepeat(
      event
    );

  },
  {
    passive: false
  }
);


/* =========================================================
   SPEED
========================================================= */

const speeds = [
  0.75,
  1,
  1.25,
  1.5,
  2
];


function changeSpeed(
  event
) {

  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }


  const current =
    speeds.indexOf(
      playbackSpeed
    );


  const next =
    (
      current + 1
    ) %
    speeds.length;


  playbackSpeed =
    speeds[next];


  audio.playbackRate =
    playbackSpeed;


  speedLabel.textContent =
    `${playbackSpeed}×`;

}


speedButton.addEventListener(
  "click",
  changeSpeed
);


speedButton.addEventListener(
  "touchend",
  event => {

    event.preventDefault();

    changeSpeed(
      event
    );

  },
  {
    passive: false
  }
);


/* =========================================================
   RECITER
========================================================= */

function changeReciter() {

  const selected =
    reciterSelect.value;


  if (!selected) {
    return;
  }


  reciter =
    selected;


  const name =
    reciterNames[
      reciter
    ] ||
    "Quran Reciter";


  audioSubtitle.textContent =
    name;


  fullPlayerReciter.textContent =
    name;


  /*
   * Remember the selected reciter.
   */

  try {

    localStorage.setItem(
      "quran_reciter",
      reciter
    );

  } catch (error) {

    console.warn(
      "Could not save reciter",
      error
    );

  }


  /*
   * Keep the same ayah.
   */

  const wasPlaying =
    playing;


  loadAyahAudio(
    currentAyahIndex,
    wasPlaying
  );

}


reciterSelect.addEventListener(
  "change",
  changeReciter
);


/*
 * Some Android browsers don't fire
 * change until the select closes.
 *
 * Input gives us an additional
 * reliable event.
 */

reciterSelect.addEventListener(
  "input",
  changeReciter
);


/* =========================================================
   LOAD SAVED RECITER
========================================================= */

function loadSavedReciter() {

  try {

    const saved =
      localStorage.getItem(
        "quran_reciter"
      );


    if (
      saved &&
      reciterNames[saved]
    ) {

      reciter =
        saved;

      reciterSelect.value =
        saved;

    }

  } catch (error) {

    console.warn(
      "Could not load saved reciter"
    );

  }


  const name =
    reciterNames[
      reciter
    ];


  audioSubtitle.textContent =
    name;

  fullPlayerReciter.textContent =
    name;

}


/* =========================================================
   PLAYER OPEN
========================================================= */

function openPlayer(
  event
) {

  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }


  playerSheet.classList.remove(
    "hidden"
  );


  requestAnimationFrame(
    () => {

      playerSheet.classList.add(
        "open"
      );

    }
  );

}


function closePlayer(
  event
) {

  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }


  playerSheet.classList.remove(
    "open"
  );


  setTimeout(
    () => {

      playerSheet.classList.add(
        "hidden"
      );

    },
    250
  );

}


openPlayerButton.addEventListener(
  "click",
  openPlayer
);


openPlayerButton2.addEventListener(
  "click",
  openPlayer
);


closePlayerButton.addEventListener(
  "click",
  closePlayer
);


/* =========================================================
   PLAY ICON
========================================================= */

function updatePlayButtons() {

  const icon =
    playing
      ? "pause"
      : "play";


  playButton.innerHTML = `

    <i
      data-lucide="${icon}"
      class="
        h-5
        w-5
        ${playing ? "" : "fill-current"}
      "
    ></i>

  `;


  fullPlayButton.innerHTML = `

    <i
      data-lucide="${icon}"
      class="
        h-7
        w-7
        ${playing ? "" : "fill-current"}
      "
    ></i>

  `;


  lucide.createIcons();

}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(seconds) {

  if (
    !seconds ||
    !isFinite(seconds)
  ) {
    return "0:00";
  }


  const minutes =
    Math.floor(
      seconds / 60
    );


  const remaining =
    Math.floor(
      seconds % 60
    );


  return (
    `${minutes}:` +
    `${String(
      remaining
    ).padStart(
      2,
      "0"
    )}`
  );

}


/* =========================================================
   START
========================================================= */

loadSavedReciter();

loadSurah();
