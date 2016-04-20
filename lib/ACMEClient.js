"use strict";

const childProcess = require("child_process");
const PrivateKey = require("./PrivateKey");
const ACMERequester = require("./ACMERequester");
const base64url = require("./base64url");
const request = require("./request");

class ACMEClient {
    
    constructor(accountKey) {
        this.accountKey = new PrivateKey(accountKey);
        this.requester = new ACMERequester(this.accountKey);
    }
    
    register() {
        return this.requester.request("/acme/new-reg", {
            resource: "new-reg", 
            agreement: "https://letsencrypt.org/documents/LE-SA-v1.0.1-July-27-2015.pdf",
        }).then((result) => {
            if (result.statusCode != 201 && result.statusCode != 409) {
                throw new Error("Error registering: " + result.statusCode + " " + result.body);
            }
        });
    }
    
    requestAuthorization(domain) {
        return this.requester.request("/acme/new-authz", {
            resource: "new-authz",
            identifier: {"type": "dns", "value": domain},
        }).then((result) => {
            if (result.statusCode != 201) {
                throw new Error("Error requesting authorization: " + result.statusCode + " " + result.body);
            }
            let json = JSON.parse(result.body);
            let challenge = json.challenges.find((challenge) => challenge.type == "http-01");
            challenge.path = "/.well-known/acme-challenge/" + challenge.token;
            challenge.keyAuthorization = challenge.token + "." + this.accountKey.thumbprint;
            return challenge;
        });
    }
    
    triggerChallenge(challenge) {
        return this.requester.request(challenge.uri, {
            resource: "challenge", 
            keyAuthorization: challenge.keyAuthorization,
        }).then((result) => {
            if (result.statusCode != 202) {
                throw new Error("Error triggering challenge: " + result.statusCode + " " + result.body);
            }
        });
    }
    
    checkChallenge(challenge) {
        return request(challenge.uri).then((result) => {
            if (result.statusCode != 202) {
                throw new Error("Error checking challenge: " + result.statusCode + " " + result.body);
            }
            let json = JSON.parse(result.body);
            return json.status;
        });
    }
    
    requestCertificate(csr) {
        return this.requester.request("/acme/new-cert", {
            resource: "new-cert", 
            csr: base64url(convertPEMtoDER(csr)),
        }, {encoding: null}).then((result) => {
            if (result.statusCode != 201) {
                throw new Error("Error requesting certificate: " + result.statusCode + " " + result.body);
            }
            let pem = convertDERtoPEM(result.body, "CERTIFICATE");
            return pem;
        });
    }
}

function convertPEMtoDER(pem) {
    return new Buffer(pem.toString().replace(/(^\s+|\s*$)/, "").split("\n").slice(1, -1).join(""), "base64");
}

function convertDERtoPEM(der, title) {
    title = title.toUpperCase();
    let body = der.toString("base64");
    let lines = [];
    lines.push("-----BEGIN " + title + "-----");
    for (let i = 0; i < body.length; i += 64) {
        lines.push(body.substr(i, 64));
    }
    lines.push("-----END " + title + "-----");
    lines.push();
    return lines.join("\n");
}

module.exports = ACMEClient;
