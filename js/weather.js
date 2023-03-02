const weatherImages = {
  'Sunny': {
    url: '../svg/animated/day.svg',
    height: '200',
    width: '200',
  },
  'Cloudy': {
    url: '../svg/animated/cloudy.svg',
    height: '200',
    width: '200',
  },
  'Rainy': {
    url: '../svg/animated/rainy-1.svg',
    height: '200',
    width: '200',
  },
  'Snowy': {
    url: '../svg/animated/snowy-1.svg',
    height: '200',
    width: '200',
  },
  'Thunder': {
    url: '../svg/animated/thunder.svg',
    height: '200',
    width: '200',
  },
};


document.addEventListener('DOMContentLoaded', () => {
  const forecastContainer = document.querySelector('#forecast-container');
  const locationEl = document.querySelector('#location');

  let apiUrl = 'https://api.weather.gov/points/41.2565,-95.9345';

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const { latitude, longitude } = coords;
      const apiUrl = `https://api.weather.gov/points/${latitude},${longitude}`;
    }, () => {
      console.log('Error getting geolocation');
    });
  } else {
    console.log('Geolocation is not supported by your browser');
  }
      fetch(apiUrl)
        .then(response => response.json())
        .then(({ properties }) => {
          const forecastUrl = properties.forecast;
          const city = properties.relativeLocation.properties.city;
          const state = properties.relativeLocation.properties.state;
          const locationName = `${city}, ${state}`;
          locationEl.textContent = locationName;
          return fetch(forecastUrl);
        })
        .then(response => response.json())
        .then(({ properties }) => {
          const periods = properties.periods.filter(({ temperature }) => temperature !== null);
          const forecastData = periods.reduce((acc, { startTime, temperature, shortForecast, symbol, isDaytime }) => {
            const date = new Date(startTime).toLocaleDateString();
            const time = new Date(startTime).toLocaleTimeString();
            const description = shortForecast.split('then').join('').trim();
            const image = symbol
              ? weatherImages[isDaytime ? symbol : symbol.replace('day', 'night')]
              : null;

            if (acc[date]) {
              acc[date].temperature.push(temperature);
              acc[date].description.push(description);
            } else {
              acc[date] = { date, time, temperature: [temperature], description: [description], image };
            }

            return acc;
          }, {});

          const forecastDataArray = Object.values(forecastData);
          forecastDataArray.forEach(({ date, time, temperature, description, image }) => {
            const temperatureSum = temperature.reduce((acc, val) => acc + val);
            const temperatureAverage = Math.round(temperatureSum / temperature.length);
          
            const forecastItem = document.createElement('div');
            forecastItem.classList.add('forecast-item');

            const checkImage = String(description).toLowerCase()
          
            if (checkImage.includes('snow')) {
              image = weatherImages['Snowy'];
            } else if (checkImage.includes('thunder')) {
              image = weatherImages['Thunder'];
            } else if (checkImage.includes('rain')) {
              image = weatherImages['Rainy'];
            } else if (checkImage.includes('cloudy')) {
              image = weatherImages['Cloudy'];
            } else if (checkImage.includes('sunny')) {
              image = weatherImages['Sunny'];
            } else {
              image = null;
            }
            
            console.log(image);
          
            if (image) {
              const imageEl = new Image();
              imageEl.src = image.url;
              imageEl.height = image.height;
              imageEl.width = image.width;
              forecastItem.appendChild(imageEl);
              
            } else {
              forecastItem.classList.add('no-image');
            }
          
            const textContent = document.createElement('div');
            textContent.classList.add('forecast-text');
            textContent.innerHTML = `
              <p class="date-time">${date}<br>${time}</p>
              <p class="temperature">${temperatureAverage}°F</p>
              ${image ? '' : `<p class="description">${description}</p>`}
            `;
            forecastItem.appendChild(textContent);
          
            if (image) {
              const imageEl = forecastItem.querySelector('img');
              imageEl.onerror = () => forecastItem.classList.add('no-image');
              imageEl.onload = () => forecastItem.classList.add('has-image');
            } else {
              forecastItem.classList.add('no-image');
            }
          
            forecastContainer.appendChild(forecastItem);
          });
          
        })
        .catch(error => console.error(error));
  });


