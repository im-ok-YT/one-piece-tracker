document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed.");

    // Ensure that the element with ID 'tracker' exists
    const trackerDiv = document.getElementById('tracker');
    if (!trackerDiv) {
        console.error("Element with ID 'tracker' not found!");
        return;
    }

    // Fetch One Piece episodes from Jikan API
    async function fetchEpisodes() {
        const endpoint = "https://api.jikan.moe/v4/anime/21/episodes";
        let episodes = [];
        let currentPage = 1;
        let hasNextPage = true;

        try {
            console.log("Starting to fetch episodes...");
            while (hasNextPage) {
                const response = await fetch(`${endpoint}?page=${currentPage}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log(`Fetched page ${currentPage}:`, data);
                episodes = episodes.concat(data.data);
                hasNextPage = data.pagination.has_next_page;
                currentPage++;
            }
            console.log("All episodes fetched:", episodes);
        } catch (error) {
            console.error("Error fetching episodes:", error);
            console.log("Using fallback static data.");
            episodes = [
                { mal_id: 1, title: "I'm Luffy! The Man Who's Gonna Be King of the Pirates!", episode_number: 1 },
                { mal_id: 2, title: "Enter the Great Swordsman! Pirate Hunter Roronoa Zoro!", episode_number: 2 },
                // Add more static episodes here as fallback
            ];
        }

        return episodes;
    }

    // Group episodes by arcs and sagas
    function groupEpisodesByArc(episodes) {
        const arcs = {
            "East Blue Saga": [
                { name: "Romance Dawn Arc", range: [1, 3] },
                { name: "Orange Town Arc", range: [4, 8] },
                { name: "Syrup Village Arc", range: [9, 18] },
                { name: "Baratie Arc", range: [19, 30] },
                { name: "Arlong Park Arc", range: [31, 45] },
                { name: "Loguetown Arc", range: [46, 53] },
                { name: "Warship Island Arc (Filler)", range: [54, 61] }
            ],
            "Alabasta Saga": [
                { name: "Reverse Mountain Arc", range: [62, 63] },
                { name: "Whiskey Peak Arc", range: [64, 67] },
                { name: "Little Garden Arc", range: [68, 77] },
                { name: "Drum Island Arc", range: [78, 91] },
                { name: "Alabasta Arc", range: [92, 130] }
            ],
            "Sky Island Saga": [
                { name: "Post-Alabasta Arc (Filler)", range: [131, 135] },
                { name: "Goat Island Arc (Filler)", range: [136, 138] },
                { name: "Ruluka Island Arc (Filler)", range: [139, 143] },
                { name: "Jaya Arc", range: [144, 152] },
                { name: "Skypiea Arc", range: [153, 195] },
                { name: "G-8 Arc (Filler)", range: [196, 206] }
            ],
            "Water 7 Saga": [
                { name: "Long Ring Long Land Arc", range: [207, 219] },
                { name: "Ocean's Dream Arc (Filler)", range: [220, 224] },
                { name: "Foxy's Return Arc (Filler)", range: [225, 228] },
                { name: "Water 7 Arc", range: [229, 263] },
                { name: "Enies Lobby Arc", range: [264, 312] },
                { name: "Post-Enies Lobby Arc", range: [313, 325] },
                { name: "Ice Hunter Arc (Filler)", range: [326, 335] }
            ],
            "Thriller Bark Saga": [
                { name: "Thriller Bark Arc", range: [337, 381] },
                { name: "Spa Island Arc (Filler)", range: [382, 384] }
            ],
            "Summit War Saga": [
                { name: "Sabaody Archipelago Arc", range: [385, 407] },
                { name: "Amazon Lily Arc", range: [408, 421] },
                { name: "Impel Down Arc", range: [422, 425, 430, 452] }, // Note split episodes due to flashback fillers
                { name: "Little East Blue Arc (Filler)", range: [426, 429] },
                { name: "Marineford Arc", range: [457, 489] },
                { name: "Post-War Arc", range: [490, 516] }
            ],
            "Fish-Man Island Saga": [
                { name: "Return to Sabaody Arc", range: [517, 522] },
                { name: "Fish-Man Island Arc", range: [523, 574] }
            ],
            "Dressrosa Saga": [
                { name: "Z's Ambition Arc (Filler)", range: [575, 578] },
                { name: "Punk Hazard Arc", range: [579, 625] },
                { name: "Dressrosa Arc", range: [629, 746] }
            ],
            "Four Emperors Saga": [
                { name: "Silver Mine Arc (Filler)", range: [747, 750] },
                { name: "Zou Arc", range: [751, 779] },
                { name: "Marine Rookie Arc (Filler)", range: [780, 782] },
                { name: "Whole Cake Island Arc", range: [783, 877] },
                { name: "Reverie Arc", range: [878, 889] },
                { name: "Wano Country Arc", range: [890, 894, 897, 906, 1028, 1050] }  // Update the last episode number as per the latest information
            ]
        };

        const groupedData = {};

        console.log("Grouping episodes by arc...");
        episodes.forEach(episode => {
            for (const saga in arcs) {
                arcs[saga].forEach(arc => {
                    if (episode.mal_id >= arc.range[0] && episode.mal_id <= arc.range[1]) {
                        if (!groupedData[saga]) {
                            groupedData[saga] = [];
                        }

                        const existingArc = groupedData[saga].find(a => a.name === arc.name);
                        if (existingArc) {
                            existingArc.episodes.push(episode);
                        } else {
                            groupedData[saga].push({
                                name: arc.name,
                                episodes: [episode]
                            });
                        }
                    }
                });
            }
        });

        console.log("Grouped Data:", groupedData);
        return groupedData;
    }

    // Generate the episode tracker
    async function generateTracker() {
        const trackerDiv = document.getElementById('tracker');
        const episodes = await fetchEpisodes();
        const groupedData = groupEpisodesByArc(episodes);
        const totalEpisodes = episodes.length;
        let watchedEpisodes = 0;

        console.log("Generating tracker UI...");

        for (const saga in groupedData) {
            const sagaDiv = document.createElement('div');
            sagaDiv.className = 'saga';

            const sagaTitle = document.createElement('h2');
            sagaTitle.textContent = saga;
            sagaDiv.appendChild(sagaTitle);

            sagaTitle.addEventListener('click', () => {
                sagaDiv.querySelector('.collapsible-content').classList.toggle('active');
            });

            const sagaProgressBar = document.createElement('div');
            sagaProgressBar.className = 'progress-bar';
            sagaDiv.appendChild(sagaProgressBar);

            const sagaProgressFill = document.createElement('div');
            sagaProgressFill.className = 'progress-fill';
            sagaProgressBar.appendChild(sagaProgressFill);

            const sagaContent = document.createElement('div');
            sagaContent.className = 'collapsible-content';

            groupedData[saga].forEach(arc => {
                const arcDiv = document.createElement('div');
                arcDiv.className = 'arc';

                const arcTitle = document.createElement('h3');
                arcTitle.textContent = arc.name;
                arcDiv.appendChild(arcTitle);

                arcTitle.addEventListener('click', (e) => {
                    arcDiv.querySelector('.collapsible-content').classList.toggle('active');
                });

                const arcProgressBar = document.createElement('div');
                arcProgressBar.className = 'progress-bar';
                arcDiv.appendChild(arcProgressBar);

                const arcProgressFill = document.createElement('div');
                arcProgressFill.className = 'progress-fill';
                arcProgressBar.appendChild(arcProgressFill);

                const arcContent = document.createElement('div');
                arcContent.className = 'collapsible-content';

                const episodeList = document.createElement('ul');
                episodeList.className = 'episode-list';

                arc.episodes.forEach(episode => {
                    const listItem = document.createElement('li');

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `episode-${episode.mal_id}`;
                    checkbox.checked = loadEpisodeStatus(episode.mal_id);
                    checkbox.addEventListener('change', (e) => {
                        e.stopPropagation(); // Prevent the event from bubbling up
                        saveEpisodeStatus(episode.mal_id, checkbox.checked);
                        updateProgress(totalEpisodes, groupedData);
                    });

                    const label = document.createElement('label');
                    label.htmlFor = checkbox.id;
                    label.textContent = `Episode ${episode.mal_id}: ${episode.title}`;

                    listItem.appendChild(checkbox);
                    listItem.appendChild(label);
                    episodeList.appendChild(listItem);

                    if (checkbox.checked) watchedEpisodes++;
                });

                arcContent.appendChild(episodeList);
                arcDiv.appendChild(arcContent);
                sagaContent.appendChild(arcDiv);
            });

            sagaDiv.appendChild(sagaContent);
            trackerDiv.appendChild(sagaDiv);
        }

        updateProgress(totalEpisodes, groupedData);
    }

    // Function to save episode status to localStorage
    function saveEpisodeStatus(episodeId, status) {
        localStorage.setItem(`episode-${episodeId}`, status);
    }

    // Function to load episode status from localStorage
    function loadEpisodeStatus(episodeId) {
        return localStorage.getItem(`episode-${episodeId}`) === 'true';
    }

    // Function to update progress bars
    function updateProgress(totalEpisodes, groupedData) {
        const sagas = document.querySelectorAll('.saga');
        let overallWatched = 0;

        sagas.forEach((sagaElement, sagaIndex) => {
            const arcs = sagaElement.querySelectorAll('.arc');
            let sagaWatched = 0;
            let sagaTotal = 0;

            arcs.forEach((arcElement, arcIndex) => {
                const episodes = arcElement.querySelectorAll('.episode-list li input[type="checkbox"]');
                let arcWatched = 0;

                episodes.forEach(episode => {
                    sagaTotal++;
                    if (episode.checked) {
                        arcWatched++;
                        sagaWatched++;
                        overallWatched++;
                    }
                });

                const arcProgressFill = arcElement.querySelector('.progress-fill');
                const arcPercentage = (arcWatched / episodes.length) * 100;
                arcProgressFill.style.width = `${arcPercentage}%`;
                arcProgressFill.textContent = `${Math.round(arcPercentage)}%`; // Display percentage in the progress bar
            });

            const sagaProgressFill = sagaElement.querySelector('.progress-fill');
            const sagaPercentage = (sagaWatched / sagaTotal) * 100;
            sagaProgressFill.style.width = `${sagaPercentage}%`;
            sagaProgressFill.textContent = `${Math.round(sagaPercentage)}%`; // Display percentage in the progress bar
        });

        const overallProgressFill = document.getElementById('overall-progress-fill');
        const overallPercentage = (overallWatched / totalEpisodes) * 100;
        overallProgressFill.style.width = `${overallPercentage}%`;
        overallProgressFill.textContent = `${Math.round(overallPercentage)}%`; // Display percentage in the progress bar
    }

    // Generate the tracker when the page loads
    generateTracker();
});
