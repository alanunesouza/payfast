var express = require('express');
var consign = require('consign');
var bodyParser = require('body-parser');
var ExpressValidator = require('express-validator');

module.exports = function() {
    var app = express();

    app.use(bodyParser.json());
    app.use(ExpressValidator());

    consign()
        .include('controllers')
        .into(app);

    return app;
};