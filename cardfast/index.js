var app = require('./config/custom-express')();

app.listen(3001, function() {
    console.log('Server of the cards running in port 3001');
})

