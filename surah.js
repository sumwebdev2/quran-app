/* =========================================================
   QURAN READER
========================================================= */


const API =
  "https://api.alquran.cloud/v1";

const AUDIO_BASE =
  "https://everyayah.com/data";


/* =========================================================
   SURAH NUMBER
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

const fullDisc =
  document.getElementById(
    "fullDisc"
  );

const miniDisc =
  document.getElementById(
    "miniDisc"
  );

const miniProgress =
  document.getElementById(
    "miniProgress"
  );

const currentAyahLabel =
  document.getElementById(
    "currentAyahLabel"
  );

const fullPlayerTitle =
  document.getElementById(
    "fullPlayerTitle"
  );

const fullPlayerReciter =
  document.getElementById(
    "fullPlayerReciter"
  );


/* =========================================================
   AUDIO
========================================================= */

const audio =
  new Audio();

audio.preload =
  "auto";


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
  localStorage.getItem(
    "quran_reciter"
  ) ||
  "Alafasy_128kbps";


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
   NORMALIZE
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
      /ـ/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


/* =========================================================
   REMOVE BISMILLAH
========================================================= */

function removeBismillah(text) {

  if (!text) {
    return "";
  }


  const words =
    text.trim().split(/\s+/);


  if (
    words.length < 4
  ) {
    return text;
  }


  const firstFour =
    words
      .slice(0, 4)
      .join(" ");


  const normalized =
    normalizeArabic(
      firstFour
    );


  const normalizedBismillah =
    normalizeArabic(
      BISMILLAH
    );


  if (
    normalized ===
    normalizedBismillah
  ) {

    return words
      .slice(4)
      .join(" ")
      .trim();

  }


  /*
   * Some API text uses slightly
   * different diacritics.
   *
   * Check the first part as well.
   */

  if (
    normalized.startsWith(
      normalizedBismillah
    )
  ) {

    return words
      .slice(4)
      .join(" ")
      .trim();

  }


  return text;

}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(seconds) {

  if (
    !Number.isFinite(seconds) ||
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
    minutes +
    ":" +
    String(
      secondsPart
    ).padStart(
      2,
      "0"
    )
  );

}


/* =========================================================
   AUDIO URL
========================================================= */

function getAudioUrl(index) {

  const ayah =
    surah?.ayahs?.[index];


  if (!ayah) {
    return null;
  }


  /*
   * EveryAyah uses:
   *
   * 001001.mp3
   * 001002.mp3
   * etc.
   */

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

    console.log(
      "Loading Surah:",
      surahNumber
    );


    if (
      !Number.isInteger(
        surahNumber
      ) ||
      surahNumber < 1 ||
      surahNumber > 114
    ) {

      throw new Error(
        "Invalid Surah number."
      );

    }


    /*
     * STEP 1
     *
     * Load Arabic ONLY.
     *
     * Translation is deliberately
     * not required for the page
     * to work.
     */

    const arabicUrl =
      `${API}/surah/${surahNumber}/quran-uthmani`;


    console.log(
      "Fetching:",
      arabicUrl
    );


    const arabicResponse =
      await fetch(
        arabicUrl,
        {
          method: "GET",
          cache: "no-cache"
        }
      );


    if (
      !arabicResponse.ok
    ) {

      throw new Error(
        "Quran API returned HTTP " +
        arabicResponse.status
      );

    }


    const arabicResult =
      await arabicResponse.json();


    console.log(
      "Arabic result:",
      arabicResult
    );


    if (
      arabicResult.code !== 200 ||
      !arabicResult.data
    ) {

      throw new Error(
        "Quran data was not returned."
      );

    }


    surah =
      arabicResult.data;


    /*
     * STEP 2
     *
     * Prepare ayahs.
     */

    surah.ayahs.forEach(
      ayah => {

        ayah.displayText =
          ayah.text;

      }
    );


    /*
     * Remove Bismillah from the
     * first ayah of normal Surahs.
     *
     * 1 = Al-Fatihah
     *
     * 9 = At-Tawbah
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


    /*
     * STEP 3
     *
     * Render immediately.
     *
     * Translation can fail without
     * stopping the Quran reader.
     */

    translation = null;

    renderSurah();

    updateTitles();

    showPlayer();

    prepareAudio();


    /*
     * STEP 4
     *
     * Translation is optional.
     */

    loadTranslation();


  } catch (error) {

    console.error(
      "QURAN ERROR:",
      error
    );


    content.innerHTML = `

      <div
        class="
          py-20
          text-center
        "
      >

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


        <h2
          class="
            mt-5
            text-lg
            font-bold
          "
        >
          Couldn't load the Quran
        </h2>


        <p
          class="
            mt-2
            text-sm
            leading-6
            text-slate-400
          "
        >
          Check your internet connection
          and try again.
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


        <p
          class="
            mt-5
            break-all
            px-5
            text-[10px]
            text-slate-600
          "
        >
          ${error.message}
        </p>

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
   OPTIONAL TRANSLATION
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


    renderTranslations();


  } catch (error) {

    console.warn(
      "Translation unavailable:",
      error
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
   * ONE BISMILLAH ONLY.
   */

  if (
    surah.number !== 1 &&
    surah.number !== 9
  ) {

    html += `

      <div
        class="
          mb-8
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

    <div class="space-y-3">

  `;


  surah.ayahs.forEach(
    (
      ayah,
      index
    ) => {

      html += `

        <article
          id="ayah-${ayah.numberInSurah}"
          data-index="${index}"
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


  html += `
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

            playFromAyah(
              Number(
                button.dataset.index
              )
            );

          }
        );

      }
    );


  lucide.createIcons();

}


/* =========================================================
   RENDER TRANSLATIONS
========================================================= */

function renderTranslations() {

  if (
    !translation?.ayahs
  ) {

    return;

  }


  document
    .querySelectorAll(
      "[data-translation-index]"
    )
    .forEach(
      element => {

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

      }
    );

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
   PLAYER
========================================================= */

function showPlayer() {

  audioBar.classList.remove(
    "hidden"
  );

}


/* =========================================================
   PREPARE AUDIO
========================================================= */

function prepareAudio() {

  const url =
    getAudioUrl(
      currentAyahIndex
    );


  if (!url) {
    return;
  }


  audio.src =
    url;


  audio.playbackRate =
    playbackSpeed;


  audio.load();

}


/* =========================================================
   PLAY AYAH
========================================================= */

async function playFromAyah(
  index
) {

  if (!surah) {
    return;
  }


  if (
    index < 0 ||
    index >=
    surah.ayahs.length
  ) {

    return;

  }


  currentAyahIndex =
    index;


  audio.pause();


  audio.src =
    getAudioUrl(
      index
    );


  audio.playbackRate =
    playbackSpeed;


  audio.load();


  updateAyahUI();


  try {

    await audio.play();

  } catch (error) {

    console.error(
      "Audio playback error:",
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


  if (audio.paused) {

    try {

      await audio.play();

    } catch (error) {

      console.error(
        error
      );

    }

  } else {

    audio.pause();

  }

}


/* =========================================================
   AUDIO PLAY
========================================================= */

audio.addEventListener(
  "play",
  () => {

    playing = true;

    updatePlayUI();

    updateAyahUI();

    updateVinyl();

  }
);


/* =========================================================
   AUDIO PAUSE
========================================================= */

audio.addEventListener(
  "pause",
  () => {

    playing = false;

    updatePlayUI();

    updateVinyl();

  }
);


/* =========================================================
   AUDIO ENDED
========================================================= */

audio.addEventListener(
  "ended",
  () => {

    const next =
      currentAyahIndex + 1;


    /*
     * NEXT AYAH
     */

    if (
      next <
      surah.ayahs.length
    ) {

      playFromAyah(
        next
      );

      return;

    }


    /*
     * SURAH FINISHED
     */

    if (repeatSurah) {

      playFromAyah(
        0
      );

      return;

    }


    /*
     * STOP
     */

    playing = false;

    updatePlayUI();

    updateVinyl();

  }
);


/* =========================================================
   TIME
========================================================= */

audio.addEventListener(
  "timeupdate",
  updateTime
);


audio.addEventListener(
  "loadedmetadata",
  updateTime
);


function updateTime() {

  if (
    !Number.isFinite(
      audio.duration
    )
  ) {

    return;

  }


  const current =
    audio.currentTime;


  const duration =
    audio.duration;


  const percentage =
    duration > 0
      ? (
          current /
          duration
        ) * 100
      : 0;


  seekBar.value =
    percentage;


  currentTime.textContent =
    formatTime(
      current
    );


  remainingTime.textContent =
    "-" +
    formatTime(
      duration -
      current
    );


  miniProgress.style.width =
    percentage + "%";

}


/* =========================================================
   SEEK
========================================================= */

seekBar.addEventListener(
  "input",
  event => {

    if (
      !Number.isFinite(
        audio.duration
      )
    ) {

      return;

    }


    audio.currentTime =
      (
        Number(
          event.target.value
        ) / 100
      ) *
      audio.duration;

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

    playFromAyah(
      next
    );

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

    audio.currentTime =
      0;

    return;

  }


  const previous =
    currentAyahIndex - 1;


  if (
    previous >= 0
  ) {

    playFromAyah(
      previous
    );

  }

}


/* =========================================================
   AYAH HIGHLIGHT
========================================================= */

function updateAyahUI() {

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
    surah?.ayahs?.[
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
   PLAY BUTTON UI
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

  const current =
    speeds.indexOf(
      playbackSpeed
    );


  playbackSpeed =
    speeds[
      (
        current + 1
      ) %
      speeds.length
    ];


  audio.playbackRate =
    playbackSpeed;


  speedLabel.textContent =
    playbackSpeed +
    "×";

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
  () => {

    reciter =
      reciterSelect.value;


    localStorage.setItem(
      "quran_reciter",
      reciter
    );


    const wasPlaying =
      playing;


    const position =
      audio.currentTime;


    audio.pause();


    audio.src =
      getAudioUrl(
        currentAyahIndex
      );


    audio.playbackRate =
      playbackSpeed;


    audio.load();


    updateTitles();


    audio.addEventListener(
      "loadedmetadata",
      () => {

        if (
          position <
          audio.duration
        ) {

          audio.currentTime =
            position;

        }


        if (wasPlaying) {

          audio.play();

        }

      },
      {
        once: true
      }
    );

  }
);


/* =========================================================
   PLAYER OPEN / CLOSE
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
   BUTTON EVENTS
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

updateTitles();

loadSurah();
