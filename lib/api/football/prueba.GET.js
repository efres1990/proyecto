'use strict';
// Declare internals

const internals = {};


exports.register = (server, options, next) => {

    // Code inside the callback function of server.dependency will only be executed
    // after Auth plugin has been registered. It's triggered by server.start,
    // and runs before actual starting of the server.  It's done because the call to
    // server.route upon registration with auth:'basic' config would fail and make
    // the server crash if the basic strategy is not previously registered by Auth.

    server.dependency('hapi-mongodb', internals.after);//te aseguras que se carga el plugin antes de la conexion

    return next();
};

exports.register.attributes = {
    name:'eventsAssistance'
};

internals.after = (server, next) => {
internals.dbAdministration = server.plugins['hapi-mongodb'].db[0];
    server.route({
        method: 'GET',
        path: '/football/prueba',
        config:{
            description:'prueba bbdd',
            handler: (request, reply) => {
              var db = request.server.plugins['hapi-mongodb'].db[0];
              var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
              db.collection('docs101').find({'id':2}).toArray((err, result) =>{//toAarray si no tenemos un objeto cursor que no puede devolver reply
        if (err) {
          return reply(Boom.internal('Internal MongoDB error', err));
        }
        return reply(result);

    });
    /* var array=new Array();
     cursor.each(function(err, item) {
         if (item!==null){
             array.push(item);
         }
       console.log("Bien"+array.length);
       if (item===null){
           return reply(array);
       }*/

            }
        }
    });


    return next();
};
