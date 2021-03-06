/*Define dependencies.*/

var express = require("express");
var path = require('path');
var multer = require('multer');
var app = express();
var done = false;

var fs = require("fs");
var sqlite3 = require("sqlite3").verbose();
var file = __dirname + "/" + "file.db";
var exists = fs.existsSync(file);

if (!exists) {
    console.log("Creating DB file.");
    fs.openSync(file, "w");
    var db = new sqlite3.Database(file);
    db.run("CREATE TABLE FILELIST (filename TEXT)");
    db.close();
}

/*Configure the multer.*/

app.use(multer({
    dest: './uploads/',
    rename: function(fieldname, filename) {
        return filename + Date.now();
    },
    onFileUploadStart: function(file) {
        console.log(file.originalname + ' is starting ...');
    },
    onFileUploadComplete: function(file) {
        console.log(file.fieldname + ' uploaded to  ' + file.path);
        done = true;
    }
}));

app.use("/uploads", express.static(__dirname + '/uploads'));
app.use("/static", express.static(__dirname + '/static'));

/*Handling routes.*/

app.get('/', function(req, res) {
    res.sendFile('index.html', {
        root: __dirname
    });
});

app.post('/upload', function(req, res) {
    if (done === true) {
        console.log(req.files);
        var db = new sqlite3.Database(file);
        db.serialize(function() {
            var stmt = db.prepare("INSERT INTO FILELIST VALUES (?)");
            stmt.run(req.files.file.name);
            console.log(req.files.file.name);
            stmt.finalize();
        });
        db.close();
        res.end("File uploaded.");
    }
});

app.get('/latest', function(req, res) {
    var db = new sqlite3.Database(file);
    db.serialize(function() {
        db.get("SELECT rowid AS id, filename FROM FILELIST ORDER BY rowid desc LIMIT 1", function(err, row) {
            if (row) {
                console.log("Latest File: " + row.id + ": " + row.filename);
                res.send('<img src="/uploads/' + row.filename + '">');
            } else {
                res.send('');
            }
        });
    });
    db.close();
});

/*Run the server.*/
app.listen(4402, function() {
    console.log("Working on port 4402");
});
