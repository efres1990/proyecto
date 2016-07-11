'use strict';

// Load modules

const Hoek = require('hoek');
const Boom = require('boom');


// Declare internals

const internals = {};


/**
 * Busca las credenciales de el ID que está haciendo la solicitud
 */
internals.getCredentialsFunc = function (id, callback) {

    if (!id) {
        return callback(Boom.unauthorized('Invalid credentials object'));
    }

    // Hacemos un project de los datos que queremos devolver (y solo la appId coincidente)
    return internals.dbAdministration.collection('users').findOne({ 'apps': { $elemMatch: { 'id': id } } }, { 'email': 1, 'name': 1, 'apps.$': 1 })
        .then( (user, err) => {

            if (err) {
                return callback(err);
            }

            // Movemos las credenciales a la raíz de credentials y eliminamos apps
            const credentials = Hoek.clone(user);
            credentials.key = credentials.apps[0].key;
            credentials.algorithm = credentials.apps[0].algorithm;
            delete credentials.apps;
            delete credentials._id;

            return callback(null, credentials);
        });
};


exports.register = (server, options, next) => {

    // Code inside the callback function of server.dependency will only be
    // executed after hapi-auth-basic has been registered.  It's triggered by
    // server.start, and runs before actual starting of the server.  It's done because
    // the call to server.auth.strategy upon registration would fail and make the
    // server crash if the basic scheme is not previously registered by hapi-auth-basic.

    server.dependency(['hapi-auth-hawk', 'hapi-mongodb'], internals.after);

    return next();
};

exports.register.attributes = {
    name: 'AuthHawk'
};


internals.after = (server, next) => {

    internals.dbAdministration = server.plugins['hapi-mongodb'].db[1];

    server.auth.strategy('hawk', 'hawk', 'required', { getCredentialsFunc: internals.getCredentialsFunc });

    return next();
};
