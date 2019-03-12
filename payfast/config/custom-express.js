var express = require('express');
var consign = require('consign');
var bodyParser = require('body-parser');
var ExpressValidator = require('express-validator');
var morgan = require('morgan');
var logger = require('../services/logger');

module.exports = function() {
    var app = express();

    //Middleware do Morgan
    app.use(morgan("common", {
        stream: {
            write: function(mensagem) {
                logger.info(mensagem);
            }
        }
    }));

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(ExpressValidator());

    consign()
        .include('controllers')
        .then('persistencia')
        .then('services')
        .into(app);

    return app;
};