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


async function loadSurah() {

  try {

    const response = await fetch(

      `${API_BASE}/surah/${surahNumber}/quran-uthmani`

    );


    if (!response.ok) {

      throw new Error(
        "Failed to load Surah"
      );

    }


    const result =
      await response.json();


    const surah =
      result.data;


    title.textContent =
      surah.englishName;


    renderSurah(surah);


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


function renderSurah(surah) {

  content.innerHTML = `

    <!-- SURAH HEADER -->

    <section
      class="mb-8
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


    <!-- BISMILLAH -->

    ${
      surah.number !== 9
        ? `
          <div
            class="mb-8
                   text-center
                   font-arabic
                   text-2xl
                   text-slate-200"
            dir="rtl"
          >
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </div>
        `
        : ""
    }


    <!-- AYAHS -->

    <div
      class="space-y-8"
    >

      ${surah.ayahs.map(
        ayah => `

          <article
            class="border-b
                   border-white/5
                   pb-7"
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


              <button
                class="rounded-full
                       border
                       border-white/10
                       p-2
                       text-slate-400"
                aria-label="Ayah options"
              >

                <i
                  data-lucide="more-horizontal"
                  class="h-5 w-5"
                ></i>

              </button>

            </div>


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


            <div
              class="mt-5
                     flex
                     items-center
                     justify-end
                     gap-2"
            >

              <button
                class="rounded-full
                       border
                       border-white/10
                       p-2.5
                       text-slate-400
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

          </article>

        `
      ).join("")}

    </div>

  `;


  lucide.createIcons();

}


loadSurah();
