module.exports = function(app) {
    app.post('/cartoes/autoriza', function(req, res){
        console.log('Processing payment with card');

        var cartao = req.body;

        req.assert("numero", "Número é obrigatório e deve ter 16 caracteres.").notEmpty().len(16,16);
        req.assert("bandeira", "Bandeira do cartão é obrigatória.").notEmpty();
        req.assert("ano_de_expiracao", "Ano de expiração é obrigatório.").notEmpty();
        req.assert("mes_de_expiracao", "Mês de expiração é obrigatório.").notEmpty();
        req.assert("cvv", "CVV é obrigatório e deve ter 3 caracteres.").notEmpty().len(3,3);

        var errors = req.validationErrors();

        if(errors) {
            console.log("Erros de validação encontrados");

            res.status(400).send(errors);
            return;
        }

        cartao.status = 'AUTORIZHED';

        var response = {
            dados_do_cartao: cartao
        };

        res.status(201).json(response);

        return;
    });
}

