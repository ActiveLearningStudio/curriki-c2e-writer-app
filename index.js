const express = require("express"); //Import the express dependency
const app = express(); //Instantiate an express app, the main work horse of this server
const port = 5000;
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
// c2e menifesto sample  file
const smaple = require("./sample.js");
// upload any zip file here, copy in root and change name here
const zipFile = "curriki-project-5.zip";
const outputFolder = "example_output";
app.get("/", (req, res) => {
  //get requests to the root ("/") will route here
  // res.sendFile("index.html", { root: __dirname }); //server responds by sending the index.html file to the client's browser
  fs.rmSync(outputFolder, { recursive: true, force: true });
  //read the zip file
  const zipper = new AdmZip(zipFile);
  // extract zip file
  zipper.extractAllTo(outputFolder, true);

  // Write the c2e file path in each directory
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
    // write submesnifest path for each c2e json
    var manifestCouple = directoryPaths.map((data) => {
      return {
        "@id": "c2ens:c2eid-xxx-2",
        "@type": "C2E",
        "@index": "2",
        name: data.split("/")[data.split("/").length - 1],
        c2eType: "H5P",
        subManifest: data.replace("example_output/", "") + "/c2e.json",
      };
    });
    // write resource path and folder name
    var resourceCouple = filePathsh5p.map((data) => {
      return {
        "@id": "c2ens:c2eid-xxx/resource/1",
        "@type": "sdons:DigitalDocument",
        url: data.split("/")[data.split("/").length - 1],
        fileFormat: data.split(".")?.[1],
      };
    });
    resourceCouple = [
      ...resourceCouple,
      ...directoryPaths.map((data) => {
        return {
          "@id": "c2ens:c2eid-xxx/resource/1",
          "@type": "sdons:DigitalDocument",
          url: data.split("/")[data.split("/").length - 1],
          fileFormat: data.split(".")?.[1] || "directory",
        };
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
              c2eComponents: [...manifestCouple],
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
              c2eComponents: [],
            },
          ],
        })
      );
    }
  }
  writeDirectoryPaths(outputFolder, path.join(outputFolder, "c2e.json"));

  // Create the updated zip file
  const outputZip = "c2e-project.zip";
  const zip = new AdmZip();
  zip.addLocalFolder(outputFolder, "");
  zip.writeZip(outputZip);
  const data = zip.toBuffer();
  // downlaod c2e zip project
  res.set("Content-Type", "application/octet-stream");
  res.set("Content-Disposition", `attachment; filename=${outputZip}`);
  res.set("Content-Length", data.length);
  res.send(data);
});

app.listen(port, () => {
  //server starts listening for any attempts from a client to connect at port: {port}
  console.log(`Now listening on port ${port}`);
});
