const API_BASE =
  "https://api.alquran.cloud/v1";


const params =
  new URLSearchParams(
    window.location.search
  );


const surahNumber =
  params.get("surah") || "1";


const title =
  document.getElementById(
    "surahTitle"
  );


const content =
  document.getElementById(
    "quranContent"
  );


const audioBar =
  document.getElementById(
    "audioBar"
  );


const playButton =
  document.getElementById(
    "playButton"
  );


const audioTitle =
  document.getElementById(
    "audioTitle"
  );


const audioProgress =
  document.getElementById(
    "audioProgress"
  );


const currentTimeElement =
  document.getElementById(
    "currentTime"
  );


const durationElement =
  document.getElementById(
    "duration"
  );


const previousButton =
  document.getElementById(
    "previousAyahButton"
  );


const nextButton =
  document.getElementById(
    "nextAyahButton"
  );


/*
|--------------------------------------------------------------------------
| STATE
|--------------------------------------------------------------------------
*/

let surahData = null;

let audio = new Audio();

let currentAyahIndex = 0;

let isPlaying = false;

let isSurahPlaying = false;


/*
|--------------------------------------------------------------------------
| LOAD SURAH
|--------------------------------------------------------------------------
*/

async function loadSurah() {

  try {

    const response =
      await fetch(
        `${API_BASE}/surah/${surahNumber}/editions/quran-uthmani,en.asad`
      );


    if (!response.ok) {

      throw new Error(
        "Failed to load Surah"
      );

    }


    const result =
      await response.json();


    const arabic =
      result.data[0];


    const translation =
      result.data[1];


    /*
     * IMPORTANT:
     *
     * We do NOT add Bismillah ourselves.
     *
     * The ayahs from the Quran edition
     * are rendered exactly as returned.
     */

    surahData = {

      ...arabic,

      translationAyahs:
        translation.ayahs

    };


    title.textContent =
      arabic.englishName;


    audioTitle.textContent =
      `${arabic.englishName} · Alafasy`;


    renderSurah();


    setupAudio();


  } catch (error) {

    console.error(error);


    content.innerHTML = `

      <div
        class="py-16
               text-center"
      >

        <i
          data-lucide="wifi-off"
          class="mx-auto
                 h-8 w-8
                 text-red-400"
        ></i>


        <p
          class="mt-4
                 font-semibold"
        >
          Couldn't load this Surah
        </p>


        <button
          onclick="loadSurah()"
          class="mt-4
                 rounded-xl
                 bg-emerald-500
                 px-5 py-2.5
                 font-semibold
                 text-slate-950"
        >
          Try Again
        </button>

      </div>

    `;


    lucide.createIcons();

  }

}


/*
|--------------------------------------------------------------------------
| RENDER SURAH
|--------------------------------------------------------------------------
*/

function renderSurah() {

  const surah =
    surahData;


  content.innerHTML = `

    <!-- SURAH HEADER -->

    <section
      class="mb-8
             w-full
             rounded-3xl
             bg-gradient-to-br
             from-emerald-600
             to-teal-800
             p-6
             text-center"
    >

      <p
        class="text-sm
               text-emerald-100"
      >
        Surah ${surah.number}
      </p>


      <h2
        class="mt-2
               font-arabic
               text-4xl
               font-bold"
        dir="rtl"
      >
        ${surah.name}
      </h2>


      <h3
        class="mt-3
               text-xl
               font-bold"
      >
        ${surah.englishName}
      </h3>


      <p
        class="mt-1
               text-sm
               text-emerald-100"
      >
        ${surah.englishNameTranslation}
      </p>


      <p
        class="mt-3
               text-xs
               text-emerald-100"
      >
        ${surah.numberOfAyahs} Ayahs
      </p>

    </section>


    <!-- AYAH LIST -->

    <div
      class="w-full
             space-y-5"
    >

      ${surah.ayahs.map(
        (ayah, index) => {

          const translation =
            surah.translationAyahs[
              index
            ];


          return `

            <article
              id="ayah-${ayah.numberInSurah}"
              class="ayah
                     w-full
                     min-w-0
                     overflow-hidden
                     rounded-2xl
                     border
                     border-transparent
                     p-4
                     transition-all
                     duration-500"
            >

              <!-- AYAH HEADER -->

              <div
                class="mb-5
                       flex
                       items-center
                       justify-between"
              >

                <span
                  class="grid
                         h-9
                         w-9
                         shrink-0
                         place-items-center
                         rounded-full
                         bg-emerald-500/10
                         text-xs
                         font-bold
                         text-emerald-400"
                >
                  ${ayah.numberInSurah}
                </span>


                <button
                  onclick="startSurahFromAyah(${index})"
                  class="rounded-full
                         border
                         border-white/10
                         p-2.5
                         text-slate-400
                         transition
                         hover:text-emerald-400
                         active:scale-95"
                  aria-label="Play from this Ayah"
                >

                  <i
                    data-lucide="play"
                    class="h-4 w-4"
                  ></i>

                </button>

              </div>


              <!-- ARABIC -->

              <p
                class="quran-text
                       w-full
                       max-w-full
                       overflow-hidden
                       font-arabic
                       text-right
                       text-[28px]
                       leading-[2.25]
                       text-white"
                dir="rtl"
                lang="ar"
              >
                ${ayah.text}
              </p>


              <!-- TRANSLATION -->

              <p
                class="mt-5
                       w-full
                       max-w-full
                       overflow-hidden
                       text-sm
                       leading-7
                       text-slate-400"
              >
                ${translation.text}
              </p>

            </article>

          `;

        }
      ).join("")}

    </div>

  `;


  lucide.createIcons();

}


/*
|--------------------------------------------------------------------------
| AUDIO SETUP
|--------------------------------------------------------------------------
*/

function setupAudio() {

  audio.preload =
    "metadata";


  /*
   * Full Surah audio.
   *
   * This is the important change:
   * the main player is one continuous
   * Surah recording rather than stopping
   * after every individual ayah.
   */

  audio.src =
    `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNumber}.mp3`;


  audioBar.classList.remove(
    "hidden"
  );


  audio.addEventListener(
    "loadedmetadata",
    () => {

      durationElement.textContent =
        formatTime(
          audio.duration
        );

    }
  );


  audio.addEventListener(
    "timeupdate",
    handleTimeUpdate
  );


  audio.addEventListener(
    "play",
    () => {

      isPlaying = true;

      isSurahPlaying = true;

      updatePlayButton();

    }
  );


  audio.addEventListener(
    "pause",
    () => {

      isPlaying = false;

      updatePlayButton();

    }
  );


  audio.addEventListener(
    "ended",
    () => {

      isPlaying = false;

      isSurahPlaying = false;

      updatePlayButton();

      highlightAyah(
        surahData.ayahs.length - 1
      );

    }
  );


  playButton.addEventListener(
    "click",
    togglePlayback
  );


  previousButton.addEventListener(
    "click",
    previousAyah
  );


  nextButton.addEventListener(
    "click",
    nextAyah
  );


  /*
   * Show controls.
   */

  previousButton.classList.remove(
    "hidden"
  );

  nextButton.classList.remove(
    "hidden"
  );


  updatePlayButton();

}


/*
|--------------------------------------------------------------------------
| PLAY / PAUSE
|--------------------------------------------------------------------------
*/

async function togglePlayback() {

  if (!audio.src) {
    return;
  }


  if (audio.paused) {

    try {

      await audio.play();

    } catch (error) {

      console.error(
        "Playback failed:",
        error
      );

    }

  } else {

    audio.pause();

  }

}


/*
|--------------------------------------------------------------------------
| START SURAH FROM AYAH
|--------------------------------------------------------------------------
*/

async function startSurahFromAyah(
  index
) {

  if (!surahData) {
    return;
  }


  currentAyahIndex =
    Math.max(
      0,
      Math.min(
        index,
        surahData.ayahs.length - 1
      )
    );


  /*
   * We need to estimate the position
   * of this ayah inside the full Surah.
   *
   * Until we add precise timing metadata,
   * we use the ayah position as a
   * navigation fallback.
   */

  const total =
    surahData.ayahs.length;


  const percentage =
    currentAyahIndex / total;


  if (
    audio.duration &&
    isFinite(audio.duration)
  ) {

    audio.currentTime =
      audio.duration *
      percentage;

  }


  highlightAyah(
    currentAyahIndex
  );


  try {

    await audio.play();

  } catch (error) {

    console.error(
      "Playback failed:",
      error
    );

  }

}


/*
|--------------------------------------------------------------------------
| TIME UPDATE
|--------------------------------------------------------------------------
*/

function handleTimeUpdate() {

  if (
    !audio.duration ||
    !isFinite(audio.duration)
  ) {
    return;
  }


  /*
   * Player progress.
   */

  const progress =
    (audio.currentTime /
      audio.duration) *
    100;


  audioProgress.style.width =
    `${progress}%`;


  currentTimeElement.textContent =
    formatTime(
      audio.currentTime
    );


  durationElement.textContent =
    formatTime(
      audio.duration
    );


  /*
   * Synchronize the highlighted ayah
   * with the full Surah audio.
   *
   * This is an initial synchronization
   * method. We will replace it with
   * exact ayah timing data next.
   */

  if (
    isSurahPlaying &&
    surahData
  ) {

    const total =
      surahData.ayahs.length;


    const calculatedIndex =
      Math.floor(
        (audio.currentTime /
          audio.duration) *
        total
      );


    const safeIndex =
      Math.min(
        calculatedIndex,
        total - 1
      );


    if (
      safeIndex !==
      currentAyahIndex
    ) {

      currentAyahIndex =
        safeIndex;


      highlightAyah(
        currentAyahIndex
      );

    }

  }

}


/*
|--------------------------------------------------------------------------
| HIGHLIGHT AYAH
|--------------------------------------------------------------------------
*/

function highlightAyah(
  index
) {

  document
    .querySelectorAll(".ayah")
    .forEach(element => {

      element.classList.remove(
        "active-ayah"
      );

    });


  const ayah =
    surahData.ayahs[index];


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
    "active-ayah"
  );


  element.scrollIntoView({

    behavior: "smooth",

    block: "center"

  });

}


/*
|--------------------------------------------------------------------------
| NEXT AYAH
|--------------------------------------------------------------------------
*/

function nextAyah() {

  if (!surahData) {
    return;
  }


  const next =
    currentAyahIndex + 1;


  if (
    next >=
    surahData.ayahs.length
  ) {

    return;

  }


  currentAyahIndex =
    next;


  highlightAyah(
    currentAyahIndex
  );


  /*
   * Move approximately to the
   * next ayah's position in the
   * full Surah recording.
   */

  if (
    audio.duration &&
    isFinite(audio.duration)
  ) {

    audio.currentTime =
      audio.duration *
      (
        currentAyahIndex /
        surahData.ayahs.length
      );

  }

}


/*
|--------------------------------------------------------------------------
| PREVIOUS AYAH
|--------------------------------------------------------------------------
*/

function previousAyah() {

  if (!surahData) {
    return;
  }


  const previous =
    currentAyahIndex - 1;


  if (previous < 0) {

    audio.currentTime = 0;

    currentAyahIndex = 0;

    highlightAyah(0);

    return;

  }


  currentAyahIndex =
    previous;


  highlightAyah(
    currentAyahIndex
  );


  if (
    audio.duration &&
    isFinite(audio.duration)
  ) {

    audio.currentTime =
      audio.duration *
      (
        currentAyahIndex /
        surahData.ayahs.length
      );

  }

}


/*
|--------------------------------------------------------------------------
| FORMAT TIME
|--------------------------------------------------------------------------
*/

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


  const remaining =
    Math.floor(
      seconds % 60
    );


  return `${minutes}:${String(
    remaining
  ).padStart(2, "0")}`;

}


/*
|--------------------------------------------------------------------------
| PLAY BUTTON ICON
|--------------------------------------------------------------------------
*/

function updatePlayButton() {

  playButton.innerHTML =
    isPlaying

      ? `
        <i
          data-lucide="pause"
          class="h-5 w-5"
        ></i>
      `

      : `
        <i
          data-lucide="play"
          class="h-5 w-5 fill-current"
        ></i>
      `;


  lucide.createIcons();

}


/*
|--------------------------------------------------------------------------
| START
|--------------------------------------------------------------------------
*/

loadSurah();
