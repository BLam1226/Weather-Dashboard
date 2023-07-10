// DOM declarations
const cityNameInput = document.querySelector("#city-name");
const searchForm = document.querySelector("#search-form");
const currentConditionsUl = document.querySelector("#current-forecast #conditions");
const currentConditionsH3 = document.querySelector("#current-forecast h3");
const previousSearches = document.querySelector("#previous-searches");
const previousSearchContainer = document.querySelector("#previous-searches .card-body");
const dailyCardContainer = document.querySelector("#daily-forecast");
const fiveDayHeader = document.querySelector("#five-day");

const apiKey = 'df0bf8d0d7dd7c1c07cce5a215413bd8';
// Declares localCityArray in global variable
const localCityArray = [];

// Pulls in previous searches from localStorage
let previousSearch = JSON.parse(localStorage.getItem("searches"));

// Removes any null results stored in localStorage
if (previousSearch !== null) {
    for (let i = 0; i < previousSearch.length; i++) {
        if (previousSearch[i] === null) {
            previousSearch.splice(i, i + 1);
        } else {
            // Populates localCityArray to publish previous search buttons
            localCityArray.push(previousSearch[i]);
        }
    }
}

const updateSearchHistory = () => {
    // Pulls localStorage results of previous searches
    previousSearch = JSON.parse(localStorage.getItem("searches"));

    // Declared under function to ensure list is updated each time
    const existingButtons = document.querySelectorAll("#previous-searches button");

    if (previousSearch !== null) {
        existingButtons.forEach(button => {
            // Ensures buttons aren't repeated for existing searches
            for (let i = 0; i < previousSearch.length; i++)
                if (button.dataset.city.includes(previousSearch[i])) {
                    previousSearch.splice(i, i + 1);
                }
        })
        for (let i = 0; i < previousSearch.length; i++) {
            const searchButton = document.createElement("button");
            searchButton.classList.add("m-2", "btn", "btn-light");
            // Sets data-city attribute on button for event listener to reference
            searchButton.dataset.city = previousSearch[i];
            searchButton.textContent = previousSearch[i];
            searchButton.addEventListener("click", (event) => {
                // References data-city property to call API
                displayForecast(event.target.dataset.city);
            })
            previousSearchContainer.appendChild(searchButton);
        }
    }
}

const updateLocalStorage = (city) => {
    // Ensures searched city isn't pushed into array (and then localStorage) if city has already been searched
    if (localCityArray.includes(city)) {
        return;
    } else {
        localCityArray.push(city);

        // Stores for next user visit
        localStorage.setItem("searches", JSON.stringify(localCityArray));

        // Calls updateSearchHistory to add new search to previous search buttons
        updateSearchHistory();
    }
}

// Converts temperature data to celsius
const convertToCelsius = (temperature) => {
    return (temperature - 273.15).toFixed(2);
}

// Further convert celsius into fahrenheit
const convertToFahrenheit = (temperature) => {
    return ((temperature - 273.15) * 9 / 5 + 32).toFixed(2);
}

// Create URL for api to retrieve forecast data
const displayForecast = (city) => {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            // Update current conditions
            currentConditionsH3.textContent = `Current Conditions in ${data.name}`;
            currentConditionsUl.innerHTML = `
          <li>Temperature: ${convertToFahrenheit(data.main.temp)}F</li>
          <li>Humidity: ${data.main.humidity}%</li>
          <li>Wind Speed: ${data.wind.speed} m/s</li>
        `;

            // Update weather icon
            const currentIcon = document.querySelector("#current-icon");
            const icon = document.createElement("img");
            icon.src = `http://openweathermap.org/img/w/${data.weather[0].icon}.png`;
            icon.alt = data.weather[0].description;
            icon.classList.add("weather-icon");
            currentIcon.innerHTML = "";
            currentIcon.appendChild(icon);

            updateLocalStorage(city);

            // Fetch 5-day forecast
            return fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`);
        })
        .then(response => response.json())
        .then(data => {
            // Update 5-day forecast
            dailyCardContainer.innerHTML = "";
            fiveDayHeader.classList.remove("hidden");

            // Loop to create card for each of the 5 day forecast
            for (let i = 0; i < data.list.length; i += 8) {
                const forecast = data.list[i];
                const forecastCard = document.createElement("div");
                forecastCard.classList.add("card", "m-2", "p-2", "bg-info");

                const cardBody = document.createElement("div");
                cardBody.classList.add("card-body");

                const date = document.createElement("h5");
                date.classList.add("card-title");
                date.textContent = new Date(forecast.dt * 1000).toLocaleDateString();

                const icon = document.createElement("img");
                icon.src = `http://openweathermap.org/img/w/${forecast.weather[0].icon}.png`;
                icon.alt = forecast.weather[0].description;
                icon.classList.add("weather-icon");

                const temperature = document.createElement("p");
                temperature.classList.add("card-text");
                temperature.innerHTML = `
            <span class="temperature-high">High: ${convertToFahrenheit(forecast.main.temp_max)}F</span>
            <span class="temperature-low">Low: ${convertToFahrenheit(forecast.main.temp_min)}F</span>
          `;

                const humidity = document.createElement("p");
                humidity.classList.add("card-text");
                humidity.textContent = `Humidity: ${forecast.main.humidity}%`;

                cardBody.appendChild(date);
                cardBody.appendChild(icon);
                cardBody.appendChild(temperature);
                cardBody.appendChild(humidity);
                forecastCard.appendChild(cardBody);
                dailyCardContainer.appendChild(forecastCard);
            }
        })
        .catch(error => {
            console.log("Error fetching forecast:", error);
            currentConditionsH3.textContent = "Error fetching forecast";
            currentConditionsUl.innerHTML = "";
            dailyCardContainer.innerHTML = "";
            fiveDayHeader.classList.add("hidden");
        });
}

// Adds event listener to search form
searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    let searchValue = cityNameInput.value.trim("");

    // Handler if user submits form with blank field
    if (searchValue === "") {
        currentConditionsH3.textContent = "Please enter a city!";
        currentConditionsUl.innerHTML = "";
        dailyCardContainer.innerHTML = "";
        // Hides 5-day forecast if API won't be called
        fiveDayHeader.classList.add("hidden");
    } else {
        // Calls API to fetch provided value
        displayForecast(searchValue);
        // Clears text in input
        cityNameInput.value = "";
    }
});

// Called at run time to populate search buttons for previous searches in localStorage
updateSearchHistory();

// Default city to display at run time
displayForecast("Morrisville");