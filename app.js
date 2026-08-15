const surahs = [
  ["1", "Al-Fatihah", "الفاتحة", "The Opening", 7],
  ["2", "Al-Baqarah", "البقرة", "The Cow", 286],
  ["3", "Ali 'Imran", "آل عمران", "Family of Imran", 200],
  ["4", "An-Nisa", "النساء", "The Women", 176],
  ["5", "Al-Ma'idah", "المائدة", "The Table Spread", 120],
  ["6", "Al-An'am", "الأنعام", "The Cattle", 165],
  ["7", "Al-A'raf", "الأعراف", "The Heights", 206],
  ["8", "Al-Anfal", "الأنفال", "The Spoils of War", 75],
  ["9", "At-Tawbah", "التوبة", "The Repentance", 129],
  ["10", "Yunus", "يونس", "Jonah", 109],
  ["11", "Hud", "هود", "Hud", 123],
  ["12", "Yusuf", "يوسف", "Joseph", 111]
];

const list = document.getElementById("surahList");
const search = document.getElementById("search");
const count = document.getElementById("count");


function renderSurahs(items) {

  list.innerHTML = items.map(
    ([number, english, arabic, meaning, ayahs]) => {

      return `
        <button
          class="surah w-full rounded-2xl
                 border border-white/5
                 bg-slate-800/70 p-4
                 text-left transition
                 hover:border-emerald-500/40
                 hover:bg-slate-800"
          data-name="${english.toLowerCase()}
                     ${arabic}
                     ${meaning.toLowerCase()}"
        >

          <div
            class="flex items-center gap-4"
          >

            <!-- NUMBER -->

            <div
              class="grid h-10 w-10 shrink-0
                     place-items-center
                     rounded-xl bg-slate-700
                     text-sm font-bold
                     text-emerald-400"
            >
              ${number}
            </div>


            <!-- NAME -->

            <div class="min-w-0 flex-1">

              <h3 class="font-semibold">
                ${english}
              </h3>

              <p
                class="mt-0.5 text-xs
                       text-slate-400"
              >
                ${meaning} · ${ayahs} Ayahs
              </p>

            </div>


            <!-- ARABIC -->

            <div
              class="font-arabic text-xl
                     text-slate-200"
              dir="rtl"
            >
              ${arabic}
            </div>

          </div>

        </button>
      `;
    }
  ).join("");


  count.textContent =
    `${items.length} Surah${items.length === 1 ? "" : "s"}`;


  lucide.createIcons();
}


search.addEventListener("input", () => {

  const query =
    search.value.trim().toLowerCase();


  const filtered =
    surahs.filter(
      ([number, english, arabic, meaning]) => {

        return `${english} ${arabic} ${meaning}`
          .toLowerCase()
          .includes(query);

      }
    );


  renderSurahs(filtered);

});


renderSurahs(surahs);


// Register PWA service worker

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