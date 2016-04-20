"use strict";

const request = require("request");

module.exports = function(url, options) {
    if (url.substr(0, 1) == "/") url = "https://acme-v01.api.letsencrypt.org" + url;
    return new Promise((resolve, reject) => {
        //console.log("requesting " + url);
        request(url, options, (error, response, body) => {
            if (error) return reject(error);
            //console.log({headers: response.headers, statusCode: response.statusCode, body: body});
            resolve({headers: response.headers, statusCode: response.statusCode, body: body});
        });
    });
}
