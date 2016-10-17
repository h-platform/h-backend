var seneca            = require('seneca')();
var client            = seneca.client();
var Boom              = require("boom");
var promise           = require('bluebird');
var Joi               = require('joi');
var global_config     = require('config');
var UrlProcesser      = require('./UrlFilterProcesser')
var _                 = require('lodash');
var l                 = require('../logger');
var Boom              = require('boom');

client.actAsync = promise.promisify(client.act, {
    multiArgs: false,
    context: client
});

module.exports = function(config){
  return {
    handleOptionsRequest: function(request, reply){
        reply({})
        .header('Access-Control-Allow-Origin','*')
        .header('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,DELETE,BATCH')
        .header('Access-Control-Allow-Headers', 'Content-Type');
    },

    handleOptionsRequestForId: function(request, reply){
        reply({})
        .header('Access-Control-Allow-Origin','*')
        .header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,DELETE')
        .header('Access-Control-Allow-Headers', 'Content-Type');
    },


    handleGetRequest: function(request, reply){
      var tray = {};
      seneca.client();
      var seneca_request = { role:'database', model: config.model, cmd:'queryPagedRecords', url: request.url.path,  where:[]};
      var wheres = UrlProcesser.processFilters(request.url.path);

      if((pageSize = parseInt(request.query.pageSize)) > 0){
        seneca_request.pageSize = pageSize;
      }

      if((page = parseInt(request.query.page)) > 0){
        seneca_request.page = page;
      }

      if(request.query.keyword){
        seneca_request.keyword = request.query.keyword;
      } 

      seneca_request.where = wheres;
      console.log('----------------------->', seneca_request);
      client.actAsync(seneca_request)
      .then(function(res){
          console.log(request.url.path);
          reply(res)
          .header('Access-Control-Allow-Origin','*')
          .header('Content-Type', 'application/json');
      });
    },


    handlePostRequest: function(request, reply){
      console.log('post request payload:', request.payload);
      client.act({ role:'database', model: config.model, cmd:'insertRecord', record: request.payload}, function (err, result) {
          if(err) {
              console.log('************** error');
              console.log(err.details.orig$);
              reply.view('500',{msg: ''});
          } else {
              reply(result)
              .header('Access-Control-Allow-Origin','*')
              .header('Content-Type', 'application/json');
          }
      });
    },

    handleDeleteRequest: function(request, reply){
      client.act({ role:'database', model: config.model, cmd:'deleteRecord', record: request.payload}, function (err, result) {
        if(err) {
            console.log('************** error');
            console.log(err.details.orig$);
            reply.view('500',{msg: ''});
        } else {
            reply(result)
            .header('Access-Control-Allow-Origin','*')
            .header('Content-Type', 'application/json');
        }
      });
    },

    handleGetRequestForId: function(request, reply){
      var tray = {};
      seneca.client();
      client.actAsync({ role:'database', model: config.model, cmd:'getRecord', id: request.params.id, url: request.url.path})
      .then(function(res){
          reply(res)
          .header('Access-Control-Allow-Origin','*')
          .header('Content-Type', 'application/json');
      });
    },

    handlePutRequestForId: function(request, reply){
      client.act({ role:'database', model: config.model, cmd:'updateRecord', record: request.payload, id:request.params.id}, function (err, result) {
          console.log(request.payload);
          if(err) {
              console.log('************** error');
              console.log(err.details.orig$);
              reply(Boom.internal(err.details.orig$));
          } else {
              reply(result)
              .header('Access-Control-Allow-Origin','*')
              .header('Content-Type', 'application/json');
          }
      });
    },

    handleDeleteRequestForId: function(request, reply){
      client.act({ role:'database', model: config.model, cmd:'deleteRecord', record: request.payload, id:request.params.id}, function (err, result) {
        console.log('record to be deleted:',request.payload);
        if(err) {
            l.error(err.details.orig$);
            reply(Boom.methodNotAllowed('Internal Error Occured',err.details.orig$));
        } else {
            reply(result);
        }
      });
    }
  };
};