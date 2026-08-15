const API = "https://api.alquran.cloud/v1";

const params = new URLSearchParams(window.location.search);

const surahNumber = Number(
  params.get("surah") || 1
);

const title = document.getElementById("surahTitle");
const content = document.getElementById("quranContent");
const audioBar = document.getElementById("audioBar");
const playButton = document.getElementById("playButton");
const audioTitle = document.getElementById("audioTitle");
const seekBar = document.getElementById("seekBar");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const previousButton = document.getElementById("previousAyahButton");
const nextButton = document.getElementById("nextAyahButton");

const audio = new Audio();

let surah = null;
let translation = null;
let currentAyahIndex = 0;
let playing = false;
let timestamps = [];


/* =========================================================
   BISMILLAH
========================================================= */

const BISMILLAH =
  "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";


/* =========================================================
   NORMALIZE ARABIC
========================================================= */

function normalizeArabic(text) {

  return text
    .normalize("NFD")

    /*
     * Remove Arabic harakat / tashkeel.
     */

    .replace(
      /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g,
      ""
    )

    /*
     * Normalize Alef forms.
     */

    .replace(/[إأٱآ]/g, "ا")

    /*
     * Normalize Hamza.
     */

    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")

    /*
     * Remove tatweel.
     */

    .replace(/ـ/g, "")

    /*
     * Normalize whitespace.
     */

    .replace(/\s+/g, " ")

    .trim();
}


/* =========================================================
   REMOVE BISMILLAH FROM FIRST AYAH
========================================================= */

function removeBismillahFromFirstAyah(text) {

  if (!text) {
    return text;
  }


  const original =
    text.trim();


  const normalizedText =
    normalizeArabic(original);


  const normalizedBismillah =
    normalizeArabic(BISMILLAH);


  /*
   * If the normalized first part is Bismillah,
   * remove it from the ORIGINAL text.
   */

  if (
    normalizedText.startsWith(
      normalizedBismillah
    )
  ) {

    /*
     * We remove the first four Arabic
     * words from the original text.
     *
     * This preserves all remaining
     * Quran text and tashkeel.
     */

    let result = original;

    let removedWords = 0;

    while (
      removedWords < 4 &&
      result.length > 0
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

      removedWords++;

    }


    return result;

  }


  /*
   * Some editions may contain the
   * Bismillah without spaces.
   *
   * Try a second normalized comparison.
   */

  const compactText =
    normalizedText.replace(
      /\s/g,
      ""
    );


  const compactBismillah =
    normalizedBismillah.replace(
      /\s/g,
      ""
    );


  if (
    compactText.startsWith(
      compactBismillah
    )
  ) {

    let result = original;

    let wordsRemoved = 0;

    while (
      wordsRemoved < 4 &&
      result.length > 0
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

      wordsRemoved++;

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
        "Could not load Quran"
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
     * Never delete the first ayah.
     * Never change its number.
     *
     * We only create displayText.
     */

    surah.ayahs.forEach(
      ayah => {

        ayah.displayText =
          ayah.text;

      }
    );


    /*
     * For every Surah except Al-Fatihah
     * and At-Tawbah, the external Bismillah
     * is displayed separately.
     *
     * Therefore remove the Bismillah prefix
     * from the displayed first ayah.
     */

    if (
      surah.number !== 1 &&
      surah.number !== 9 &&
      surah.ayahs.length > 0
    ) {

      surah.ayahs[0].displayText =
        removeBismillahFromFirstAyah(
          surah.ayahs[0].text
        );

    }


    title.textContent =
      surah.englishName;


    audioTitle.textContent =
      `${surah.englishName} · Alafasy`;


    renderSurah();


    setupAudio();

  } catch (error) {

    console.error(error);


    content.innerHTML = `

      <div
        class="py-16 text-center"
      >

        <i
          data-lucide="wifi-off"
          class="mx-auto h-8 w-8 text-red-400"
        ></i>


        <p
          class="mt-4 font-semibold"
        >
          Couldn't load this Surah
        </p>


        <p
          class="mt-2 text-sm text-slate-400"
        >
          Check your internet connection.
        </p>


        <button
          onclick="loadSurah()"
          class="
            mt-5
            rounded-xl
            bg-emerald-500
            px-5
            py-2.5
            font-semibold
            text-slate-950
          "
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

function renderSurah() {

  let html = `

    <section
      class="
        mb-8
        w-full
        rounded-3xl
        bg-gradient-to-br
        from-emerald-600
        to-teal-800
        p-6
        text-center
      "
    >

      <p
        class="text-sm text-emerald-100"
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
        class="mt-3 text-xl font-bold"
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
   * Display Bismillah separately.
   *
   * Al-Fatihah:
   * already contains Bismillah in its
   * actual Quran text.
   *
   * At-Tawbah:
   * does not begin with Bismillah.
   */

  if (
    surah.number !== 1 &&
    surah.number !== 9
  ) {

    html += `

      <div
        class="
          mb-8
          w-full
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
          lang="ar"
        >
          ${BISMILLAH}
        </p>

      </div>

    `;

  }


  /*
   * AYAH LIST
   */

  html += `

    <div
      class="
        w-full
        space-y-5
      "
    >

      ${surah.ayahs.map(
        (ayah, index) => {

          const translatedAyah =
            translation.ayahs[index];


          const displayText =
            ayah.displayText ||
            ayah.text;


          return `

            <article
              id="ayah-${ayah.numberInSurah}"
              data-ayah-index="${index}"
              class="
                ayah
                w-full
                min-w-0
                overflow-hidden
                rounded-2xl
                border
                border-transparent
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
                  onclick="
                    playFromAyah(${index})
                  "
                  class="
                    rounded-full
                    border
                    border-white/10
                    p-2.5
                    text-slate-400
                    active:scale-95
                  "
                  aria-label="Play from Ayah"
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
                lang="ar"
              >
                ${displayText}
              </p>


              <p
                class="
                  translation
                  mt-5
                  w-full
                  text-sm
                  leading-7
                  text-slate-400
                "
              >
                ${translatedAyah.text}
              </p>

            </article>

          `;

        }
      ).join("")}

    </div>

  `;


  content.innerHTML =
    html;


  lucide.createIcons();

}


/* =========================================================
   AUDIO SETUP
========================================================= */

function setupAudio() {

  audio.src =
    `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNumber}.mp3`;


  audio.preload =
    "metadata";


  audioBar.classList.remove(
    "hidden"
  );


  audio.addEventListener(
    "loadedmetadata",
    () => {

      durationEl.textContent =
        formatTime(
          audio.duration
        );

    }
  );


  audio.addEventListener(
    "timeupdate",
    updateAudio
  );


  audio.addEventListener(
    "play",
    () => {

      playing = true;

      updatePlayIcon();

    }
  );


  audio.addEventListener(
    "pause",
    () => {

      playing = false;

      updatePlayIcon();

    }
  );


  audio.addEventListener(
    "ended",
    () => {

      playing = false;

      updatePlayIcon();

    }
  );

}


/* =========================================================
   PLAY / PAUSE
========================================================= */

playButton.addEventListener(
  "click",
  async () => {

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
);


/* =========================================================
   AUDIO UPDATE
========================================================= */

function updateAudio() {

  if (
    !audio.duration ||
    !isFinite(audio.duration)
  ) {

    return;

  }


  const percentage =
    (
      audio.currentTime /
      audio.duration
    ) * 100;


  seekBar.value =
    percentage;


  currentTimeEl.textContent =
    formatTime(
      audio.currentTime
    );


  durationEl.textContent =
    formatTime(
      audio.duration
    );


  updateAyahHighlight();

}


/* =========================================================
   AYAH HIGHLIGHT
========================================================= */

function updateAyahHighlight() {

  /*
   * Exact timestamp support will be
   * connected here.
   *
   * We intentionally don't use the
   * inaccurate "audio percentage =
   * ayah percentage" method.
   */

  if (
    !timestamps.length
  ) {

    return;

  }


  const time =
    audio.currentTime;


  for (
    let i = 0;
    i < timestamps.length;
    i++
  ) {

    const item =
      timestamps[i];


    if (
      time >= item.start &&
      time < item.end
    ) {

      if (
        currentAyahIndex !==
        item.index
      ) {

        currentAyahIndex =
          item.index;


        highlightAyah(
          item.index
        );

      }


      break;

    }

  }

}


/* =========================================================
   HIGHLIGHT AYAH
========================================================= */

function highlightAyah(
  index
) {

  document
    .querySelectorAll(".ayah")
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


  element.scrollIntoView({

    behavior: "smooth",

    block: "center"

  });

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
    Math.max(
      0,
      Math.min(
        index,
        surah.ayahs.length - 1
      )
    );


  const timing =
    timestamps.find(
      item =>
        item.index ===
        currentAyahIndex
    );


  if (timing) {

    audio.currentTime =
      timing.start;

  }


  highlightAyah(
    currentAyahIndex
  );


  try {

    await audio.play();

  } catch (error) {

    console.error(error);

  }

}


/* =========================================================
   NEXT
========================================================= */

nextButton.addEventListener(
  "click",
  () => {

    if (!surah) {
      return;
    }


    const next =
      currentAyahIndex + 1;


    if (
      next >=
      surah.ayahs.length
    ) {

      return;

    }


    playFromAyah(
      next
    );

  }
);


/* =========================================================
   PREVIOUS
========================================================= */

previousButton.addEventListener(
  "click",
  () => {

    if (!surah) {
      return;
    }


    const previous =
      currentAyahIndex - 1;


    if (
      previous < 0
    ) {

      audio.currentTime =
        0;

      highlightAyah(
        0
      );

      return;

    }


    playFromAyah(
      previous
    );

  }
);


/* =========================================================
   SEEK
========================================================= */

seekBar.addEventListener(
  "input",
  () => {

    if (
      !audio.duration ||
      !isFinite(audio.duration)
    ) {

      return;

    }


    audio.currentTime =
      (
        Number(
          seekBar.value
        ) / 100
      ) *
      audio.duration;

  }
);


/* =========================================================
   PLAY ICON
========================================================= */

function updatePlayIcon() {

  playButton.innerHTML =
    playing

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
   TIME FORMAT
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

loadSurah();
