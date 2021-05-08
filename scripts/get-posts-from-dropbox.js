require("dotenv").load();
require("isomorphic-fetch");
const path = require("path");
const fs = require("fs-extra");
const Dropbox = require("dropbox").Dropbox;


// Setup our interface for the Dropbox API with our token
// If there's no token, we'll just go ahead and exit this script now.
if (!process.env.DBX_ACCESS_TOKEN) {
  console.log(
    "Error: could not find a Dropbox access token. Make sure you have a `.env` file with a `DBX_ACCESS_TOKEN` key/value pair for accessing the Dropbox API."
  );
  process.exit(1);
}
const dbx = new Dropbox({
  accessToken: process.env.DBX_ACCESS_TOKEN
});

// Clean anything up that exists already, since we'll be re-building this folder
// everytime we run a build
const IMAGES_DIRECTORY = path.resolve(__dirname, "../images/");
fs.ensureDirSync(IMAGES_DIRECTORY);


// Get all the posts in the root of our our Dropbox App's directory and save
// them all to our local posts folder.

function recursivelyDownloadFromDropbox(
  toRetrieve = "", 
  currFolder = IMAGES_DIRECTORY, 
  relativeToDropboxDirectory = ""
) {

const folderToRetrieve = path.join(relativeToDropboxDirectory, toRetrieve) == "." ? "" : path.join(relativeToDropboxDirectory, toRetrieve);

console.log(`Retrieving files from the folder "${folderToRetrieve}"`);
  dbx
    .filesListFolder({ path: folderToRetrieve})
    .then((response) => {
      // console.log(response);
      // console.log("========");
      response.result.entries.forEach(entry => {
        // console.log("========");
        console.log(entry);
        const { name, path_lower } = entry;

        const filename = path.resolve(currFolder, name);

        if (entry[".tag"] === "file" && !fs.existsSync(filename)) {
          dbx
            .filesDownload({ path: path_lower })
            .then(data => {
              console.log("========");
              console.log("========");
              console.log("========");
              console.log(data);
              const filecontents = data.result.fileBinary.toString();

              fs.outputFile(filename, filecontents).catch(error => {
                if (error) {
                  return console.log("Error: file failed to write", name, error);
                }
              });
            })
            .catch(error => {
              console.log("Error: file failed to download", name, error);
            });
        }
        else if (entry[".tag"] === "folder") {
            recursivelyDownloadFromDropbox(name, path.resolve(relativeToDropboxDirectory, name), "/");
        }
        else {
          console.log(">>> Skipping file we already have: " + filename);
        }
      });
    })
    .catch(error => {
      console.log("Error retrieving folder: " + error);
    });
}

recursivelyDownloadFromDropbox();
