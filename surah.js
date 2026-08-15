const API_BASE = "https://api.alquran.cloud/v1";

const params = new URLSearchParams(window.location.search);
const surahNumber = params.get("surah") || "1";

const title = document.getElementById("surahTitle");
const content = document.getElementById("quranContent");
const audioBar = document.getElementById("audioBar");
const playButton = document.getElementById("playButton");
const audioTitle = document.getElementById("audioTitle");

let surahData = null;
let audio = null;
let isPlaying = false;


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

    title.textContent = arabic.englishName;

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
          class="mt-4 rounded-xl bg-emerald-500
                 px-5 py-2.5 font-semibold
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


    ${
      surah.number !== 9
        ? `
          <div
            class="mb-8 text-center
                   font-arabic text-2xl
                   text-slate-200"
            dir="rtl"
          >
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </div>
        `
        : ""
    }


    <div class="space-y-8">

      ${surah.ayahs.map((ayah, index) => {

        const translation =
          surah.translationAyahs[index];

        return `

          <article
            id="ayah-${ayah.numberInSurah}"
            class="ayah border-b
                   border-white/5 pb-7
                   transition-all duration-300"
          >

            <div
              class="mb-4 flex
                     items-center
                     justify-between"
            >

              <span
                class="grid h-9 w-9
                       place-items-center
                       rounded-full
                       bg-emerald-500/10
                       text-xs font-bold
                       text-emerald-400"
              >
                ${ayah.numberInSurah}
              </span>

              <div class="flex gap-2">

                <button
                  onclick="playAyah(${index})"
                  class="rounded-full
                         border border-white/10
                         p-2.5 text-slate-400
                         hover:text-emerald-400"
                  aria-label="Play ayah"
                >

                  <i
                    data-lucide="play"
                    class="h-4 w-4"
                  ></i>

                </button>

                <button
                  class="rounded-full
                         border border-white/10
                         p-2.5 text-slate-400"
                  aria-label="Bookmark ayah"
                >

                  <i
                    data-lucide="bookmark"
                    class="h-4 w-4"
                  ></i>

                </button>

              </div>

            </div>


            <p
              class="font-arabic
                     text-right text-3xl
                     leading-[2.4]
                     text-white"
              dir="rtl"
            >
              ${ayah.text}
            </p>


            <p
              class="mt-5 text-sm
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
   AUDIO
========================================================= */

function setupAudio() {

  /*
   * Al Quran Cloud provides CDN audio resources.
   * We use a recitation endpoint rather than
   * extracting audio from YouTube.
   */

  audio = new Audio();

  audio.preload = "none";

  audioTitle.textContent =
    `${surahData.englishName} · Alafasy`;

  audioBar.classList.remove("hidden");

  audio.addEventListener("play", () => {

    isPlaying = true;

    updatePlayButton();

  });


  audio.addEventListener("pause", () => {

    isPlaying = false;

    updatePlayButton();

  });


  audio.addEventListener("ended", () => {

    isPlaying = false;

    updatePlayButton();

  });

}


/* =========================================================
   PLAY SURAH
========================================================= */

function playSurah() {

  if (!audio) return;

  /*
   * Reciter:
   * Mishary Rashid Alafasy
   */

  audio.src =
    `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNumber}.mp3`;

  audio.play()
    .catch(error => {

      console.error(
        "Audio playback failed:",
        error
      );

    });

}


/* =========================================================
   MAIN PLAY BUTTON
========================================================= */

playButton.addEventListener(
  "click",
  () => {

    if (!audio) return;


    if (isPlaying) {

      audio.pause();

    } else {

      if (!audio.src) {
        playSurah();
      } else {
        audio.play();
      }

    }

  }
);


/* =========================================================
   PLAY INDIVIDUAL AYAH
========================================================= */

async function playAyah(index) {

  if (!surahData) return;

  const ayah =
    surahData.ayahs[index];


  /*
   * For the next iteration we will use
   * individual ayah audio URLs.
   */

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


    if (!result.data.audio) {
      throw new Error(
        "No audio URL returned"
      );
    }


    audio.src =
      result.data.audio;


    highlightAyah(
      ayah.numberInSurah
    );


    audio.play();

  } catch (error) {

    console.error(
      "Ayah audio error:",
      error
    );

  }

}


/* =========================================================
   HIGHLIGHT CURRENT AYAH
========================================================= */

function highlightAyah(number) {

  document
    .querySelectorAll(".ayah")
    .forEach(element => {

      element.classList.remove(
        "rounded-2xl",
        "bg-emerald-500/10",
        "p-4"
      );

    });


  const current =
    document.getElementById(
      `ayah-${number}`
    );


  if (current) {

    current.classList.add(
      "rounded-2xl",
      "bg-emerald-500/10",
      "p-4"
    );


    current.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  }

}


/* =========================================================
   PLAY BUTTON ICON
========================================================= */

function updatePlayButton() {

  playButton.innerHTML = isPlaying

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
   START
========================================================= */

loadSurah();
