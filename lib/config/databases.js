'use strict';

const Fs = require('fs');
// Read the certificate authority


const internals = {
  mongoConnections:[
     {
            url: 'mongodb://elafr:3333333@ds052968.mlab.com:52968/code101',
            settings: {
                server: { ssl: false },
                replset: { sslValidate: true }
            }
        },
        {
               url: 'mongodb://elafr:papaya123@ds051585.mlab.com:51585/predinten',
               settings: {
                   server: { ssl: false },
                   replset: { sslValidate: true }
               }
           }
      ],
};

module.exports = internals;
