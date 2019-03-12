var fs = require('fs');

fs.createReadStream('imagem.jpg')
    .pipe(fs.createWriteStream('imagem-com-stream.png'))
    .on('finish', function() {
        console.log('file writed with stream');
    });