const API = "https://api.alquran.cloud/v1";

const AUDIO_BASE = "https://everyayah.com/data";

const params = new URLSearchParams(window.location.search);

const surahNumber = Number(params.get("surah") || 1);


/* =========================================================
   ELEMENTS
========================================================= */

const content = document.getElementById("quranContent");
const surahTitle = document.getElementById("surahTitle");

const audioBar = document.getElementById("audioBar");
const audioTitle = document.getElementById("audioTitle");
const audioSubtitle = document.getElementById("audioSubtitle");

const playButton = document.getElementById("playButton");
const fullPlayButton = document.getElementById("fullPlayButton");

const previousButton = document.getElementById("previousAyahButton");
const nextButton = document.getElementById("nextAyahButton");

const fullPreviousButton = document.getElementById("fullPreviousButton");
const fullNextButton = document.getElementById("fullNextButton");

const seekBar = document.getElementById("seekBar");
const currentTime = document.getElementById("currentTime");
const remainingTime = document.getElementById("remainingTime");

const speedButton = document.getElementById("speedButton");
const speedLabel = document.getElementById("speedLabel");

const repeatButton = document.getElementById("repeatButton");
const repeatLabel = document.getElementById("repeatLabel");

const reciterSelect = document.getElementById("reciterSelect");

const playerSheet = document.getElementById("playerSheet");
const playerOverlay = document.getElementById("playerOverlay");

const fullDisc = document.getElementById("fullDisc");
const miniDisc = document.getElementById("miniDisc");

const miniProgress = document.getElementById("miniProgress");

const currentAyahLabel =
  document.getElementById("currentAyahLabel");

const fullPlayerTitle =
  document.getElementById("fullPlayerTitle");

const fullPlayerReciter =
  document.getElementById("fullPlayerReciter");


/* =========================================================
   SINGLE AUDIO PLAYER
========================================================= */

const audio = document.createElement("audio");

audio.preload = "auto";

audio.setAttribute("playsinline", "");

document.body.appendChild(audio);


/* =========================================================
   STATE
========================================================= */

let surah = null;

let translation = null;

let currentAyahIndex = 0;

let playing = false;

let repeatSurah = false;

let playbackSpeed = 1;

let reciter =
  localStorage.getItem("quran_reciter") ||
  "Alafasy_128kbps";

let changingAyah = false;

let userRequestedPlay = false;

let surahDurations = [];

let audioGeneration = 0;


/* =========================================================
   RECITERS
========================================================= */

const reciters = {

  Alafasy_128kbps:
    "Mishary Rashid Alafasy",

  Abdul_Basit_Murattal_192kbps:
    "Abdul Basit Abdul Samad",

  Abdurrahmaan_As-Sudais_192kbps:
    "Abdul Rahman Al-Sudais",

  Husary_128kbps:
    "Mahmoud Khalil Al-Husary",

  Saood_ash-Shuraym_128kbps:
    "Saud Al-Shuraim",

  Abu_Bakr_Ash-Shaatree_128kbps:
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
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ")
    .trim();

}


/* =========================================================
   REMOVE BISMILLAH FROM FIRST AYAH
========================================================= */

function removeBismillah(text) {

  if (!text) {
    return "";
  }

  const words = text.trim().split(/\s+/);

  if (words.length < 4) {
    return text;
  }

  const firstFour =
    words.slice(0, 4).join(" ");

  const normalized =
    normalizeArabic(firstFour);

  const normalizedBismillah =
    normalizeArabic(BISMILLAH);

  if (
    normalized === normalizedBismillah ||
    normalized.startsWith(normalizedBismillah)
  ) {

    return words
      .slice(4)
      .join(" ")
      .trim();

  }

  return text;

}


/* =========================================================
   TIME
========================================================= */

function formatTime(seconds) {

  if (
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    return "0:00";
  }

  const minutes =
    Math.floor(seconds / 60);

  const secs =
    Math.floor(seconds % 60);

  return (
    minutes +
    ":" +
    String(secs).padStart(2, "0")
  );

}


/* =========================================================
   AUDIO URL
========================================================= */

function getAudioUrl(index) {

  if (
    !surah ||
    !surah.ayahs[index]
  ) {
    return null;
  }

  const ayah =
    surah.ayahs[index];

  const surahPart =
    String(surah.number).padStart(3, "0");

  const ayahPart =
    String(ayah.numberInSurah).padStart(3, "0");

  return (
    AUDIO_BASE +
    "/" +
    reciter +
    "/" +
    surahPart +
    ayahPart +
    ".mp3"
  );

}


/* =========================================================
   LOAD SURAH
========================================================= */

async function loadSurah() {

  try {

    if (
      !Number.isInteger(surahNumber) ||
      surahNumber < 1 ||
      surahNumber > 114
    ) {
      throw new Error("Invalid Surah number.");
    }

    const response =
      await fetch(
        `${API}/surah/${surahNumber}/quran-uthmani`,
        {
          cache: "no-cache"
        }
      );

    if (!response.ok) {
      throw new Error(
        "HTTP " + response.status
      );
    }

    const result =
      await response.json();

    if (
      result.code !== 200 ||
      !result.data
    ) {
      throw new Error(
        "Quran data unavailable."
      );
    }

    surah = result.data;


    surah.ayahs.forEach(
      ayah => {

        ayah.displayText =
          ayah.text;

      }
    );


    /*
     * Only remove Bismillah from the
     * actual first ayah on Surahs where
     * it is included by the API.
     */

    if (
      surah.number !== 1 &&
      surah.number !== 9 &&
      surah.ayahs.length > 0
    ) {

      surah.ayahs[0].displayText =
        removeBismillah(
          surah.ayahs[0].text
        );

    }


    renderSurah();

    updateTitles();

    audioBar.classList.remove("hidden");

    loadTranslation();

    prepareCurrentAyah();

  } catch (error) {

    console.error(error);

    content.innerHTML = `

      <div class="py-20 text-center">

        <div
          class="
            mx-auto
            grid
            h-16
            w-16
            place-items-center
            rounded-full
            bg-red-500/10
            text-red-400
          "
        >

          <i
            data-lucide="wifi-off"
            class="h-7 w-7"
          ></i>

        </div>

        <h2 class="mt-5 text-lg font-bold">
          Couldn't load the Quran
        </h2>

        <p class="mt-2 text-sm text-slate-400">
          Check your internet connection and try again.
        </p>

        <button
          id="retryButton"
          class="
            mt-6
            rounded-xl
            bg-emerald-500
            px-6
            py-3
            font-semibold
            text-slate-950
          "
        >
          Try Again
        </button>

      </div>
    `;

    lucide.createIcons();

    document
      .getElementById("retryButton")
      ?.addEventListener(
        "click",
        loadSurah
      );

  }

}


/* =========================================================
   RENDER SURAH
========================================================= */

function renderSurah() {

  let html = `

    <section
      class="
        mb-7
        rounded-3xl
        bg-gradient-to-br
        from-emerald-700
        to-teal-800
        p-6
        text-center
      "
    >

      <p
        class="
          text-xs
          uppercase
          tracking-widest
          text-emerald-100
        "
      >
        Surah ${surah.number}
      </p>

      <h2
        dir="rtl"
        class="
          mt-2
          font-arabic
          text-4xl
          font-bold
        "
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


  /*
   * Bismillah is displayed separately.
   */

  if (
    surah.number !== 1 &&
    surah.number !== 9
  ) {

    html += `

      <div class="mb-8 text-center">

        <p
          dir="rtl"
          class="
            font-arabic
            text-3xl
            leading-loose
            text-slate-200
          "
        >
          ${BISMILLAH}
        </p>

      </div>

    `;

  }


  html += `
    <div class="space-y-3">
  `;


  surah.ayahs.forEach(
    (ayah, index) => {

      html += `

        <article
          id="ayah-${ayah.numberInSurah}"
          data-index="${index}"
          class="ayah rounded-2xl p-4"
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
              class="
                ayahPlayButton
                grid
                h-9
                w-9
                place-items-center
                rounded-full
                bg-white/5
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
            dir="rtl"
            class="quran-arabic text-white"
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
            data-translation-index="${index}"
          ></p>

        </article>

      `;

    }
  );


  html += `</div>`;


  content.innerHTML = html;


  document
    .querySelectorAll(".ayahPlayButton")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(button.dataset.index);

          playAyah(index);

        }
      );

    });


  lucide.createIcons();

}


/* =========================================================
   TRANSLATION
========================================================= */

async function loadTranslation() {

  try {

    const response =
      await fetch(
        `${API}/surah/${surahNumber}/en.sahih`,
        {
          cache: "no-cache"
        }
      );

    if (!response.ok) {
      return;
    }

    const result =
      await response.json();

    if (
      result.code !== 200 ||
      !result.data
    ) {
      return;
    }

    translation =
      result.data;

    document
      .querySelectorAll(
        "[data-translation-index]"
      )
      .forEach(element => {

        const index =
          Number(
            element.dataset.translationIndex
          );

        const item =
          translation.ayahs[index];

        if (item) {
          element.textContent =
            item.text;
        }

      });

  } catch (error) {

    console.warn(
      "Translation unavailable",
      error
    );

  }

}


/* =========================================================
   TITLES
========================================================= */

function updateTitles() {

  if (!surah) {
    return;
  }

  const name =
    reciters[reciter] ||
    "Mishary Rashid Alafasy";

  surahTitle.textContent =
    surah.englishName;

  audioTitle.textContent =
    surah.englishName;

  audioSubtitle.textContent =
    name;

  fullPlayerTitle.textContent =
    surah.englishName;

  fullPlayerReciter.textContent =
    name;

}


/* =========================================================
   PREPARE CURRENT AYAH
========================================================= */

function prepareCurrentAyah() {

  const url =
    getAudioUrl(
      currentAyahIndex
    );

  if (!url) {
    return;
  }

  audio.pause();

  audio.src = url;

  audio.playbackRate =
    playbackSpeed;

  audio.load();

  updateAyahUI();

}


/* =========================================================
   PLAY AYAH
========================================================= */

async function playAyah(index) {

  if (!surah) {
    return;
  }

  if (
    index < 0 ||
    index >= surah.ayahs.length
  ) {
    return;
  }


  audioGeneration++;


  currentAyahIndex =
    index;


  changingAyah = true;


  audio.pause();


  const url =
    getAudioUrl(index);


  audio.src = url;

  audio.playbackRate =
    playbackSpeed;


  updateAyahUI();


  try {

    await waitForAudioReady();


    await audio.play();

    playing = true;

    userRequestedPlay = true;

    updatePlayUI();

    updateVinyl();

  } catch (error) {

    console.error(
      "Could not play ayah:",
      error
    );

    playing = false;

    updatePlayUI();

    updateVinyl();

  }


  changingAyah = false;

}


/* =========================================================
   WAIT FOR AUDIO READY
========================================================= */

function waitForAudioReady() {

  return new Promise(
    (resolve, reject) => {

      if (
        audio.readyState >= 3
      ) {

        resolve();

        return;

      }


      const timeout =
        setTimeout(
          () => {

            cleanup();

            reject(
              new Error(
                "Audio loading timed out."
              )
            );

          },
          15000
        );


      function cleanup() {

        clearTimeout(timeout);

        audio.removeEventListener(
          "canplay",
          ready
        );

        audio.removeEventListener(
          "error",
          failed
        );

      }


      function ready() {

        cleanup();

        resolve();

      }


      function failed() {

        cleanup();

        reject(
          new Error(
            "Audio failed to load."
          )
        );

      }


      audio.addEventListener(
        "canplay",
        ready
      );

      audio.addEventListener(
        "error",
        failed
      );

    }
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

      if (
        !audio.src
      ) {

        prepareCurrentAyah();

      }


      await waitForAudioReady();

      await audio.play();

      playing = true;

      userRequestedPlay = true;

      updatePlayUI();

      updateVinyl();

    } catch (error) {

      console.error(
        "Play failed:",
        error
      );

    }

  } else {

    audio.pause();

    playing = false;

    updatePlayUI();

    updateVinyl();

  }

}


/* =========================================================
   CRITICAL PART:
   AUTOMATICALLY MOVE TO NEXT AYAH
========================================================= */

audio.addEventListener(
  "ended",
  async () => {

    /*
     * Ignore this event if we are manually
     * changing ayahs.
     */

    if (changingAyah) {
      return;
    }


    const nextIndex =
      currentAyahIndex + 1;


    /*
     * SURAH FINISHED
     */

    if (
      nextIndex >=
      surah.ayahs.length
    ) {

      if (repeatSurah) {

        /*
         * Restart the entire Surah.
         */

        currentAyahIndex = 0;

        await playAyah(0);

        return;

      }


      /*
       * No repeat:
       * completely stop.
       */

      playing = false;

      userRequestedPlay = false;

      updatePlayUI();

      updateVinyl();

      updateAyahUI();

      return;

    }


    /*
     * Continue directly to the next ayah.
     */

    await playAyah(
      nextIndex
    );

  }
);


/* =========================================================
   PLAY EVENT
========================================================= */

audio.addEventListener(
  "play",
  () => {

    playing = true;

    updatePlayUI();

    updateVinyl();

  }
);


/* =========================================================
   PAUSE EVENT
========================================================= */

audio.addEventListener(
  "pause",
  () => {

    /*
     * Don't allow an internal source
     * change to falsely turn playback off.
     */

    if (
      !changingAyah &&
      !audio.ended
    ) {

      playing = false;

      updatePlayUI();

      updateVinyl();

    }

  }
);


/* =========================================================
   TIME UPDATE
========================================================= */

audio.addEventListener(
  "timeupdate",
  () => {

    updateProgress();

  }
);


/* =========================================================
   METADATA
========================================================= */

audio.addEventListener(
  "loadedmetadata",
  () => {

    if (
      Number.isFinite(
        audio.duration
      )
    ) {

      surahDurations[
        currentAyahIndex
      ] =
        audio.duration;

    }

    updateProgress();

  }
);


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

  if (!surah) {
    return;
  }


  let before = 0;


  for (
    let i = 0;
    i < currentAyahIndex;
    i++
  ) {

    if (
      Number.isFinite(
        surahDurations[i]
      )
    ) {

      before +=
        surahDurations[i];

    }

  }


  const current =
    Number.isFinite(
      audio.currentTime
    )
      ? audio.currentTime
      : 0;


  let knownTotal = 0;


  surahDurations.forEach(
    duration => {

      if (
        Number.isFinite(
          duration
        )
      ) {

        knownTotal +=
          duration;

      }

    }
  );


  const total =
    knownTotal > 0
      ? knownTotal
      : Math.max(
          before +
          (
            Number.isFinite(
              audio.duration
            )
              ? audio.duration
              : 0
          ),
          1
        );


  const position =
    before + current;


  const percent =
    Math.min(
      100,
      Math.max(
        0,
        (
          position /
          total
        ) *
        100
      )
    );


  seekBar.value =
    percent;

  miniProgress.style.width =
    percent + "%";


  currentTime.textContent =
    formatTime(position);


  remainingTime.textContent =
    "-" +
    formatTime(
      Math.max(
        0,
        total - position
      )
    );

}


/* =========================================================
   SEEK
========================================================= */

seekBar.addEventListener(
  "input",
  () => {

    if (!surah) {
      return;
    }


    const total =
      surahDurations.reduce(
        (sum, value) => {

          return (
            sum +
            (
              Number.isFinite(value)
                ? value
                : 0
            )
          );

        },
        0
      );


    if (total <= 0) {
      return;
    }


    const target =
      (
        Number(
          seekBar.value
        ) /
        100
      ) *
      total;


    let accumulated = 0;

    let targetIndex = 0;


    for (
      let i = 0;
      i < surah.ayahs.length;
      i++
    ) {

      const duration =
        surahDurations[i] || 0;


      if (
        target <=
        accumulated + duration
      ) {

        targetIndex = i;

        break;

      }


      accumulated += duration;

      targetIndex = i;

    }


    const offset =
      Math.max(
        0,
        target - accumulated
      );


    const shouldPlay =
      !audio.paused;


    playAyah(
      targetIndex
    ).then(
      () => {

        if (
          Number.isFinite(
            audio.duration
          )
        ) {

          audio.currentTime =
            Math.min(
              offset,
              audio.duration
            );

        }


        if (!shouldPlay) {

          audio.pause();

          playing = false;

          updatePlayUI();

          updateVinyl();

        }

      }
    );

  }
);


/* =========================================================
   NEXT
========================================================= */

function nextAyah() {

  if (!surah) {
    return;
  }


  const next =
    currentAyahIndex + 1;


  if (
    next <
    surah.ayahs.length
  ) {

    playAyah(next);

  }

}


/* =========================================================
   PREVIOUS
========================================================= */

function previousAyah() {

  if (!surah) {
    return;
  }


  if (
    audio.currentTime > 3
  ) {

    audio.currentTime = 0;

    return;

  }


  const previous =
    currentAyahIndex - 1;


  if (
    previous >= 0
  ) {

    playAyah(previous);

  }

}


/* =========================================================
   AYAH HIGHLIGHT
========================================================= */

function updateAyahUI() {

  document
    .querySelectorAll(".ayah")
    .forEach(
      element => {

        element.classList.remove(
          "active"
        );

      }
    );


  if (!surah) {
    return;
  }


  const ayah =
    surah.ayahs[
      currentAyahIndex
    ];


  if (!ayah) {
    return;
  }


  const element =
    document.getElementById(
      "ayah-" +
      ayah.numberInSurah
    );


  if (!element) {
    return;
  }


  element.classList.add(
    "active"
  );


  currentAyahLabel.textContent =
    `Ayah ${ayah.numberInSurah} of ${surah.numberOfAyahs}`;


  if (playing) {

    element.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  }

}


/* =========================================================
   PLAY UI
========================================================= */

function updatePlayUI() {

  const icon =
    playing
      ? "pause"
      : "play";


  playButton.innerHTML = `

    <i
      data-lucide="${icon}"
      class="h-5 w-5"
    ></i>

  `;


  fullPlayButton.innerHTML = `

    <i
      data-lucide="${icon}"
      class="h-7 w-7"
    ></i>

  `;


  lucide.createIcons();

}


/* =========================================================
   VINYL
========================================================= */

function updateVinyl() {

  miniDisc.classList.toggle(
    "spinning",
    playing
  );

  fullDisc.classList.toggle(
    "spinning",
    playing
  );

}


/* =========================================================
   REPEAT WHOLE SURAH
========================================================= */

function toggleRepeat() {

  repeatSurah =
    !repeatSurah;


  repeatButton.classList.toggle(
    "text-emerald-400",
    repeatSurah
  );


  repeatButton.classList.toggle(
    "border-emerald-400",
    repeatSurah
  );


  repeatLabel.textContent =
    repeatSurah
      ? "Repeat Surah on"
      : "Repeat off";

}


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


function changeSpeed() {

  const index =
    speeds.indexOf(
      playbackSpeed
    );


  playbackSpeed =
    speeds[
      (
        index + 1
      ) %
      speeds.length
    ];


  audio.playbackRate =
    playbackSpeed;


  speedLabel.textContent =
    playbackSpeed + "×";

}


/* =========================================================
   RECITER
========================================================= */

reciterSelect.value =
  reciters[reciter]
    ? reciter
    : "Alafasy_128kbps";


reciterSelect.addEventListener(
  "change",
  async () => {

    const wasPlaying =
      !audio.paused;


    const oldPosition =
      audio.currentTime;


    reciter =
      reciterSelect.value;


    localStorage.setItem(
      "quran_reciter",
      reciter
    );


    updateTitles();


    const index =
      currentAyahIndex;


    await playAyah(index);


    const restore =
      () => {

        if (
          Number.isFinite(
            audio.duration
          )
        ) {

          audio.currentTime =
            Math.min(
              oldPosition,
              audio.duration
            );

        }


        if (!wasPlaying) {

          audio.pause();

          playing = false;

          updatePlayUI();

          updateVinyl();

        }

      };


    if (
      audio.readyState >= 1
    ) {

      restore();

    } else {

      audio.addEventListener(
        "loadedmetadata",
        restore,
        {
          once: true
        }
      );

    }

  }
);


/* =========================================================
   PLAYER OPEN
========================================================= */

function openPlayer() {

  playerSheet.classList.remove(
    "hidden"
  );

  playerOverlay.classList.remove(
    "hidden"
  );


  requestAnimationFrame(
    () => {

      playerSheet.classList.add(
        "player-open"
      );

      playerOverlay.classList.add(
        "overlay-open"
      );

    }
  );

}


/* =========================================================
   PLAYER CLOSE
========================================================= */

function closePlayer() {

  playerSheet.classList.remove(
    "player-open"
  );

  playerOverlay.classList.remove(
    "overlay-open"
  );


  setTimeout(
    () => {

      playerSheet.classList.add(
        "hidden"
      );

      playerOverlay.classList.add(
        "hidden"
      );

    },
    300
  );

}


/* =========================================================
   BUTTONS
========================================================= */

playButton.addEventListener(
  "click",
  togglePlay
);


fullPlayButton.addEventListener(
  "click",
  togglePlay
);


previousButton.addEventListener(
  "click",
  previousAyah
);


fullPreviousButton.addEventListener(
  "click",
  previousAyah
);


nextButton.addEventListener(
  "click",
  nextAyah
);


fullNextButton.addEventListener(
  "click",
  nextAyah
);


repeatButton.addEventListener(
  "click",
  toggleRepeat
);


speedButton.addEventListener(
  "click",
  changeSpeed
);


document
  .getElementById(
    "openPlayerButton"
  )
  .addEventListener(
    "click",
    openPlayer
  );


document
  .getElementById(
    "openPlayerButton2"
  )
  .addEventListener(
    "click",
    openPlayer
  );


document
  .getElementById(
    "closePlayerButton"
  )
  .addEventListener(
    "click",
    closePlayer
  );


playerOverlay.addEventListener(
  "click",
  closePlayer
);


document
  .getElementById(
    "backButton"
  )
  .addEventListener(
    "click",
    () => history.back()
  );


/* =========================================================
   START
========================================================= */

lucide.createIcons();

loadSurah();
