const API_BASE = "https://api.alquran.cloud/v1";

const list = document.getElementById("surahList");
const search = document.getElementById("search");
const count = document.getElementById("count");

let allSurahs = [];


/*
|--------------------------------------------------------------------------
| Load all 114 Surahs
|--------------------------------------------------------------------------
*/

async function loadSurahs() {

  try {

    list.innerHTML = `
      <div class="py-10 text-center">

        <div
          class="mx-auto h-8 w-8 animate-spin
                 rounded-full border-2
                 border-slate-600
                 border-t-emerald-400"
        ></div>

        <p class="mt-4 text-sm text-slate-400">
          Loading Quran...
        </p>

      </div>
    `;


    const response = await fetch(
      `${API_BASE}/surah`
    );


    if (!response.ok) {
      throw new Error("Unable to load Surahs");
    }


    const result = await response.json();


    allSurahs = result.data;


    renderSurahs(allSurahs);


  } catch (error) {

    console.error(error);


    list.innerHTML = `
      <div
        class="rounded-2xl border
               border-red-500/20
               bg-red-500/10 p-5 text-center"
      >

        <i
          data-lucide="wifi-off"
          class="mx-auto h-7 w-7
                 text-red-400"
        ></i>

        <p class="mt-3 font-semibold">
          Couldn't load the Quran
        </p>

        <p class="mt-1 text-sm text-slate-400">
          Please check your internet connection.
        </p>

        <button
          onclick="loadSurahs()"
          class="mt-4 rounded-xl
                 bg-emerald-500 px-5 py-2.5
                 text-sm font-semibold
                 text-slate-950"
        >
          Try again
        </button>

      </div>
    `;

    lucide.createIcons();

  }

}


/*
|--------------------------------------------------------------------------
| Render Surahs
|--------------------------------------------------------------------------
*/

function renderSurahs(surahs) {

  if (!surahs.length) {

    list.innerHTML = `
      <div class="py-10 text-center">

        <i
          data-lucide="search-x"
          class="mx-auto h-8 w-8
                 text-slate-600"
        ></i>

        <p class="mt-3 font-semibold">
          No Surah found
        </p>

        <p class="mt-1 text-sm text-slate-500">
          Try another search.
        </p>

      </div>
    `;

    count.textContent = "0 Surahs";

    lucide.createIcons();

    return;
  }


  list.innerHTML = surahs.map(surah => {

    return `

      <button
        class="surah w-full rounded-2xl
               border border-white/5
               bg-slate-800/70
               p-4 text-left
               transition
               active:scale-[0.98]
               hover:border-emerald-500/40
               hover:bg-slate-800"
        data-surah="${surah.number}"
      >

        <div
          class="flex items-center gap-4"
        >


          <!-- SURAH NUMBER -->

          <div
            class="grid h-10 w-10
                   shrink-0 place-items-center
                   rounded-xl bg-slate-700
                   text-sm font-bold
                   text-emerald-400"
          >

            ${surah.number}

          </div>


          <!-- SURAH INFORMATION -->

          <div
            class="min-w-0 flex-1"
          >

            <h3
              class="font-semibold
                     text-white"
            >
              ${surah.englishName}
            </h3>


            <p
              class="mt-0.5 text-xs
                     text-slate-400"
            >

              ${surah.englishNameTranslation}

              ·

              ${surah.numberOfAyahs} Ayahs

            </p>

          </div>


          <!-- ARABIC NAME -->

          <div
            class="font-arabic
                   text-xl
                   text-slate-200"
            dir="rtl"
          >

            ${surah.name}

          </div>

        </div>

      </button>

    `;

  }).join("");


  count.textContent =
    `${surahs.length} Surah${surahs.length === 1 ? "" : "s"}`;


  lucide.createIcons();


  /*
  |--------------------------------------------------------------------------
  | Open Surah
  |--------------------------------------------------------------------------
  */

  document
    .querySelectorAll(".surah")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const surahNumber =
            button.dataset.surah;

          openSurah(surahNumber);

        }
      );

    });

}


/*
|--------------------------------------------------------------------------
| Search
|--------------------------------------------------------------------------
*/

search.addEventListener("input", () => {

  const query =
    search.value
      .trim()
      .toLowerCase();


  if (!query) {

    renderSurahs(allSurahs);

    return;

  }


  const filtered =
    allSurahs.filter(surah => {

      return (

        surah.englishName
          .toLowerCase()
          .includes(query)

        ||

        surah.englishNameTranslation
          .toLowerCase()
          .includes(query)

        ||

        surah.name
          .includes(query)

        ||

        String(surah.number)
          .includes(query)

      );

    });


  renderSurahs(filtered);

});


/*
|--------------------------------------------------------------------------
| Open Surah
|--------------------------------------------------------------------------
*/

function openSurah(number) {

  window.location.href =
    `surah.html?surah=${number}`;

}


/*
|--------------------------------------------------------------------------
| Start App
|--------------------------------------------------------------------------
*/

loadSurahs();


/*
|--------------------------------------------------------------------------
| Service Worker
|--------------------------------------------------------------------------
*/

if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("sw.js")
    .catch(error => {

      console.log(
        "Service worker registration failed:",
        error
      );

    });

}
