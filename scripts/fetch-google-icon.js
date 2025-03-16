const fs = require('fs');
const https = require('https');
const path = require('path');

// Google's G logo icon URL
const googleIconUrl = 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg';
const outputPath = path.join(__dirname, '../assets/google-icon.png');

// Simple function to download the Google icon
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading Google icon from ${url}...`);

    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`Google icon downloaded and saved to: ${outputPath}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Delete the file if there's an error
      reject(err);
    });
  });
}

// Execute download
downloadFile(googleIconUrl, outputPath)
  .catch(error => {
    console.error('Error downloading Google icon:', error);
    process.exit(1);
  });
