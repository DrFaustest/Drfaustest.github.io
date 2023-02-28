

//wait for the page to load
$(document).ready(function() {

    function loadJSON(callback) {   
        var xhr = new XMLHttpRequest();
        xhr.overrideMimeType("application/json");
        xhr.open('GET', './Omaha_Live.json', true);
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
            for (var i = 0; i < data.data.length; i++) {
                var img = new Image();
                img.style.width = "100%";
                img.src = data.data[i];
                images.push(img);
            }
            
            // Display the first image
            x.innerHTML = "";
            x.appendChild(images[0]);
            
            // add event listeners to the previous and next buttons
            var prevButton = document.getElementById("prevButton");
            prevButton.onclick = function() {
                manualControl = true;
                slideIndex--;
                if (slideIndex < 0) {
                    slideIndex = data.data.length - 1;
                }
                x.innerHTML = "";
                x.appendChild(images[slideIndex]);
            };
            var nextButton = document.getElementById("nextButton");
            nextButton.onclick = function() {
                manualControl = true;
                slideIndex++;
                if (slideIndex >= data.data.length) {
                    slideIndex = 0;
                }
                x.innerHTML = "";
                x.appendChild(images[slideIndex]);
            };
            
            // Load the next and previous images when the current image is being displayed
            function loadNextImage() {
                var nextIndex = (slideIndex + 1) % data.data.length;
                var nextImg = images[nextIndex];
                if (!nextImg.complete) {
                    nextImg.onload = function() {
                        loadNextImage();
                    }
                }
            }
            
            function loadPreviousImage() {
                var previousIndex = (slideIndex - 1 + data.data.length) % data.data.length;
                var previousImg = images[previousIndex];
                if (!previousImg.complete) {
                    previousImg.onload = function() {
                        loadPreviousImage();
                    }
                }
            }
            
            function displayNextImage() {
                slideIndex++;
                if (slideIndex >= data.data.length) {
                    slideIndex = 0;
                }
                x.innerHTML = "";
                x.appendChild(images[slideIndex]);
                loadNextImage();
            }
            
            function displayPreviousImage() {
                slideIndex--;
                if (slideIndex < 0) {
                    slideIndex = data.data.length - 1;
                }
                x.innerHTML = "";
                x.appendChild(images[slideIndex]);
                loadPreviousImage();
            }
            
            loadNextImage();
            loadPreviousImage();
            setInterval(function() {
                if (!manualControl) {
                    displayNextImage();
                }
            }, 4000);
        });
    }
    carousel();
});

