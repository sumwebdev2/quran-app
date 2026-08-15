const API_BASE = "https://api.alquran.cloud/v1";

const params = new URLSearchParams(window.location.search);
const surahNumber = params.get("surah") || "1";

const title = document.getElementById("surahTitle");
const content = document.getElementById("quranContent");
const audioBar = document.getElementById("audioBar");
const playButton = document.getElementById("playButton");
const audioTitle = document.getElementById("audioTitle");
const audioProgress = document.getElementById("audioProgress");

let surahData = null;

const audio = new Audio();

let currentAyahIndex = 0;

let isPlaying = false;

let continuousMode = true;

let loadingAudio = false;


/* =========================================================
   LOAD SURAH
========================================================= */

async function loadSurah() {

  try {

    const response = await fetch(
      `${API_BASE}/surah/${surahNumber}/editions/quran-uthmani,en.asad`
    );

    if (!response.ok) {
      throw new Error("Failed to load Surah");
    }

    const result = await response.json();

    const arabic = result.data[0];

    const translation = result.data[1];

    surahData = {
      ...arabic,
      translationAyahs: translation.ayahs
    };

    title.textContent =
      arabic.englishName;

    audioTitle.textContent =
      `${arabic.englishName} · Alafasy`;

    renderSurah(surahData);

    setupAudio();

  } catch (error) {

    console.error(error);

    content.innerHTML = `

      <div class="py-16 text-center">

        <i
          data-lucide="wifi-off"
          class="mx-auto h-8 w-8 text-red-400"
        ></i>

        <p class="mt-4 font-semibold">
          Couldn't load this Surah
        </p>

        <p class="mt-1 text-sm text-slate-400">
          Please check your internet connection.
        </p>

        <button
          onclick="loadSurah()"
          class="mt-4 rounded-xl
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


/* =========================================================
   RENDER SURAH
========================================================= */

function renderSurah(surah) {

  content.innerHTML = `

    <!-- SURAH HEADER -->

    <section
      class="mb-8 rounded-3xl
             bg-gradient-to-br
             from-emerald-600
             to-teal-800
             p-6 text-center"
    >

      <p class="text-sm text-emerald-100">
        Surah ${surah.number}
      </p>

      <h2
        class="mt-2 font-arabic
               text-4xl font-bold"
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


    <!-- AYAH LIST -->

    <div class="space-y-8">

      ${surah.ayahs.map((ayah, index) => {

        const translation =
          surah.translationAyahs[index];

        return `

          <article
            id="ayah-${ayah.numberInSurah}"
            class="ayah
                   rounded-2xl
                   border-b
                   border-white/5
                   pb-7
                   transition-all
                   duration-500"
          >

            <div
              class="mb-4
                     flex
                     items-center
                     justify-between"
            >

              <span
                class="grid
                       h-9
                       w-9
                       place-items-center
                       rounded-full
                       bg-emerald-500/10
                       text-xs
                       font-bold
                       text-emerald-400"
              >
                ${ayah.numberInSurah}
              </span>


              <div class="flex gap-2">

                <!-- PLAY AYAH -->

                <button
                  onclick="playAyah(${index})"
                  class="rounded-full
                         border
                         border-white/10
                         p-2.5
                         text-slate-400
                         transition
                         hover:text-emerald-400"
                  aria-label="Play ayah"
                >

                  <i
                    data-lucide="play"
                    class="h-4 w-4"
                  ></i>

                </button>


                <!-- BOOKMARK -->

                <button
                  onclick="bookmarkAyah(${index})"
                  class="rounded-full
                         border
                         border-white/10
                         p-2.5
                         text-slate-400"
                  aria-label="Bookmark ayah"
                >

                  <i
                    data-lucide="bookmark"
                    class="h-4 w-4"
                  ></i>

                </button>

              </div>

            </div>


            <!-- ARABIC -->

            <p
              class="font-arabic
                     text-right
                     text-3xl
                     leading-[2.4]
                     text-white"
              dir="rtl"
            >
              ${ayah.text}
            </p>


            <!-- TRANSLATION -->

            <p
              class="mt-5
                     text-sm
                     leading-7
                     text-slate-400"
            >
              ${translation.text}
            </p>

          </article>

        `;

      }).join("")}

    </div>

  `;

  lucide.createIcons();

}


/* =========================================================
   AUDIO SETUP
========================================================= */

function setupAudio() {

  audio.preload = "auto";


  audio.addEventListener(
    "play",
    () => {

      isPlaying = true;

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
    "timeupdate",
    updateProgress
  );


  audio.addEventListener(
    "ended",
    handleAyahEnded
  );


  audioBar.classList.remove("hidden");

  updatePlayButton();

}


/* =========================================================
   LOAD AYAH AUDIO
========================================================= */

async function loadAyahAudio(index) {

  if (!surahData) {
    return false;
  }


  if (
    index < 0 ||
    index >= surahData.ayahs.length
  ) {

    return false;

  }


  if (loadingAudio) {
    return false;
  }


  loadingAudio = true;


  const ayah =
    surahData.ayahs[index];


  currentAyahIndex = index;


  try {

    const response = await fetch(

      `${API_BASE}/ayah/${ayah.number}/ar.alafasy`

    );


    if (!response.ok) {

      throw new Error(
        "Ayah audio unavailable"
      );

    }


    const result =
      await response.json();


    const audioUrl =
      result?.data?.audio;


    if (!audioUrl) {

      throw new Error(
        "No audio URL returned"
      );

    }


    /*
     * Stop current audio before changing
     * to the new ayah.
     */

    audio.pause();

    audio.currentTime = 0;

    audio.src = audioUrl;


    /*
     * Highlight the new ayah.
     */

    highlightAyah(
      ayah.numberInSurah
    );


    /*
     * Update player title.
     */

    audioTitle.textContent =
      `${surahData.englishName} · Ayah ${ayah.numberInSurah}`;


    return true;

  } catch (error) {

    console.error(
      "Audio loading error:",
      error
    );

    return false;

  } finally {

    loadingAudio = false;

  }

}


/* =========================================================
   PLAY FROM AYAH
========================================================= */

async function playFromAyah(index) {

  if (!surahData) {
    return;
  }


  if (
    index < 0 ||
    index >= surahData.ayahs.length
  ) {

    stopPlayback();

    return;

  }


  const loaded =
    await loadAyahAudio(index);


  if (!loaded) {

    return;

  }


  try {

    await audio.play();

  } catch (error) {

    console.error(
      "Playback failed:",
      error
    );

  }

}


/* =========================================================
   PLAY FULL SURAH
========================================================= */

async function playSurah() {

  continuousMode = true;

  await playFromAyah(
    currentAyahIndex
  );

}


/* =========================================================
   PLAY INDIVIDUAL AYAH
========================================================= */

async function playAyah(index) {

  /*
   * IMPORTANT:
   *
   * Clicking an ayah starts continuous mode.
   * It will therefore continue automatically
   * through the rest of the Surah.
   */

  continuousMode = true;

  await playFromAyah(index);

}


/* =========================================================
   AYAH FINISHED
========================================================= */

async function handleAyahEnded() {

  if (!continuousMode) {
    return;
  }


  const nextIndex =
    currentAyahIndex + 1;


  /*
   * End of Surah.
   */

  if (
    nextIndex >=
    surahData.ayahs.length
  ) {

    isPlaying = false;

    updatePlayButton();

    audioTitle.textContent =
      `${surahData.englishName} · Finished`;

    return;

  }


  /*
   * Automatically play next ayah.
   */

  await playFromAyah(
    nextIndex
  );

}


/* =========================================================
   GLOBAL PLAY BUTTON
========================================================= */

playButton.addEventListener(
  "click",
  async () => {

    if (!surahData) {
      return;
    }


    /*
     * If currently playing:
     * pause.
     */

    if (!audio.paused) {

      audio.pause();

      return;

    }


    /*
     * If we already have an audio source,
     * continue from the same ayah.
     */

    if (audio.src) {

      continuousMode = true;

      try {

        await audio.play();

      } catch (error) {

        console.error(
          "Resume failed:",
          error
        );

      }

      return;

    }


    /*
     * Nothing loaded yet.
     */

    await playSurah();

  }
);


/* =========================================================
   STOP PLAYBACK
========================================================= */

function stopPlayback() {

  continuousMode = false;

  audio.pause();

  audio.currentTime = 0;

  isPlaying = false;

  updatePlayButton();


  if (audioProgress) {

    audioProgress.style.width =
      "0%";

  }


  if (surahData) {

    audioTitle.textContent =
      `${surahData.englishName} · Alafasy`;

  }

}


/* =========================================================
   HIGHLIGHT AYAH
========================================================= */

function highlightAyah(number) {

  /*
   * Remove previous highlights.
   */

  document
    .querySelectorAll(".ayah")
    .forEach(element => {

      element.classList.remove(
        "bg-emerald-500/10",
        "ring-1",
        "ring-emerald-500/30"
      );

    });


  /*
   * Find current ayah.
   */

  const current =
    document.getElementById(
      `ayah-${number}`
    );


  if (!current) {
    return;
  }


  /*
   * Highlight it.
   */

  current.classList.add(
    "bg-emerald-500/10",
    "ring-1",
    "ring-emerald-500/30"
  );


  /*
   * Scroll to it.
   */

  current.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

}


/* =========================================================
   AUDIO PROGRESS
========================================================= */

function updateProgress() {

  if (
    !audioProgress ||
    !audio.duration ||
    !isFinite(audio.duration)
  ) {

    return;

  }


  const percentage =
    (audio.currentTime /
      audio.duration) * 100;


  audioProgress.style.width =
    `${percentage}%`;

}


/* =========================================================
   PLAY BUTTON ICON
========================================================= */

function updatePlayButton() {

  if (!playButton) {
    return;
  }


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


/* =========================================================
   BOOKMARK
========================================================= */

function bookmarkAyah(index) {

  if (!surahData) {
    return;
  }


  const ayah =
    surahData.ayahs[index];


  const key =
    `quran-bookmark-${surahNumber}-${ayah.numberInSurah}`;


  const existing =
    localStorage.getItem(key);


  if (existing) {

    localStorage.removeItem(key);

    return;

  }


  localStorage.setItem(

    key,

    JSON.stringify({

      surah:
        surahNumber,

      ayah:
        ayah.numberInSurah,

      text:
        ayah.text,

      savedAt:
        Date.now()

    })

  );

}


/* =========================================================
   START
========================================================= */

loadSurah();
