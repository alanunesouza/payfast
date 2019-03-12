var soap = require('soap');


function correiosSOAPClient() {
    this._url = 'http://ws.correios.com.br/calculador/CalcPrecoPrazo.asmx?wsdl'
}

correiosSOAPClient.prototype.calculaPrazo = function(args, callback) {
    soap.createClient(this._url, function(error, client) {
        console.log('Client Soap created');
        client.CalcPrazo(args, callback);
    });
}

module.exports = function() {
    return correiosSOAPClient;
}