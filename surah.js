const API_URL = "https://api.alquran.cloud/v1";
const AUDIO_BASE = "https://everyayah.com/data";

const params = new URLSearchParams(window.location.search);
const surahNumber = parseInt(params.get("surah") || "1", 10);

let surah = null;
let currentAyah = 0;
let isPlaying = false;
let repeatSurah = false;
let playbackSpeed = 1;
let changingAyah = false;

let reciter =
    localStorage.getItem("quran_reciter") ||
    "Alafasy_128kbps";

const audio = new Audio();
audio.preload = "auto";


/* =========================================================
   ELEMENTS
========================================================= */

function getElement(id) {
    return document.getElementById(id);
}

const content = getElement("quranContent");
const title = getElement("surahTitle");
const audioBar = getElement("audioBar");

const playButton = getElement("playButton");
const fullPlayButton = getElement("fullPlayButton");

const nextButton = getElement("nextAyahButton");
const previousButton = getElement("previousAyahButton");

const fullNextButton = getElement("fullNextButton");
const fullPreviousButton = getElement("fullPreviousButton");

const seekBar = getElement("seekBar");
const currentTimeElement = getElement("currentTime");
const remainingTimeElement = getElement("remainingTime");

const audioTitle = getElement("audioTitle");
const audioSubtitle = getElement("audioSubtitle");

const fullPlayerTitle = getElement("fullPlayerTitle");
const fullPlayerReciter = getElement("fullPlayerReciter");

const repeatButton = getElement("repeatButton");
const repeatLabel = getElement("repeatLabel");

const speedButton = getElement("speedButton");
const speedLabel = getElement("speedLabel");

const reciterSelect = getElement("reciterSelect");

const currentAyahLabel = getElement("currentAyahLabel");

const miniDisc = getElement("miniDisc");
const fullDisc = getElement("fullDisc");

const miniProgress = getElement("miniProgress");

const playerSheet = getElement("playerSheet");
const playerOverlay = getElement("playerOverlay");

const openPlayerButton = getElement("openPlayerButton");
const openPlayerButton2 = getElement("openPlayerButton2");
const closePlayerButton = getElement("closePlayerButton");

const backButton = getElement("backButton");


/* =========================================================
   RECITERS
========================================================= */

const reciters = {
    "Alafasy_128kbps": "Mishary Rashid Alafasy",
    "Abdul_Basit_Murattal_192kbps": "Abdul Basit Abdul Samad",
    "Abdurrahmaan_As-Sudais_192kbps": "Abdul Rahman Al-Sudais",
    "Husary_128kbps": "Mahmoud Khalil Al-Husary",
    "Saood_ash-Shuraym_128kbps": "Saud Al-Shuraim",
    "Abu_Bakr_Ash-Shaatree_128kbps": "Abu Bakr Al-Shatri"
};


/* =========================================================
   BISMILLAH
========================================================= */

const BISMILLAH =
    "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(seconds) {

    if (
        !isFinite(seconds) ||
        seconds < 0
    ) {
        return "0:00";
    }

    const minutes =
        Math.floor(seconds / 60);

    const secondsPart =
        Math.floor(seconds % 60);

    return (
        minutes +
        ":" +
        String(secondsPart).padStart(2, "0")
    );
}


/* =========================================================
   NORMALIZE ARABIC
   Used ONLY to detect Bismillah.
========================================================= */

function normalizeArabic(text) {

    if (!text) {
        return "";
    }

    return text
        .normalize("NFD")
        .replace(
            /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g,
            ""
        )
        .replace(/[إأٱآ]/g, "ا")
        .replace(/ـ/g, "")
        .replace(/\s+/g, " ")
        .trim();
}


/* =========================================================
   REMOVE BISMILLAH FROM DISPLAY TEXT
========================================================= */

function removeBismillah(text) {

    if (!text) {
        return "";
    }

    const original = text.trim();

    const normalizedText =
        normalizeArabic(original);

    const normalizedBismillah =
        normalizeArabic(BISMILLAH);


    if (
        normalizedText.indexOf(
            normalizedBismillah
        ) === 0
    ) {

        /*
         * Remove the first words based on
         * the original Arabic text.
         */

        const words =
            original.split(/\s+/);

        const bismillahWords =
            BISMILLAH.split(/\s+/);

        return words
            .slice(bismillahWords.length)
            .join(" ")
            .trim();
    }


    return original;
}


/* =========================================================
   GET AUDIO URL
========================================================= */

function getAudioUrl(index) {

    if (
        !surah ||
        !surah.ayahs ||
        !surah.ayahs[index]
    ) {
        return "";
    }


    const ayah =
        surah.ayahs[index];


    const surahPart =
        String(surah.number)
            .padStart(3, "0");


    const ayahPart =
        String(ayah.numberInSurah)
            .padStart(3, "0");


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

        if (
            isNaN(surahNumber) ||
            surahNumber < 1 ||
            surahNumber > 114
        ) {
            throw new Error(
                "Invalid Surah number"
            );
        }


        const response =
            await fetch(
                API_URL +
                "/surah/" +
                surahNumber +
                "/quran-uthmani"
            );


        if (!response.ok) {
            throw new Error(
                "Could not load Quran data"
            );
        }


        const result =
            await response.json();


        if (
            !result.data ||
            !result.data.ayahs
        ) {
            throw new Error(
                "No Surah data returned"
            );
        }


        surah =
            result.data;


        prepareAyahText();

        renderSurah();

        updateTitles();

        if (audioBar) {
            audioBar.classList.remove(
                "hidden"
            );
        }


        prepareAudio();


    } catch (error) {

        console.error(error);


        if (content) {

            content.innerHTML =
                '<div class="py-16 text-center">' +

                '<p class="text-red-400 font-semibold">' +
                "Unable to load Surah." +
                "</p>" +

                '<p class="mt-2 text-sm text-slate-400">' +
                "Please check your internet connection." +
                "</p>" +

                "</div>";
        }
    }
}


/* =========================================================
   PREPARE AYAH TEXT
========================================================= */

function prepareAyahText() {

    if (
        !surah ||
        !surah.ayahs
    ) {
        return;
    }


    for (
        let i = 0;
        i < surah.ayahs.length;
        i++
    ) {

        const ayah =
            surah.ayahs[i];


        /*
         * IMPORTANT:
         *
         * Al-Fatihah:
         * Bismillah IS Ayah 1.
         *
         * At-Tawbah:
         * No Bismillah.
         *
         * All other Surahs:
         * Bismillah is displayed separately.
         *
         * We remove Bismillah ONLY from the
         * displayed text of the first ayah.
         *
         * The audio numbering is NOT changed.
         */

        if (
            surah.number !== 1 &&
            surah.number !== 9 &&
            i === 0
        ) {

            ayah.displayText =
                removeBismillah(
                    ayah.text
                );

        } else {

            ayah.displayText =
                ayah.text;
        }
    }
}


/* =========================================================
   RENDER SURAH
========================================================= */

function renderSurah() {

    if (
        !content ||
        !surah
    ) {
        return;
    }


    let html = "";


    /* -----------------------------------------------------
       SURAH HEADER
    ----------------------------------------------------- */

    html +=
        '<section class="' +
        "mb-7 rounded-3xl bg-gradient-to-br " +
        "from-emerald-700 to-teal-800 p-6 text-center" +
        '">' +

        '<p class="text-xs uppercase tracking-widest text-emerald-100">' +
        "Surah " +
        surah.number +
        "</p>" +

        '<h2 dir="rtl" class="mt-2 font-arabic text-4xl font-bold">' +
        surah.name +
        "</h2>" +

        '<h3 class="mt-3 text-xl font-bold">' +
        surah.englishName +
        "</h3>" +

        '<p class="mt-1 text-sm text-emerald-100">' +
        surah.englishNameTranslation +
        "</p>" +

        '<p class="mt-3 text-xs text-emerald-100">' +
        surah.numberOfAyahs +
        " Ayahs" +
        "</p>" +

        "</section>";


    /* -----------------------------------------------------
       SEPARATE BISMILLAH
    ----------------------------------------------------- */

    if (
        surah.number !== 1 &&
        surah.number !== 9
    ) {

        html +=
            '<div class="mb-8 text-center">' +

            '<p dir="rtl" class="' +
            "font-arabic text-3xl leading-loose text-slate-200" +
            '">' +

            BISMILLAH +

            "</p>" +

            "</div>";
    }


    /* -----------------------------------------------------
       AYAH LIST
    ----------------------------------------------------- */

    html +=
        '<div class="space-y-3">';


    for (
        let i = 0;
        i < surah.ayahs.length;
        i++
    ) {

        const ayah =
            surah.ayahs[i];


        html +=
            '<article ' +

            'id="ayah-' +
            ayah.numberInSurah +
            '" ' +

            'data-index="' +
            i +
            '" ' +

            'class="ayah rounded-2xl p-4">' +


            '<div class="' +
            "mb-5 flex items-center justify-between" +
            '">' +


            '<span class="' +
            "grid h-9 w-9 place-items-center rounded-full " +
            "bg-emerald-500/10 text-xs font-bold text-emerald-400" +
            '">' +

            ayah.numberInSurah +

            "</span>" +


            '<button ' +

            'type="button" ' +

            'class="ayahPlayButton grid h-9 w-9 place-items-center rounded-full bg-white/5" ' +

            'data-index="' +
            i +
            '">' +

            '<i data-lucide="play" class="h-4 w-4"></i>' +

            "</button>" +


            "</div>" +


            '<p dir="rtl" class="quran-arabic text-white">' +

            ayah.displayText +

            "</p>" +


            '<p class="translation mt-5 text-sm leading-7 text-slate-400" ' +

            'data-translation-index="' +
            i +
            '">' +

            "</p>" +


            "</article>";
    }


    html +=
        "</div>";


    content.innerHTML =
        html;


    setupAyahButtons();


    if (window.lucide) {
        lucide.createIcons();
    }
}


/* =========================================================
   AYAH BUTTONS
========================================================= */

function setupAyahButtons() {

    const buttons =
        document.querySelectorAll(
            ".ayahPlayButton"
        );


    buttons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    const index =
                        parseInt(
                            button.getAttribute(
                                "data-index"
                            ),
                            10
                        );


                    playAyah(index);
                }
            );
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


    const reciterName =
        reciters[reciter] ||
        "Mishary Rashid Alafasy";


    if (title) {
        title.textContent =
            surah.englishName;
    }


    if (audioTitle) {
        audioTitle.textContent =
            surah.englishName;
    }


    if (audioSubtitle) {
        audioSubtitle.textContent =
            reciterName;
    }


    if (fullPlayerTitle) {
        fullPlayerTitle.textContent =
            surah.englishName;
    }


    if (fullPlayerReciter) {
        fullPlayerReciter.textContent =
            reciterName;
    }
}


/* =========================================================
   PREPARE AUDIO
========================================================= */

function prepareAudio() {

    if (!surah) {
        return;
    }


    const url =
        getAudioUrl(
            currentAyah
        );


    if (!url) {
        return;
    }


    audio.pause();

    audio.src =
        url;

    audio.playbackRate =
        playbackSpeed;

    audio.load();


    updateHighlight();
}


/* =========================================================
   PLAY AYAH
========================================================= */

async function playAyah(index) {

    if (!surah) {
        return;
    }


    if (
        index < 0 ||
        index >= surah.ayahs.length
    ) {
        return;
    }


    changingAyah =
        true;


    currentAyah =
        index;


    audio.pause();


    audio.src =
        getAudioUrl(index);


    audio.playbackRate =
        playbackSpeed;


    updateHighlight();


    try {

        await waitForAudio();

        await audio.play();


        isPlaying =
            true;


        updatePlayButton();

        updateVinyl();


    } catch (error) {

        console.error(
            "Audio playback error:",
            error
        );


        isPlaying =
            false;


        updatePlayButton();

        updateVinyl();
    }


    changingAyah =
        false;
}


/* =========================================================
   WAIT FOR AUDIO
========================================================= */

function waitForAudio() {

    return new Promise(
        function(resolve, reject) {

            if (
                audio.readyState >= 3
            ) {

                resolve();

                return;
            }


            let finished =
                false;


            const timeout =
                setTimeout(
                    function() {

                        if (finished) {
                            return;
                        }


                        finished =
                            true;


                        cleanup();


                        reject(
                            new Error(
                                "Audio loading timeout"
                            )
                        );

                    },
                    15000
                );


            function cleanup() {

                clearTimeout(
                    timeout
                );


                audio.removeEventListener(
                    "canplay",
                    ready
                );


                audio.removeEventListener(
                    "error",
                    failed
                );
            }


            function ready() {

                if (finished) {
                    return;
                }


                finished =
                    true;


                cleanup();


                resolve();
            }


            function failed() {

                if (finished) {
                    return;
                }


                finished =
                    true;


                cleanup();


                reject(
                    new Error(
                        "Audio failed to load"
                    )
                );
            }


            audio.addEventListener(
                "canplay",
                ready
            );


            audio.addEventListener(
                "error",
                failed
            );
        }
    );
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

            if (!audio.src) {

                audio.src =
                    getAudioUrl(
                        currentAyah
                    );

                audio.load();
            }


            await waitForAudio();


            await audio.play();


            isPlaying =
                true;


            updatePlayButton();

            updateVinyl();


        } catch (error) {

            console.error(
                "Could not start playback:",
                error
            );
        }


    } else {

        audio.pause();


        isPlaying =
            false;


        updatePlayButton();

        updateVinyl();
    }
}


/* =========================================================
   CONTINUOUS PLAYBACK
========================================================= */

audio.addEventListener(
    "ended",
    function() {

        if (changingAyah) {
            return;
        }


        if (!surah) {
            return;
        }


        const next =
            currentAyah + 1;


        /*
         * Continue through the Surah.
         */

        if (
            next <
            surah.ayahs.length
        ) {

            playAyah(
                next
            );

            return;
        }


        /*
         * Entire Surah finished.
         */

        if (repeatSurah) {

            playAyah(0);

            return;
        }


        /*
         * Repeat OFF.
         * Stop.
         */

        isPlaying =
            false;


        updatePlayButton();

        updateVinyl();

        updateHighlight();
    }
);


/* =========================================================
   PLAY EVENT
========================================================= */

audio.addEventListener(
    "play",
    function() {

        isPlaying =
            true;


        updatePlayButton();

        updateVinyl();
    }
);


/* =========================================================
   PAUSE EVENT
========================================================= */

audio.addEventListener(
    "pause",
    function() {

        if (changingAyah) {
            return;
        }


        if (audio.ended) {
            return;
        }


        isPlaying =
            false;


        updatePlayButton();

        updateVinyl();
    }
);


/* =========================================================
   HIGHLIGHT
========================================================= */

function updateHighlight() {

    const ayahs =
        document.querySelectorAll(
            ".ayah"
        );


    ayahs.forEach(
        function(element) {

            element.classList.remove(
                "active"
            );
        }
    );


    if (!surah) {
        return;
    }


    const ayah =
        surah.ayahs[
            currentAyah
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


    if (currentAyahLabel) {

        currentAyahLabel.textContent =
            "Ayah " +
            ayah.numberInSurah +
            " of " +
            surah.numberOfAyahs;
    }


    if (isPlaying) {

        element.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}


/* =========================================================
   PLAY BUTTON UI
========================================================= */

function updatePlayButton() {

    const iconName =
        isPlaying
            ? "pause"
            : "play";


    if (playButton) {

        playButton.innerHTML =
            '<i data-lucide="' +
            iconName +
            '" class="h-5 w-5"></i>';
    }


    if (fullPlayButton) {

        fullPlayButton.innerHTML =
            '<i data-lucide="' +
            iconName +
            '" class="h-7 w-7"></i>';
    }


    if (window.lucide) {
        lucide.createIcons();
    }
}


/* =========================================================
   VINYL
========================================================= */

function updateVinyl() {

    if (miniDisc) {

        miniDisc.classList.toggle(
            "spinning",
            isPlaying
        );
    }


    if (fullDisc) {

        fullDisc.classList.toggle(
            "spinning",
            isPlaying
        );
    }
}


/* =========================================================
   NEXT AYAH
========================================================= */

function nextAyah() {

    if (!surah) {
        return;
    }


    const next =
        currentAyah + 1;


    if (
        next <
        surah.ayahs.length
    ) {

        playAyah(
            next
        );
    }
}


/* =========================================================
   PREVIOUS AYAH
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
        currentAyah - 1;


    if (
        previous >= 0
    ) {

        playAyah(
            previous
        );
    }
}


/* =========================================================
   REPEAT WHOLE SURAH
========================================================= */

function toggleRepeat() {

    repeatSurah =
        !repeatSurah;


    if (repeatButton) {

        repeatButton.classList.toggle(
            "text-emerald-400",
            repeatSurah
        );


        repeatButton.classList.toggle(
            "border-emerald-400",
            repeatSurah
        );
    }


    if (repeatLabel) {

        repeatLabel.textContent =
            repeatSurah
                ? "Repeat Surah on"
                : "Repeat off";
    }
}


/* =========================================================
   PLAYBACK SPEED
========================================================= */

function changeSpeed() {

    const speeds = [
        0.75,
        1,
        1.25,
        1.5,
        2
    ];


    let position =
        speeds.indexOf(
            playbackSpeed
        );


    if (position === -1) {
        position = 1;
    }


    position =
        position + 1;


    if (
        position >=
        speeds.length
    ) {

        position = 0;
    }


    playbackSpeed =
        speeds[position];


    audio.playbackRate =
        playbackSpeed;


    if (speedLabel) {

        speedLabel.textContent =
            playbackSpeed +
            "x";
    }
}


/* =========================================================
   SEEK
========================================================= */

if (seekBar) {

    seekBar.addEventListener(
        "input",
        function() {

            if (
                !isFinite(
                    audio.duration
                )
            ) {
                return;
            }


            const percentage =
                parseFloat(
                    seekBar.value
                );


            audio.currentTime =
                (
                    percentage /
                    100
                ) *
                audio.duration;
        }
    );
}


/* =========================================================
   TIME UPDATE
========================================================= */

audio.addEventListener(
    "timeupdate",
    function() {

        const duration =
            audio.duration;


        const position =
            audio.currentTime;


        if (
            seekBar &&
            isFinite(duration) &&
            duration > 0
        ) {

            seekBar.value =
                (
                    position /
                    duration
                ) *
                100;
        }


        if (currentTimeElement) {

            currentTimeElement.textContent =
                formatTime(
                    position
                );
        }


        if (remainingTimeElement) {

            remainingTimeElement.textContent =
                "-" +
                formatTime(
                    Math.max(
                        0,
                        duration -
                        position
                    )
                );
        }


        if (
            miniProgress &&
            isFinite(duration) &&
            duration > 0
        ) {

            miniProgress.style.width =
                (
                    position /
                    duration *
                    100
                ) +
                "%";
        }
    }
);


/* =========================================================
   RECITER
========================================================= */

if (reciterSelect) {

    reciterSelect.value =
        reciters[reciter]
            ? reciter
            : "Alafasy_128kbps";


    reciterSelect.addEventListener(
        "change",
        async function() {

            const wasPlaying =
                !audio.paused;


            const oldTime =
                audio.currentTime;


            reciter =
                reciterSelect.value;


            localStorage.setItem(
                "quran_reciter",
                reciter
            );


            updateTitles();


            await playAyah(
                currentAyah
            );


            if (
                isFinite(oldTime) &&
                oldTime > 0 &&
                isFinite(audio.duration)
            ) {

                audio.currentTime =
                    Math.min(
                        oldTime,
                        audio.duration
                    );
            }


            if (!wasPlaying) {

                audio.pause();

                isPlaying =
                    false;

                updatePlayButton();

                updateVinyl();
            }
        }
    );
}


/* =========================================================
   PLAYER OPEN
========================================================= */

function openPlayer() {

    if (!playerSheet) {
        return;
    }


    if (playerOverlay) {

        playerOverlay.classList.remove(
            "hidden"
        );
    }


    playerSheet.classList.remove(
        "hidden"
    );


    setTimeout(
        function() {

            playerSheet.classList.add(
                "player-open"
            );


            if (playerOverlay) {

                playerOverlay.classList.add(
                    "overlay-open"
                );
            }

        },
        20
    );
}


/* =========================================================
   PLAYER CLOSE
========================================================= */

function closePlayer() {

    if (!playerSheet) {
        return;
    }


    playerSheet.classList.remove(
        "player-open"
    );


    if (playerOverlay) {

        playerOverlay.classList.remove(
            "overlay-open"
        );
    }


    setTimeout(
        function() {

            playerSheet.classList.add(
                "hidden"
            );


            if (playerOverlay) {

                playerOverlay.classList.add(
                    "hidden"
                );
            }

        },
        300
    );
}


/* =========================================================
   BUTTON EVENTS
========================================================= */

if (playButton) {

    playButton.addEventListener(
        "click",
        togglePlay
    );
}


if (fullPlayButton) {

    fullPlayButton.addEventListener(
        "click",
        togglePlay
    );
}


if (nextButton) {

    nextButton.addEventListener(
        "click",
        nextAyah
    );
}


if (fullNextButton) {

    fullNextButton.addEventListener(
        "click",
        nextAyah
    );
}


if (previousButton) {

    previousButton.addEventListener(
        "click",
        previousAyah
    );
}


if (fullPreviousButton) {

    fullPreviousButton.addEventListener(
        "click",
        previousAyah
    );
}


if (repeatButton) {

    repeatButton.addEventListener(
        "click",
        toggleRepeat
    );
}


if (speedButton) {

    speedButton.addEventListener(
        "click",
        changeSpeed
    );
}


if (openPlayerButton) {

    openPlayerButton.addEventListener(
        "click",
        openPlayer
    );
}


if (openPlayerButton2) {

    openPlayerButton2.addEventListener(
        "click",
        openPlayer
    );
}


if (closePlayerButton) {

    closePlayerButton.addEventListener(
        "click",
        closePlayer
    );
}


if (playerOverlay) {

    playerOverlay.addEventListener(
        "click",
        closePlayer
    );
}


if (backButton) {

    backButton.addEventListener(
        "click",
        function() {
            history.back();
        }
    );
}


/* =========================================================
   START
========================================================= */

if (window.lucide) {
    lucide.createIcons();
}


loadSurah();
