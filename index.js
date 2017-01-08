var express = require('express');
var validUrl = require('valid-url');
var Base62 = require('base62');
require('dotenv').config();

var mongoose = require('mongoose');
mongoose.connect(process.env.MLAB_URL);
var short_url_schema = new mongoose.Schema({
    actual_url: String,
    short_url: String
})
var Short_url = mongoose.model('Short_url', short_url_schema);

var app = express();
app.set('port',(process.env.PORT || 8080))
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/instruction.html');
})

app.get('/new/:url(*)', function (req, res) {
    if (isValidUrl(req.params.url)) {
        //res.send('url is ' + req.params.url);
        Short_url.count(function (err, counter) {
            if (err) throw err;
            console.log('counter is', counter);
            Short_url.findOne({ actual_url: req.params.url }, function (err, data) {
                if (err) throw err;
                if (!data) {
                    console.log('new data so we will be insert wher counter is ' + counter + 'and short url will be' + Base62.encode(counter));
                    Short_url({ actual_url: req.params.url, short_url: Base62.encode(counter) }).save(function (err, data) {
                        if (err) throw err;
                        console.log(data);
                        res.send({
                            original_url: data.actual_url,
                            short_url: req.get('Host') + '/' + data.short_url
                        });
                    })
                } else {
                    console.log("already iserted data");
                }
            });
        });
    } else {
        res.send(req.params.url + ' is not a url');
    }
})

app.get('/:short_id', function (req, res) {
    var short_id = req.params.short_id;
    Short_url.findOne({ short_url: short_id }, function (err, data) {
        if (err) throw err;
        if (data) {
            res.statusCode = 302;
            console.log(data.actual_url);
            res.setHeader("Location", "" + data.actual_url);
            res.end();
        } else {
            res.send('invalid short url');
        }
    })
})

function isValidUrl(str){
    var reg = new RegExp('^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$','i')

    return  reg.test(str);
}



