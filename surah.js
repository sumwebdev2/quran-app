/* =========================================================
   QURAN READER
   Surah-level continuous playback
========================================================= */

const API =
  "https://api.alquran.cloud/v1";

const EVERY_AYAH =
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
   DOM
========================================================= */

const content =
  document.getElementById(
    "quranContent"
  );

const title =
  document.getElementById(
    "surahTitle"
  );

const audio =
  document.getElementById(
    "audio"
  );

const preloadAudio =
  document.getElementById(
    "preloadAudio"
  );

const audioBar =
  document.getElementById(
    "audioBar"
  );


/* Mini */

const miniPlay =
  document.getElementById(
    "miniPlay"
  );

const miniPrevious =
  document.getElementById(
    "miniPrevious"
  );

const miniNext =
  document.getElementById(
    "miniNext"
  );

const miniSeekBar =
  document.getElementById(
    "miniSeekBar"
  );

const miniCurrentTime =
  document.getElementById(
    "miniCurrentTime"
  );

const miniRemainingTime =
  document.getElementById(
    "miniRemainingTime"
  );

const miniAudioTitle =
  document.getElementById(
    "miniAudioTitle"
  );

const miniAudioSubtitle =
  document.getElementById(
    "miniAudioSubtitle"
  );

const miniVinyl =
  document.getElementById(
    "miniVinyl"
  );


/* Full */

const fullPlayButton =
  document.getElementById(
    "fullPlayButton"
  );

const fullPreviousButton =
  document.getElementById(
    "fullPreviousButton"
  );

const fullNextButton =
  document.getElementById(
    "fullNextButton"
  );

const fullSeekBar =
  document.getElementById(
    "fullSeekBar"
  );

const fullCurrentTime =
  document.getElementById(
    "fullCurrentTime"
  );

const fullRemainingTime =
  document.getElementById(
    "fullRemainingTime"
  );

const fullPlayerTitle =
  document.getElementById(
    "fullPlayerTitle"
  );

const fullPlayerReciter =
  document.getElementById(
    "fullPlayerReciter"
  );

const fullAyahTitle =
  document.getElementById(
    "fullAyahTitle"
  );

const fullVinyl =
  document.getElementById(
    "fullVinyl"
  );


/* Player */

const playerOverlay =
  document.getElementById(
    "playerOverlay"
  );

const openPlayerButton =
  document.getElementById(
    "openPlayerButton"
  );

const closePlayerButton =
  document.getElementById(
    "closePlayerButton"
  );


/* Options */

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

const reciterButton =
  document.getElementById(
    "reciterButton"
  );

const reciterPanel =
  document.getElementById(
    "reciterPanel"
  );

const reciterSelect =
  document.getElementById(
    "reciterSelect"
  );

const closeReciterButton =
  document.getElementById(
    "closeReciterButton"
  );


/* =========================================================
   STATE
========================================================= */

let surah = null;

let translation = null;

let currentAyahIndex = 0;

let isPlaying = false;

let repeatSurah = false;

let playbackSpeed = 1;

let reciter =
  "Alafasy_128kbps";

let preloadedIndex = -1;

let loadingToken = 0;

let changingAyah = false;


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
   ARABIC CLEANING
========================================================= */

function normalizeArabic(
  text
) {

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


function removeBismillah(
  text
) {

  if (!text) {
    return "";
  }

  const original =
    text.trim();

  const normalized =
    normalizeArabic(
      original
    );

  const bismillah =
    normalizeArabic(
      BISMILLAH
    );


  if (
    normalized.startsWith(
      bismillah
    )
  ) {

    /*
     * Remove the first four
     * Arabic words.
     */

    let result =
      original;

    for (
      let i = 0;
      i < 4;
      i++
    ) {

      result =
        result.trim();

      const match =
        result.match(
          /^\S+/
        );

      if (!match) {
        break;
      }

      result =
        result
          .slice(
            match[0].length
          )
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

      throw new Error(
        "Unable to load Surah"
      );

    }


    const result =
      await response.json();


    surah =
      result.data[0];

    translation =
      result.data[1];


    /*
     * Remove Bismillah from
     * first Ayah for every Surah
     * except Al-Fatihah and
     * At-Tawbah.
     */

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


    miniAudioTitle.textContent =
      surah.englishName;


    fullPlayerTitle.textContent =
      surah.englishName;


    renderSurah();


    audioBar.classList.remove(
      "hidden"
    );


    setupAudio();


  } catch (error) {

    console.error(
      error
    );


    content.innerHTML = `

      <div class="
        py-20
        text-center
      ">

        <p class="
          font-semibold
          text-white
        ">
          Couldn't load Surah
        </p>

        <button
          id="retryButton"
          class="
            mt-5
            rounded-xl
            bg-emerald-400
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
   RENDER
========================================================= */

function renderSurah() {

  let html = `

    <section
      class="
        mb-7
        rounded-3xl
        border
        border-white/10
        bg-gradient-to-br
        from-emerald-600
        to-teal-800
        p-6
        text-center
        shadow-xl
        shadow-black/20
      "
    >

      <p
        class="
          text-xs
          text-emerald-100
        "
      >
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
   * Bismillah appears ONCE
   * outside the Ayah list.
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

    <div
      class="
        w-full
        space-y-4
      "
    >

  `;


  surah.ayahs.forEach(
    (
      ayah,
      index
    ) => {

      const translated =
        translation.ayahs[index];


      html += `

        <article
          id="ayah-${ayah.numberInSurah}"
          class="
            ayah
            rounded-2xl
            p-4
          "
          data-index="${index}"
        >

          <div
            class="
              mb-4
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
              type="button"
              class="
                ayah-play-button
                player-icon-button
              "
              data-index="${index}"
              aria-label="Play Ayah ${ayah.numberInSurah}"
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
              text-[27px]
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
  );


  html += `
    </div>
  `;


  content.innerHTML =
    html;


  /*
   * Ayah buttons
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

            playAyah(
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

function getAyahUrl(
  index
) {

  const ayah =
    surah?.ayahs[index];


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
    `${surahPart}` +
    `${ayahPart}.mp3`
  );

}


/* =========================================================
   SETUP AUDIO
========================================================= */

function setupAudio() {

  audio.preload =
    "auto";

  preloadAudio.preload =
    "auto";


  audio.addEventListener(
    "timeupdate",
    updateProgress
  );


  audio.addEventListener(
    "loadedmetadata",
    updateProgress
  );


  audio.addEventListener(
    "play",
    () => {

      isPlaying =
        true;

      updatePlayerUI();

      updateVinyl();

    }
  );


  audio.addEventListener(
    "pause",
    () => {

      isPlaying =
        false;

      updatePlayerUI();

      updateVinyl();

    }
  );


  audio.addEventListener(
    "ended",
    handleAyahEnded
  );


  /*
   * Preload the first Ayah.
   */

  loadAyah(
    currentAyahIndex,
    false
  );

}


/* =========================================================
   LOAD AYAH
========================================================= */

function loadAyah(
  index,
  autoplay = false
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
    ++loadingToken;


  changingAyah =
    true;


  audio.pause();


  const url =
    getAyahUrl(
      index
    );


  audio.src =
    url;


  audio.playbackRate =
    playbackSpeed;


  audio.load();


  highlightAyah(
    index
  );


  updatePlayerText();


  preloadNextAyah(
    index + 1
  );


  if (autoplay) {

    audio.addEventListener(
      "canplay",
      () => {

        if (
          token !==
          loadingToken
        ) {
          return;
        }


        changingAyah =
          false;


        audio
          .play()
          .catch(
            error => {

              console.error(
                "Playback error:",
                error
              );

            }
          );

      },
      {
        once: true
      }
    );

  } else {

    changingAyah =
      false;

  }

}


/* =========================================================
   PRELOAD NEXT AYAH
========================================================= */

function preloadNextAyah(
  index
) {

  if (
    index < 0 ||
    index >= surah.ayahs.length
  ) {

    preloadedIndex =
      -1;

    return;

  }


  const url =
    getAyahUrl(
      index
    );


  if (!url) {
    return;
  }


  preloadedIndex =
    index;


  preloadAudio.src =
    url;


  preloadAudio.load();

}


/* =========================================================
   PLAY AYAH
========================================================= */

function playAyah(
  index
) {

  /*
   * If tapping the currently
   * playing Ayah, pause/play.
   */

  if (
    index ===
    currentAyahIndex
  ) {

    if (
      audio.paused
    ) {

      audio
        .play()
        .catch(
          console.error
        );

    } else {

      audio.pause();

    }

    return;

  }


  loadAyah(
    index,
    true
  );

}


/* =========================================================
   PLAY / PAUSE
========================================================= */

function togglePlay() {

  if (!surah) {
    return;
  }


  if (
    audio.paused
  ) {

    audio
      .play()
      .catch(
        error => {

          console.error(
            error
          );

        }
      );

  } else {

    audio.pause();

  }

}


miniPlay.addEventListener(
  "click",
  togglePlay
);

fullPlayButton.addEventListener(
  "click",
  togglePlay
);


/* =========================================================
   NEXT AYAH
========================================================= */

function nextAyah() {

  if (!surah) {
    return;
  }


  const next =
    currentAyahIndex + 1;


  if (
    next >=
    surah.ayahs.length
  ) {

    /*
     * At the end of the Surah,
     * do not jump unexpectedly.
     */

    if (
      repeatSurah
    ) {

      loadAyah(
        0,
        true
      );

    }

    return;

  }


  loadAyah(
    next,
    isPlaying
  );

}


miniNext.addEventListener(
  "click",
  nextAyah
);

fullNextButton.addEventListener(
  "click",
  nextAyah
);


/* =========================================================
   PREVIOUS AYAH
========================================================= */

function previousAyah() {

  if (!surah) {
    return;
  }


  /*
   * If more than 3 seconds into
   * current Ayah, restart it.
   */

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


  loadAyah(
    previous,
    isPlaying
  );

}


miniPrevious.addEventListener(
  "click",
  previousAyah
);

fullPreviousButton.addEventListener(
  "click",
  previousAyah
);


/* =========================================================
   AYAH FINISHED
========================================================= */

function handleAyahEnded() {

  /*
   * Prevent accidental duplicate
   * ended handling.
   */

  if (
    changingAyah
  ) {
    return;
  }


  const next =
    currentAyahIndex + 1;


  /*
   * More Ayahs remain.
   */

  if (
    next <
    surah.ayahs.length
  ) {

    /*
     * Highlight and immediately
     * continue with next Ayah.
     */

    loadAyah(
      next,
      true
    );

    return;

  }


  /*
   * Whole Surah has finished.
   */

  if (
    repeatSurah
  ) {

    currentAyahIndex =
      0;

    loadAyah(
      0,
      true
    );

    return;

  }


  /*
   * Repeat OFF:
   * completely stop.
   */

  isPlaying =
    false;

  updatePlayerUI();

  updateVinyl();

  highlightAyah(
    currentAyahIndex
  );

}


/* =========================================================
   HIGHLIGHT
========================================================= */

function highlightAyah(
  index
) {

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
    surah?.ayahs[index];


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


  /*
   * Automatically follow playback.
   */

  if (isPlaying) {

    element.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  }

}


/* =========================================================
   PLAYER TEXT
========================================================= */

function updatePlayerText() {

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


  const reciterName =
    reciters[
      reciter
    ];


  miniAudioTitle.textContent =
    `${surah.englishName} • Ayah ${ayah.numberInSurah}`;


  miniAudioSubtitle.textContent =
    reciterName;


  fullPlayerTitle.textContent =
    surah.englishName;


  fullPlayerReciter.textContent =
    reciterName;


  fullAyahTitle.textContent =
    `Ayah ${ayah.numberInSurah}`;

}


/* =========================================================
   PLAYER UI
========================================================= */

function updatePlayerUI() {

  const icon =
    isPlaying
      ? "pause"
      : "play";


  miniPlay.innerHTML = `

    <i
      data-lucide="${icon}"
      class="h-5 w-5 ${isPlaying ? "" : "fill-current"}"
    ></i>

  `;


  fullPlayButton.innerHTML = `

    <i
      data-lucide="${icon}"
      class="h-7 w-7 ${isPlaying ? "" : "fill-current"}"
    ></i>

  `;


  lucide.createIcons();

}


/* =========================================================
   VINYL
========================================================= */

function updateVinyl() {

  miniVinyl.classList.toggle(
    "spinning",
    isPlaying
  );


  fullVinyl.classList.toggle(
    "spinning",
    isPlaying
  );

}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

  if (
    !audio.duration ||
    !isFinite(
      audio.duration
    )
  ) {
    return;
  }


  const percent =
    (
      audio.currentTime /
      audio.duration
    ) * 100;


  setRangeProgress(
    miniSeekBar,
    percent
  );


  setRangeProgress(
    fullSeekBar,
    percent
  );


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


  miniCurrentTime.textContent =
    current;

  fullCurrentTime.textContent =
    current;


  miniRemainingTime.textContent =
    `-${remaining}`;

  fullRemainingTime.textContent =
    `-${remaining}`;

}


function setRangeProgress(
  element,
  percent
) {

  element.value =
    percent;

  element.style.setProperty(
    "--progress",
    `${percent}%`
  );

}


/* =========================================================
   SEEK
========================================================= */

function seek(
  value
) {

  if (
    !audio.duration ||
    !isFinite(
      audio.duration
    )
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


miniSeekBar.addEventListener(
  "input",
  event => {

    seek(
      event.target.value
    );

  }
);


fullSeekBar.addEventListener(
  "input",
  event => {

    seek(
      event.target.value
    );

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


  audio.playbackRate =
    playbackSpeed;


  speedLabel.textContent =
    `${playbackSpeed}×`;

}


speedButton.addEventListener(
  "click",
  changeSpeed
);


/* =========================================================
   REPEAT SURAH
========================================================= */

function toggleRepeat() {

  repeatSurah =
    !repeatSurah;


  repeatLabel.textContent =
    repeatSurah
      ? "Surah"
      : "Off";


  repeatButton.classList.toggle(
    "active",
    repeatSurah
  );

}


repeatButton.addEventListener(
  "click",
  toggleRepeat
);


/* =========================================================
   RECITER
========================================================= */

function openReciterPanel() {

  reciterPanel.classList.toggle(
    "hidden"
  );

}


function closeReciterPanel() {

  reciterPanel.classList.add(
    "hidden"
  );

}


reciterButton.addEventListener(
  "click",
  openReciterPanel
);


closeReciterButton.addEventListener(
  "click",
  closeReciterPanel
);


/* =========================================================
   CHANGE RECITER
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


  const wasPlaying =
    isPlaying;


  /*
   * Keep the current Ayah.
   */

  loadAyah(
    currentAyahIndex,
    wasPlaying
  );


  saveSettings();


  updatePlayerText();


  /*
   * Close chooser after
   * selection on mobile.
   */

  closeReciterPanel();

}


reciterSelect.addEventListener(
  "change",
  changeReciter
);


/* =========================================================
   PLAYER OPEN
========================================================= */

function openPlayer() {

  playerOverlay.classList.remove(
    "hidden"
  );

}


function closePlayer() {

  playerOverlay.classList.add(
    "hidden"
  );

}


openPlayerButton.addEventListener(
  "click",
  openPlayer
);


closePlayerButton.addEventListener(
  "click",
  closePlayer
);


/* =========================================================
   CLOSE PLAYER WHEN BACKDROP
   IS CLICKED
========================================================= */

playerOverlay.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      playerOverlay
    ) {

      closePlayer();

    }

  }
);


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(
  seconds
) {

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
   SETTINGS
========================================================= */

function saveSettings() {

  try {

    localStorage.setItem(
      "quran-reciter",
      reciter
    );

    localStorage.setItem(
      "quran-speed",
      String(
        playbackSpeed
      )
    );

  } catch (error) {

    console.warn(
      "Unable to save settings",
      error
    );

  }

}


function loadSettings() {

  try {

    const savedReciter =
      localStorage.getItem(
        "quran-reciter"
      );


    if (
      savedReciter &&
      reciters[savedReciter]
    ) {

      reciter =
        savedReciter;

      reciterSelect.value =
        savedReciter;

    }


    const savedSpeed =
      Number(
        localStorage.getItem(
          "quran-speed"
        )
      );


    if (
      speeds.includes(
        savedSpeed
      )
    ) {

      playbackSpeed =
        savedSpeed;

      speedLabel.textContent =
        `${savedSpeed}×`;

    }

  } catch (error) {

    console.warn(
      "Unable to load settings",
      error
    );

  }

}


/* =========================================================
   BACK BUTTON
========================================================= */

document
  .getElementById(
    "backButton"
  )
  .addEventListener(
    "click",
    () => {

      if (
        window.history.length > 1
      ) {

        window.history.back();

      } else {

        window.location.href =
          "index.html";

      }

    }
  );


/* =========================================================
   BOOKMARK
========================================================= */

document
  .getElementById(
    "bookmarkButton"
  )
  .addEventListener(
    "click",
    () => {

      const key =
        `quran-bookmark-${surahNumber}`;


      try {

        const existing =
          localStorage.getItem(
            key
          );


        if (existing) {

          localStorage.removeItem(
            key
          );

        } else {

          localStorage.setItem(
            key,
            String(
              currentAyahIndex
            )
          );

        }

      } catch (error) {

        console.warn(
          error
        );

      }

    }
  );


/* =========================================================
   INITIALIZE
========================================================= */

loadSettings();

loadSurah();

lucide.createIcons();
