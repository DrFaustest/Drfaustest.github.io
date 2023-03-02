$(document).ready(function() {
    const weatherImages = {
        'Sunny': './svg/animated/day.svg',
        'Cloudy': './svg/animated/cloudy.svg',
        'Rainy': './svg/animated/rainy.svg',
        // Add more mappings as needed
      };
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const apiUrl = `https://api.weather.gov/points/${latitude},${longitude}`;
    
        fetch(apiUrl)
          .then(response => response.json())
          .then(data => {
            console.log(data); // Display the API response in the console
            const forecastUrl = data.properties.forecast;
            const city = data.properties.relativeLocation.properties.city;
            const state = data.properties.relativeLocation.properties.state;
            const locationName = `${city}, ${state}`;
            document.querySelector('#location').textContent = locationName;
            return fetch(forecastUrl);
          })
          .then(response => response.json())
          .then(data => {
            // Parse the JSON response and extract the forecast data you want
            const periods = data.properties.periods.filter(item => item.temperature !== null);
            const forecastData = periods.reduce((acc, item) => {
              const date = new Date(item.startTime).toLocaleDateString();
              if (acc[date]) {
                acc[date].temperature.push(item.temperature);
                const description = item.shortForecast.split('then').join('');
                acc[date].description.push(description.trim());
              } else {
                acc[date] = {
                  date: date,
                  time: new Date(item.startTime).toLocaleTimeString(),
                  temperature: [item.temperature],
                  description: [item.shortForecast.split('then').join('').trim()],
                  image: item.symbol ? (item.isDaytime ? item.symbol : item.symbol.replace('day', 'night')) : null
                };
              }
              return acc;
            }, {});
    
            // Convert the grouped data to an array and display it on your website
            const forecastDataArray = Object.values(forecastData);
            const forecastContainer = document.querySelector('#forecast-container');
            forecastDataArray.forEach(item => {
              const temperatureSum = item.temperature.reduce((acc, val) => acc + val);
              const temperatureAverage = Math.round(temperatureSum / item.temperature.length);
              const description = item.description.join(' / ');
              const forecastItem = document.createElement('div');
              forecastItem.classList.add('forecast-item');
              forecastItem.innerHTML = `
                <p class="date-time">${item.date}<br>${item.time}</p>
                <p class="temperature">${temperatureAverage}°F</p>
                <p class="description">${description}</p>
              `;
              forecastItem.classList.add('forecast-item');
    
              // Check if the image file exists before appending it to the forecast item
              if (item.image) {
                const image = new Image();
                image.src = `images/${item.image}.svg`;
                console.log(`Loading image: ${item.image}.svg`);
                image.onerror = () => {
                  forecastItem.classList.add('no-image');
                };
                image.onload = () => {
                  const imageWrapper = document.createElement('div');
                  imageWrapper.classList.add('forecast-image');
                  imageWrapper.innerHTML = `<img src="images/${item.image}.svg">`;
                  forecastItem.insertBefore(imageWrapper, forecastItem.firstChild);
                };
                  console.log(`Loading image: ${item.image}.svg`);

              } else {
                forecastItem.classList.add('no-image');
              }
    
              forecastContainer.appendChild(forecastItem);
            });
          })
          .catch(error => console.log(error));
      });
    } else {
      console.log('Geolocation is not supported by your browser');
    }
  });
  
  