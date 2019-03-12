var logger = require('../services/logger');

module.exports = function(app) {
    app.get('/pagamentos', function(req, res){
        console.log('Received the test request');
        res.send('Ok')
    });

    app.get('/pagamentos/pagamento/:id', function(req, res) {
        var id = req.params.id;
        console.log('consultando pagamento: ', id);
        logger.info('consultando pagamento: ', id);

        var memcachedClient = app.services.memcachedClient();

        memcachedClient.get(`pagamento-${id}`, function(erro, retorno) {
            if(erro || !retorno) {
                console.log('MISS - chave não encontrada');

                var connection = app.persistencia.connectionFactory();
                var pagamentoDao = new app.persistencia.PagamentoDao(connection);

                pagamentoDao.buscaPorId(id, function(erro, resultado) {
                    if(erro) {
                        console.log('erro ao consultar no banco: ', erro);
                        res.status(500).send(erro);
                        return;
                    }

                    console.log('pagamento encontrado: ', JSON.stringify(resultado));
                    res.json(resultado);
                    return;
                });
                //HIT no cache
            } else {
                console.log('HIT - valor: ', JSON.stringify(retorno));
                res.json(retorno);
                return;
            }
        });
    });

    app.delete('/pagamentos/pagamento/:id', function(req, res) {
        var pagamento = {};
        var id = req.params.id;

        pagamento.id = id;
        pagamento.status = 'CANCELED';

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentoDao(connection);

        pagamentoDao.atualiza(pagamento, function(error) {
            if(error) {
                res.status(500).send(error);
                return;
            }
            console.log('Pagamento cancelado');
            res.send(pagamento);
        });
    });

    app.put('/pagamentos/pagamento/:id', function(req, res) {
        var pagamento = {};
        var id = req.params.id;

        pagamento.id = id;
        pagamento.status = 'CONFIRMED';

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentoDao(connection);

        pagamentoDao.atualiza(pagamento, function(error) {
            if(error) {
                res.status(500).send(error);
                return;
            }
            console.log('Pagamento confirmado');
            res.status(204).send(pagamento);
        });
    });

    app.post('/pagamentos/pagamento', function(req, res) {
        var pagamento = req.body["pagamento"];

        req.assert("pagamento.forma_de_pagamento", "Forma de pagamento é obrigatória.").notEmpty();
        req.assert("pagamento.valor", "Valor é obrigatório e deve ser um decimal.").notEmpty().isFloat();
        req.assert("pagamento.moeda", "Moeda é obrigatória e deve ter 3 caracteres").notEmpty().len(3,3);

        var errors = req.validationErrors();

        if (errors){
            console.log("Erros de validação encontrados");
            res.status(400).send(errors);
            return;
        }
        console.log('processando pagamento...');

        pagamento.status = 'CREATED';
        pagamento.data = new Date;

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentoDao(connection);

        pagamentoDao.salva(pagamento, function(error, result) {
            if(error) {
                console.log('Erro ao inserir no banco:' + error)
                res.status(500).send(error);
            } else {
                pagamento.id = result.insertId;
                console.log('Pagamento criado.');

                var memcachedClient = app.services.memcachedClient();

                memcachedClient.set(`pagamento-${pagamento.id}`, pagamento, 60000, function(erro) {
                    console.log('nova chave adicionada ao cache: pagamento-', pagamento.id);
                });

                if(pagamento.forma_de_pagamento == 'cartao') {

                    var cartao = req.body["cartao"];
                    var clienteCartoes = new app.services.clienteCartoes();

                    clienteCartoes.autoriza(cartao, function(exception, request, response, retorno) {
                        if(exception) {
                            console.log("exception ==> ", exception);
                            res.status(400).send(exception['message']);
                            return;
                        }

                        console.log(retorno);

                        res.location(`/pagamentos/pagamento/${pagamento.id}`);
                
                        var response = {
                            dados_do_pagamento: pagamento,
                            cartao: retorno,
                            links: [
                                {
                                    href: `http://localhost:3000/pagamentos/pagamento/${pagamento.id}`,
                                    rel: "confirmar",
                                    method: "PUT"
                                },
                                {
                                    href: `http://localhost:3000/pagamentos/pagamento/${pagamento.id}`,
                                    rel: "cancelar",
                                    method: "DELETE"
                                }
                            ]
                        }        

                        res.status(201).json(response);
                        return;
                    });

                } else {
                    console.log(result)

                    res.location(`/pagamentos/pagamento/${pagamento.id}`);
                    
                    var response = {
                        dados_do_pagamento: pagamento,
                        links: [
                            {
                                href: `http://localhost:3000/pagamentos/pagamento/${pagamento.id}`,
                                rel: "confirmar",
                                method: "PUT"
                            },
                            {
                                href: `http://localhost:3000/pagamentos/pagamento/${pagamento.id}`,
                                rel: "cancelar",
                                method: "DELETE"
                            }
                        ]
                    }

                    res.status(201).json(response);
                }
            }
        });

    });
}

