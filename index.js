const express = require("express"); //Import the express dependency
const app = express(); //Instantiate an express app, the main work horse of this server
const port = 5000; //Save the port number where your server will be listening
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
const smaple = require("./sample.js");
const { json } = require("express");
const zipFile = "example.zip";
const outputFolder = "example_output";
//Idiomatic expression in express to route and respond to a client request
app.get("/", (req, res) => {
  //get requests to the root ("/") will route here
  // res.sendFile("index.html", { root: __dirname }); //server responds by sending the index.html file to the client's browser
  //the .sendFile method needs the absolute path to the file, see: https://expressjs.com/en/4x/api.html#res.sendFile
  console.log(smaple);
  // Extract the zip file
  fs.rmSync(outputFolder, { recursive: true, force: true });
  const zipper = new AdmZip(zipFile);
  zipper.extractAllTo(outputFolder, true);

  // Write the directory paths to a text file in each directory
  function writeDirectoryPaths(dir, file) {
    const directoryPaths = [];
    const filePathsh5p = [];
    fs.readdirSync(dir).forEach((file) => {
      const filePath = path.join(dir, file);

      if (fs.statSync(filePath).isDirectory()) {
        directoryPaths.push(filePath);

        writeDirectoryPaths(filePath, path.join(filePath, "c2e.json"));
      } else {
        filePathsh5p.push(filePath);
      }
    });

    var manifestCouple = directoryPaths.map((data) => {
      return {
        "@id": "c2ens:c2eid-xxx-2",
        "@type": "C2E",
        "@index": "2",
        name: "project name",
        c2eType: "H5P",
        subManifest: data.replace("example_output/", "") + "/c2e.json",
      };
    });
    var resourceCouple = filePathsh5p.map((data) => {
      // if (!data.includes("c2e.json")) {
      return {
        "@id": "c2ens:c2eid-xxx/resource/1",
        "@type": "sdons:DigitalDocument",
        url: data.split("/")[data.split("/").length - 1],
        fileFormat: data.split(".")?.[1],
      };
      // }
    });
    resourceCouple = [
      ...resourceCouple,
      ...directoryPaths.map((data) => {
        // if (!data.includes("c2e.json")) {
        return {
          "@id": "c2ens:c2eid-xxx/resource/1",
          "@type": "sdons:DigitalDocument",
          url: data.split("/")[data.split("/").length - 1],
          fileFormat: data.split(".")?.[1] || "directory",
        };
        // }
      }),
    ];
    if (directoryPaths.length > 0) {
      fs.writeFileSync(
        file,
        JSON.stringify({
          ...smaple,
          c2eContain: [
            {
              "@id": "c2eTerm:c2eResources",
              "@type": "sdons:Collection",
              c2eResources: resourceCouple,
            },
            {
              "@id": "c2eTerm:c2eComponents",
              "@type": "sdons:Collection",
              c2eComponents: [
                {
                  "@id": "c2ens:c2eid-xxx-1",
                  "@type": "C2E",
                  "@index": "1",
                  name: "Sample Activity Content 1",
                  c2eType: "H5P",
                  c2eResources: [],
                },
                ...manifestCouple,
              ],
            },
          ],
        })
      );
    } else {
      console.log("files", file);
      fs.writeFileSync(
        file,
        JSON.stringify({
          ...smaple,
          c2eContain: [
            {
              "@id": "c2eTerm:c2eResources",
              "@type": "sdons:Collection",
              c2eResources: resourceCouple,
            },
            {
              "@id": "c2eTerm:c2eComponents",
              "@type": "sdons:Collection",
              c2eComponents: [
                {
                  "@id": "c2ens:c2eid-xxx-1",
                  "@type": "C2E",
                  "@index": "1",
                  name: "Sample Activity Content 1",
                  c2eType: "H5P",
                  c2eResources: [],
                },
              ],
            },
          ],
        })
      );
    }
  }
  writeDirectoryPaths(outputFolder, path.join(outputFolder, "c2e.json"));

  // Create the updated zip file
  const outputZip = "updated_example.zip";
  const zip = new AdmZip();
  zip.addLocalFolder(outputFolder, "");
  zip.writeZip(outputZip);
  const data = zip.toBuffer();
  res.set("Content-Type", "application/octet-stream");
  res.set("Content-Disposition", `attachment; filename=${outputZip}`);
  res.set("Content-Length", data.length);
  res.send(data);
  // Download the updated zip file
  // ... (you'll need to implement this part yourself)
});

app.listen(port, () => {
  //server starts listening for any attempts from a client to connect at port: {port}
  console.log(`Now listening on port ${port}`);
});
