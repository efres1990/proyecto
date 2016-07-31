'use strict';


const Hoek = require('hoek');
const Glue = require('glue');
const Server = require('./index.js');
const DatabasesConfiguration = require('./config/databases.js');
const SecurityConfiguration = require('./config/security.js');
const Vision = require('vision');
const Inert = require('inert');
const Lout = require('lout');
// Declare internals

const internals = {};

internals.manifest = {
    connections: [
        {
            host: '0.0.0.0',
            port: 3030,
          //  tls: SecurityConfiguration.tls
        }
    ],
    registrations: [
        {
            plugin:'./api/football/equipo.GET.js'
        },
        {
            plugin: './api/football/confirmacionLogin.GET.js'
        },
        {
            plugin: 'hapi-auth-hawk'
        },
        {
            plugin: {
                register:'hapi-mongodb',
                options: DatabasesConfiguration.mongoConnections
            }
        },
        {
            plugin: {
                register:'Inert'
            }
        },
        {
            plugin: {
                register:'Lout'
            }
        },
        {
            plugin: {
                register:'Vision'
            }
        }
    ]
};

internals.composeOptions = {
    relativeTo: __dirname
};


Server.init(internals.manifest, internals.composeOptions, (err, server) => {

    Hoek.assert(!err, err);

    console.log('Server running at:', server.info.uri);
});
