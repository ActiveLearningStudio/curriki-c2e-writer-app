const express = require("express"); //Import the express dependency
const app = express(); //Instantiate an express app, the main work horse of this server
const port = 5000;
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
const sample = require("./sample.js");
const fileUpload = require("express-fileupload");
var cors = require("cors");
const corsOpts = {
  origin: '*',

  methods: [
    'GET',
    'POST',
  ],

  allowedHeaders: [
    'Content-Type',
  ],
};
app.use(cors(corsOpts));

app.use(fileUpload({
    limits: {
        fileSize: 5 * 2024 * 1024 * 1024 //10gb
    },
    abortOnLimit: true
 }));

const outputFolder = "example_output";

app.post("/upload", (req, res) => {
  // res.sendFile("index.html", { root: __dirname }); //server responds by sending the index.html file to the client's browser
  fs.rmSync(outputFolder	, { recursive: true, force: true });
  
  // Uploaded path
  const uploadedFile = req.files.uploadFile;
  
  // Upload path
  const uploadPath = __dirname + "/uploads/" + uploadedFile.name;
  
  //Output File Name with .c2e extention
  const outputZip=uploadedFile.name.substring(0, uploadedFile.name.length-4)+'.c2e';
  
  // To save the file using mv() function
  uploadedFile.mv(uploadPath, function (err) {
	if (err) {
		console.log(err);
		res.send("Failed !!");
    } 
  //read the zip file
  const zipper = new AdmZip(uploadPath);
  
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
        // recursive function
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
          ...sample,
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
          ...sample,
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
});



app.listen(port, () => {
  //server starts listening for any attempts from a client to connect at port: {port}
  console.log(`Now listening on port ${port}`);
});
