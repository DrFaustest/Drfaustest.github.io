// This is a temporary placeholder icon
// In a real project, you would replace this with a proper icon file
// The data URL below creates a simple colored square with "P" text

const canvas = document.createElement('canvas');
canvas.width = 144;
canvas.height = 144;
const ctx = canvas.getContext('2d');

// Draw background
ctx.fillStyle = '#6200ea';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Draw text
ctx.font = 'bold 100px Arial';
ctx.fillStyle = 'white';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('P', canvas.width/2, canvas.height/2);

// Convert to data URL
const imageData = canvas.toDataURL('image/png');
const img = new Image();
img.src = imageData;

// When image loads, save it to the icons directory
img.onload = function() {
    // In a real project, you would save this file to the server
    
    // For development, you could create a download link
    const a = document.createElement('a');
    a.href = imageData;
    a.download = 'icon-144x144.png';
    document.body.appendChild(a);
    a.style.display = 'none';
    // Uncomment the next line to trigger an automatic download
    // a.click();
    document.body.removeChild(a);
};
