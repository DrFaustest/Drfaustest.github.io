document.addEventListener('DOMContentLoaded', function() {
    carousel();
    fetchNews();
    getLocationAndFetchForecast();

    // Accordion functionality
    document.querySelectorAll('.accordion-header').forEach(button => {
        button.addEventListener('click', () => {
            const content = button.nextElementSibling;

            button.classList.toggle('active');

            if (button.classList.contains('active')) {
                content.style.display = 'block';
            } else {
                content.style.display = 'none';
            }
        });
    });
});

function loadJSON(callback) {   
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType("application/json");
    xhr.open('GET', 'js/Omaha_Live.json', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            callback(xhr.responseText);
        }
    };
    xhr.send(null);  
}

function carousel() {
    loadJSON(function(response) {
        var data = JSON.parse(response);
        var slideIndex = 0;
        var x = document.getElementById("slideshow-container");
        var images = [];
        var manualControl = false;
        
        // Preload all images
        data.data.forEach((url, i) => {
            var img = new Image();
            img.onload = function() {
                images.push(img);
                if (i === 0) {
                    x.innerHTML = "";
                    x.appendChild(img);
                }
            };
            img.onerror = function() {
                console.error("Image failed to load: " + url);
            };
            img.src = url;
            img.classList.add('carousel-image');
        });
        
        
        // Add event listeners to the previous and next buttons
        var prevButton = document.getElementById("prevButton");
        prevButton.onclick = function() {
            manualControl = true;
            slideIndex--;
            if (slideIndex < 0) {
                slideIndex = images.length - 1;
            }
            x.innerHTML = "";
            x.appendChild(images[slideIndex]);
        };

        var nextButton = document.getElementById("nextButton");
        nextButton.onclick = function() {
            manualControl = true;
            slideIndex++;
            if (slideIndex >= images.length) {
                slideIndex = 0;
            }
            x.innerHTML = "";
            x.appendChild(images[slideIndex]);
        };

        // Auto-rotate carousel every 4 seconds
        setInterval(function() {
            if (!manualControl) {
                slideIndex++;
                if (slideIndex >= images.length) {
                    slideIndex = 0;
                }
                x.innerHTML = "";
                x.appendChild(images[slideIndex]);
            }
        }, 4000);
    });
}

function fetchNews() {
    const rssUrl = 'http://feeds.bbci.co.uk/news/rss.xml';
    const proxyUrl = 'https://api.rss2json.com/v1/api.json?rss_url=';

    fetch(proxyUrl + encodeURIComponent(rssUrl))
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                updateNewsTicker(data.items);
            } else {
                console.error('Error fetching news:', data.message);
            }
        })
        .catch(error => console.error('Error fetching news:', error));
}

function updateNewsTicker(newsItems) {
    const newsTicker = document.getElementById('news-content');
    if (newsTicker) {
        newsTicker.innerHTML = ''; // Clear existing content
        newsItems.forEach(item => {
            const newsItem = document.createElement('div');
            newsItem.classList.add('news-item');
            newsItem.innerHTML = `
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <a href="${item.link}" target="_blank">Read more</a>
            `;
            newsTicker.appendChild(newsItem);
        });
    }
}

function getLocationAndFetchForecast() {
    const defaultLatitude = 41.2565; // Latitude for Omaha, NE
    const defaultLongitude = -95.9345; // Longitude for Omaha, NE
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            fetchForecast(position.coords.latitude, position.coords.longitude);
        }, function(error) {
            console.error("Error getting location: ", error);
            fetchForecast(defaultLatitude, defaultLongitude); // Use default location on error
        });
    } else {
        console.log("Geolocation is not supported by your browser");
        fetchForecast(defaultLatitude, defaultLongitude); // Use default location on error
    }
}

function fetchForecast(latitude, longitude) {
    const url = `https://api.weather.gov/points/${latitude},${longitude}`; // Dynamic URL based on location

    const requestOptions = {
        method: 'GET',
        headers: {
            'User-Agent': 'DrFaustest.github.io (scottaf80234@gmail.com)'
        }
    };

    fetch(url, requestOptions)
        .then(response => response.json())
        .then(data => {
            const forecastUrl = data.properties.forecast;
            const locationName = `${data.properties.relativeLocation.properties.city}, ${data.properties.relativeLocation.properties.state}`;
            return fetch(forecastUrl).then(response => response.json()).then(forecastData => {
                displayForecast(forecastData.properties.periods, locationName);
            });
        })
        .catch(error => console.error('Error fetching forecast:', error));
}

function displayForecast(periods, locationName) {
    // Update the heading with the location name
    const weatherHeading = document.querySelector('#weather-heading');
    if (weatherHeading) {
        weatherHeading.textContent = `Local Weather (${locationName})`;
    }

    const forecastContainer = document.querySelector('#forecast-container');
    forecastContainer.innerHTML = ''; // Clear existing content

    periods.forEach(period => {
        const forecastItem = document.createElement('div');
        forecastItem.classList.add('forecast-item');

        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');

        const imageEl = new Image();
        imageEl.src = period.icon;
        imageEl.alt = period.shortForecast;
        imageEl.height = 100; // Adjust size for mobile view
        imageEl.width = 100; // Adjust size for mobile view
        imageContainer.appendChild(imageEl);

        const textContent = document.createElement('div');
        textContent.classList.add('forecast-text');

        const date = new Date(period.startTime);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
        const formattedDate = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
        const amPm = date.getHours() >= 12 ? 'PM' : 'AM';

        textContent.innerHTML = `
            <p class="date-time">${dayOfWeek} ${formattedDate} ${amPm}</p>
            <p class="temperature">${period.temperature}°${period.temperatureUnit}</p>
            <p class="description">${period.shortForecast}</p>
        `;

        forecastItem.appendChild(imageContainer);
        forecastItem.appendChild(textContent);
        forecastContainer.appendChild(forecastItem);
    });
}
