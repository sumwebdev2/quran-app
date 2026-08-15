/* =========================================================
   QURAN READER
   Continuous Ayah Playback
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const API =
  "https://api.alquran.cloud/v1";

const AUDIO_BASE =
  "https://everyayah.com/data";


/* =========================================================
   URL
========================================================= */

const params =
  new URLSearchParams(
    window.location.search
  );

const surahNumber =
  Number(
    params.get("surah") || 1
  );


/* =========================================================
   ELEMENTS
========================================================= */

const content =
  document.getElementById(
    "quranContent"
  );

const surahTitle =
  document.getElementById(
    "surahTitle"
  );

const audioBar =
  document.getElementById(
    "audioBar"
  );

const audioTitle =
  document.getElementById(
    "audioTitle"
  );

const audioSubtitle =
  document.getElementById(
    "audioSubtitle"
  );

const fullPlayerTitle =
  document.getElementById(
    "fullPlayerTitle"
  );

const fullPlayerReciter =
  document.getElementById(
    "fullPlayerReciter"
  );

const currentAyahLabel =
  document.getElementById(
    "currentAyahLabel"
  );

const playButton =
  document.getElementById(
    "playButton"
  );

const fullPlayButton =
  document.getElementById(
    "fullPlayButton"
  );

const previousButton =
  document.getElementById(
    "previousAyahButton"
  );

const nextButton =
  document.getElementById(
    "nextAyahButton"
  );

const fullPreviousButton =
  document.getElementById(
    "fullPreviousButton"
  );

const fullNextButton =
  document.getElementById(
    "fullNextButton"
  );

const seekBar =
  document.getElementById(
    "seekBar"
  );

const currentTime =
  document.getElementById(
    "currentTime"
  );

const remainingTime =
  document.getElementById(
    "remainingTime"
  );

const speedButton =
  document.getElementById(
    "speedButton"
  );

const speedLabel =
  document.getElementById(
    "speedLabel"
  );

const repeatButton =
  document.getElementById(
    "repeatButton"
  );

const repeatLabel =
  document.getElementById(
    "repeatLabel"
  );

const reciterSelect =
  document.getElementById(
    "reciterSelect"
  );

const playerSheet =
  document.getElementById(
    "playerSheet"
  );

const playerOverlay =
  document.getElementById(
    "playerOverlay"
  );

const openPlayerButton =
  document.getElementById(
    "openPlayerButton"
  );

const openPlayerButton2 =
  document.getElementById(
    "openPlayerButton2"
  );

const closePlayerButton =
  document.getElementById(
    "closePlayerButton"
  );

const backButton =
  document.getElementById(
    "backButton"
  );

const miniDisc =
  document.getElementById(
    "miniDisc"
  );

const fullDisc =
  document.getElementById(
    "fullDisc"
  );

const miniProgress =
  document.getElementById(
    "miniProgress"
  );


/* =========================================================
   AUDIO ELEMENTS
========================================================= */

/*
 * Two audio elements are used.
 *
 * While Audio A is playing, Audio B can
 * preload the next ayah.
 *
 * This removes most of the delay between
 * ayahs on mobile browsers.
 */

const audioA =
  new Audio();

const audioB =
  new Audio();


audioA.preload =
  "auto";

audioB.preload =
  "auto";


let activeAudio =
  audioA;

let standbyAudio =
  audioB;


/* =========================================================
   STATE
========================================================= */

let surah =
  null;

let translation =
  null;

let currentAyahIndex =
  0;

let playing =
  false;

let repeatSurah =
  false;

let playbackSpeed =
  1;

let reciter =
  "Alafasy_128kbps";

let audioGeneration =
  0;

let nextPreloadedIndex =
  null;


/* =========================================================
   RECITERS
========================================================= */

const reciters = {

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
   HELPERS
========================================================= */

function normalizeArabic(text) {

  return text
    .normalize("NFD")
    .replace(
      /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g,
      ""
    )
    .replace(
      /[إأٱآ]/g,
      "ا"
    )
    .replace(
      /ؤ/g,
      "و"
    )
    .replace(
      /ئ/g,
      "ي"
    )
    .replace(
      /ـ/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


function removeBismillah(text) {

  if (!text) {
    return "";
  }

  const original =
    text.trim();

  const normalized =
    normalizeArabic(
      original
    );

  const normalizedBismillah =
    normalizeArabic(
      BISMILLAH
    );


  if (
    !normalized.startsWith(
      normalizedBismillah
    )
  ) {

    return original;

  }


  /*
   * Remove the first four Arabic
   * words because the API's first
   * ayah can contain the Bismillah.
   */

  const words =
    original.split(/\s+/);


  if (
    words.length <= 4
  ) {

    return "";

  }


  return words
    .slice(4)
    .join(" ")
    .trim();

}


function formatTime(seconds) {

  if (
    !Number.isFinite(
      seconds
    ) ||
    seconds < 0
  ) {

    return "0:00";

  }


  const minutes =
    Math.floor(
      seconds / 60
    );

  const secondsPart =
    Math.floor(
      seconds % 60
    );


  return (
    `${minutes}:` +
    `${String(
      secondsPart
    ).padStart(
      2,
      "0"
    )}`
  );

}


/* =========================================================
   AUDIO URL
========================================================= */

function getAudioUrl(
  index
) {

  const ayah =
    surah?.ayahs?.[index];

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
    `${AUDIO_BASE}/` +
    `${reciter}/` +
    `${surahPart}` +
    `${ayahPart}.mp3`
  );

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
      throw new Error(
        "Failed to load Surah"
      );
    }


    const result =
      await response.json();


    surah =
      result.data[0];

    translation =
      result.data[1];


    /*
     * IMPORTANT:
     *
     * The Bismillah is visual only.
     *
     * It is removed from the first
     * ayah for every Surah except
     * Al-Fatihah and At-Tawbah.
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

    } else {

      surah.ayahs.forEach(
        ayah => {

          ayah.displayText =
            ayah.text;

        }
      );

    }


    /*
     * Make sure all other ayahs
     * have displayText.
     */

    surah.ayahs.forEach(
      ayah => {

        if (
          ayah.displayText ===
          undefined
        ) {

          ayah.displayText =
            ayah.text;

        }

      }
    );


    updateTitles();

    renderSurah();

    showPlayer();

    prepareCurrentAudio();

  } catch (error) {

    console.error(
      error
    );


    content.innerHTML = `

      <div
        class="
          py-20
          text-center
        "
      >

        <i
          data-lucide="wifi-off"
          class="
            mx-auto
            h-10
            w-10
            text-slate-500
          "
        ></i>

        <p
          class="
            mt-4
            font-semibold
          "
        >
          Couldn't load this Surah
        </p>

        <button
          id="retryButton"
          type="button"
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


    lucide.createIcons();


    document
      .getElementById(
        "retryButton"
      )
      ?.addEventListener(
        "click",
        loadSurah
      );

  }

}


/* =========================================================
   TITLES
========================================================= */

function updateTitles() {

  surahTitle.textContent =
    surah.englishName;

  audioTitle.textContent =
    surah.englishName;

  fullPlayerTitle.textContent =
    surah.englishName;

  audioSubtitle.textContent =
    reciters[reciter];

  fullPlayerReciter.textContent =
    reciters[reciter];

}


/* =========================================================
   RENDER
========================================================= */

function renderSurah() {

  let html = `

    <section
      class="
        mb-7
        overflow-hidden
        rounded-3xl
        bg-gradient-to-br
        from-emerald-700
        via-emerald-600
        to-teal-800
        p-6
        text-center
      "
    >

      <p
        class="
          text-xs
          font-semibold
          uppercase
          tracking-[0.2em]
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


      <h3
        class="
          mt-3
          text-xl
          font-bold
        "
      >
        ${surah.englishName}
      </h3>


      <p
        class="
          mt-1
          text-sm
          text-emerald-100
        "
      >
        ${surah.englishNameTranslation}
      </p>


      <p
        class="
          mt-3
          text-xs
          text-emerald-100
        "
      >
        ${surah.numberOfAyahs} Ayahs
      </p>

    </section>

  `;


  /*
   * Bismillah appears only once.
   *
   * Al-Fatihah is handled by its own
   * Quran text.
   *
   * At-Tawbah has no Bismillah.
   */

  if (
    surah.number !== 1 &&
    surah.number !== 9
  ) {

    html += `

      <div
        class="
          mb-8
          overflow-hidden
          text-center
        "
      >

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

    <div
      class="
        w-full
        space-y-3
      "
    >

      ${surah.ayahs
        .map(
          (
            ayah,
            index
          ) => {

            const translated =
              translation
                .ayahs[index];


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
                      ayahPlayButton
                      grid
                      h-9
                      w-9
                      place-items-center
                      rounded-full
                      border
                      border-white/10
                      bg-white/5
                      text-slate-400
                      active:scale-95
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
                  class="
                    quran-arabic
                    text-[27px]
                    text-white
                  "
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
                  ${translated?.text || ""}
                </p>

              </article>

            `;

          }
        )
        .join("")}

    </div>

  `;


  content.innerHTML =
    html;


  document
    .querySelectorAll(
      ".ayahPlayButton"
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
   SHOW PLAYER
========================================================= */

function showPlayer() {

  audioBar.classList.remove(
    "hidden"
  );

}


/* =========================================================
   PREPARE CURRENT AUDIO
========================================================= */

function prepareCurrentAudio() {

  const url =
    getAudioUrl(
      currentAyahIndex
    );


  if (!url) {
    return;
  }


  activeAudio.src =
    url;

  activeAudio.playbackRate =
    playbackSpeed;

  activeAudio.load();


  preloadNextAyah();

}


/* =========================================================
   PRELOAD NEXT AYAH
========================================================= */

function preloadNextAyah() {

  const nextIndex =
    currentAyahIndex + 1;


  if (
    nextIndex >=
    surah.ayahs.length
  ) {

    nextPreloadedIndex =
      null;

    standbyAudio.removeAttribute(
      "src"
    );

    standbyAudio.load();

    return;

  }


  const url =
    getAudioUrl(
      nextIndex
    );


  standbyAudio.src =
    url;

  standbyAudio.preload =
    "auto";

  standbyAudio.playbackRate =
    playbackSpeed;

  standbyAudio.load();


  nextPreloadedIndex =
    nextIndex;

}


/* =========================================================
   PLAY FROM AYAH
========================================================= */

async function playFromAyah(
  index
) {

  if (!surah) {
    return;
  }


  currentAyahIndex =
    index;


  activeAudio.pause();

  standbyAudio.pause();


  activeAudio =
    audioA;

  standbyAudio =
    audioB;


  activeAudio.src =
    getAudioUrl(
      index
    );


  activeAudio.playbackRate =
    playbackSpeed;


  activeAudio.load();


  updateAyahUI();

  preloadNextAyah();


  try {

    await activeAudio.play();

  } catch (error) {

    console.error(
      "Playback failed:",
      error
    );

  }

}


/* =========================================================
   PLAY / PAUSE
========================================================= */

async function togglePlay() {

  if (!surah) {
    return;
  }


  if (
    activeAudio.paused
  ) {

    try {

      await activeAudio.play();

    } catch (error) {

      console.error(
        error
      );

    }

  } else {

    activeAudio.pause();

  }

}


/* =========================================================
   AUDIO PLAY
========================================================= */

function handlePlay() {

  playing =
    true;


  updatePlayUI();

  updateVinyl();

  updateAyahUI();

}


/* =========================================================
   AUDIO PAUSE
========================================================= */

function handlePause() {

  /*
   * Don't set playing false when
   * we're internally changing from
   * one ayah to the next.
   */

  if (
    activeAudio.paused
  ) {

    playing =
      false;

  }


  updatePlayUI();

  updateVinyl();

}


/* =========================================================
   AUDIO ENDED
========================================================= */

function handleAudioEnded() {

  const nextIndex =
    currentAyahIndex + 1;


  /*
   * End of entire Surah
   */

  if (
    nextIndex >=
    surah.ayahs.length
  ) {

    if (
      repeatSurah
    ) {

      currentAyahIndex =
        0;


      /*
       * Start again from the
       * beginning of the Surah.
       */

      playFromAyah(
        0
      );

      return;

    }


    /*
     * Normal ending.
     */

    playing =
      false;

    updatePlayUI();

    updateVinyl();

    updateAyahUI();

    return;

  }


  /*
   * Move to next ayah.
   */

  moveToNextAyah(
    true
  );

}


/* =========================================================
   NEXT AYAH
========================================================= */

function nextAyah() {

  if (!surah) {
    return;
  }


  const nextIndex =
    currentAyahIndex + 1;


  if (
    nextIndex >=
    surah.ayahs.length
  ) {

    return;

  }


  moveToNextAyah(
    playing
  );

}


/* =========================================================
   MOVE NEXT
========================================================= */

async function moveToNextAyah(
  shouldPlay
) {

  const nextIndex =
    currentAyahIndex + 1;


  if (
    nextIndex >=
    surah.ayahs.length
  ) {

    return;

  }


  /*
   * If the next ayah has already
   * been preloaded, use it.
   */

  if (
    nextPreloadedIndex ===
    nextIndex
  ) {

    const oldActive =
      activeAudio;


    activeAudio =
      standbyAudio;

    standbyAudio =
      oldActive;


    currentAyahIndex =
      nextIndex;


    nextPreloadedIndex =
      null;


    activeAudio.currentTime =
      0;


    updateAyahUI();

    preloadNextAyah();


    if (
      shouldPlay
    ) {

      try {

        await activeAudio.play();

      } catch (error) {

        console.error(
          error
        );

      }

    }


    return;

  }


  /*
   * Fallback if preload wasn't
   * ready in time.
   */

  currentAyahIndex =
    nextIndex;


  activeAudio.pause();


  activeAudio.src =
    getAudioUrl(
      nextIndex
    );


  activeAudio.playbackRate =
    playbackSpeed;


  activeAudio.load();


  updateAyahUI();

  preloadNextAyah();


  if (
    shouldPlay
  ) {

    try {

      await activeAudio.play();

    } catch (error) {

      console.error(
        error
      );

    }

  }

}


/* =========================================================
   PREVIOUS AYAH
========================================================= */

function previousAyah() {

  if (!surah) {
    return;
  }


  /*
   * If we're more than three
   * seconds into the ayah,
   * restart the current ayah.
   */

  if (
    activeAudio.currentTime >
    3
  ) {

    activeAudio.currentTime =
      0;

    return;

  }


  const previousIndex =
    currentAyahIndex - 1;


  if (
    previousIndex < 0
  ) {

    activeAudio.currentTime =
      0;

    return;

  }


  playFromAyah(
    previousIndex
  );

}


/* =========================================================
   SEEK
========================================================= */

function seekAudio(
  value
) {

  if (
    !Number.isFinite(
      activeAudio.duration
    )
  ) {

    return;

  }


  const percent =
    Number(value);


  activeAudio.currentTime =
    (
      percent / 100
    ) *
    activeAudio.duration;

}


/* =========================================================
   TIME UPDATE
========================================================= */

function updateTimeUI() {

  const duration =
    activeAudio.duration;


  if (
    !Number.isFinite(
      duration
    ) ||
    duration <= 0
  ) {

    return;

  }


  const current =
    activeAudio.currentTime;


  const percentage =
    (
      current /
      duration
    ) * 100;


  seekBar.value =
    percentage;


  currentTime.textContent =
    formatTime(
      current
    );


  remainingTime.textContent =
    "-" +
    formatTime(
      Math.max(
        0,
        duration -
        current
      )
    );


  miniProgress.style.width =
    `${percentage}%`;

}


/* =========================================================
   AYAH UI
========================================================= */

function updateAyahUI() {

  if (!surah) {
    return;
  }


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
    surah.ayahs[
      currentAyahIndex
    ];


  if (!ayah) {
    return;
  }


  const element =
    document.getElementById(
      `ayah-${ayah.numberInSurah}`
    );


  if (element) {

    element.classList.add(
      "active"
    );


    if (playing) {

      element.scrollIntoView({
        behavior:
          "smooth",
        block:
          "center"
      });

    }

  }


  currentAyahLabel.textContent =
    `Ayah ${ayah.numberInSurah} of ${surah.numberOfAyahs}`;

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
   REPEAT SURAH
========================================================= */

function toggleRepeat() {

  repeatSurah =
    !repeatSurah;


  repeatButton.classList.toggle(
    "text-emerald-400",
    repeatSurah
  );


  repeatButton.classList.toggle(
    "border-emerald-500/50",
    repeatSurah
  );


  repeatButton.classList.toggle(
    "bg-emerald-500/10",
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

  const currentIndex =
    speeds.indexOf(
      playbackSpeed
    );


  const nextIndex =
    (
      currentIndex + 1
    ) %
    speeds.length;


  playbackSpeed =
    speeds[nextIndex];


  activeAudio.playbackRate =
    playbackSpeed;


  standbyAudio.playbackRate =
    playbackSpeed;


  speedLabel.textContent =
    `${playbackSpeed}×`;

}


/* =========================================================
   RECITER
========================================================= */

function changeReciter() {

  const selected =
    reciterSelect.value;


  if (
    !reciters[selected]
  ) {

    return;

  }


  reciter =
    selected;


  localStorage.setItem(
    "quran_reciter",
    reciter
  );


  const wasPlaying =
    playing;


  const savedTime =
    activeAudio.currentTime;


  /*
   * Change reciter without
   * changing the current ayah.
   */

  activeAudio.pause();

  standbyAudio.pause();


  activeAudio.src =
    getAudioUrl(
      currentAyahIndex
    );


  activeAudio.playbackRate =
    playbackSpeed;


  activeAudio.load();


  activeAudio.addEventListener(
    "loadedmetadata",
    () => {

      if (
        Number.isFinite(
          savedTime
        ) &&
        savedTime <
        activeAudio.duration
      ) {

        activeAudio.currentTime =
          savedTime;

      }


      if (
        wasPlaying
      ) {

        activeAudio
          .play()
          .catch(
            console.error
          );

      }

    },
    {
      once: true
    }
  );


  updateTitles();

  preloadNextAyah();

}


/* =========================================================
   LOAD SAVED RECITER
========================================================= */

function loadSavedReciter() {

  const saved =
    localStorage.getItem(
      "quran_reciter"
    );


  if (
    saved &&
    reciters[saved]
  ) {

    reciter =
      saved;

    reciterSelect.value =
      saved;

  }


  updateTitles();

}


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
   EVENT LISTENERS
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


seekBar.addEventListener(
  "input",
  event => {

    seekAudio(
      event.target.value
    );

  }
);


reciterSelect.addEventListener(
  "change",
  changeReciter
);


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


playerOverlay.addEventListener(
  "click",
  closePlayer
);


backButton.addEventListener(
  "click",
  () => {

    history.back();

  }
);


/* =========================================================
   AUDIO EVENTS
========================================================= */

[
  audioA,
  audioB
].forEach(
  audio => {

    audio.addEventListener(
      "play",
      () => {

        if (
          audio ===
          activeAudio
        ) {

          handlePlay();

        }

      }
    );


    audio.addEventListener(
      "pause",
      () => {

        if (
          audio ===
          activeAudio
        ) {

          handlePause();

        }

      }
    );


    audio.addEventListener(
      "timeupdate",
      () => {

        if (
          audio ===
          activeAudio
        ) {

          updateTimeUI();

        }

      }
    );


    audio.addEventListener(
      "loadedmetadata",
      () => {

        if (
          audio ===
          activeAudio
        ) {

          updateTimeUI();

        }

      }
    );


    audio.addEventListener(
      "ended",
      () => {

        if (
          audio ===
          activeAudio
        ) {

          handleAudioEnded();

        }

      }
    );

  }
);


/* =========================================================
   START
========================================================= */

loadSavedReciter();

loadSurah();

lucide.createIcons();
