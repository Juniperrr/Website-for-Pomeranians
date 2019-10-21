const webby = require("./webby.js");
const app = new webby.App();
const path = require('path');
const fs = require('fs');

app.use(webby.static(path.join(__dirname, '..', 'public')));


app.get('/', function(req, res) {
    fs.readFile(path.join(__dirname, '..', 'public/index.html'), (err, data) => {
        if (err) {
          res.send('Something went wrong');
        } else {
          res.send(data);
        }
    });
});

app.get('/gallery', function(req, res) {
    const rand = 1 + Math.floor(Math.random() * 4);
    let imageString = "<h1>Cuteness overload...</h1>";
    for(let i = 1; i <= rand; i++) {
        let imageSource = "";
        imageSource += "<img src = '/img/animal" + i + ".jpg' width = '300' height = '300'/>";
        imageString += imageSource;
    }
    res.send(imageString);
});

app.get('/pics', function(req, res) {
    res.send("redirect");
});

app.listen(3000, 'localhost');