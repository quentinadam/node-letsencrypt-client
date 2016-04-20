"use strict";

const crypto = require("crypto");
const request = require("./request");
const base64url = require("./base64url");
const sha256 = require("./sha256");

class ACMERequester {
    
    constructor(accountKey) {
        this.accountKey = accountKey;
    }
    
    request(url, payload, options) {
        return request("/directory").then((result) => {
            let nonce = result.headers["replay-nonce"];
            let payload64 = base64url(JSON.stringify(payload));
            let protectedHeader = Object.assign({}, this.accountKey.header, {nonce: nonce});
            let protectedHeader64 = base64url(JSON.stringify(protectedHeader));
            let signature = crypto.createSign("RSA-SHA256").update(protectedHeader64 + "." + payload64).sign(this.accountKey.pem);
            let signature64 = base64url(signature);
            let data = JSON.stringify({
                header: this.accountKey.header, 
                protected: protectedHeader64,
                payload: payload64,
                signature: signature64,
            });
            return request(url, Object.assign({method: "POST", body: data}, options));
        });
    }
    
}

module.exports = ACMERequester;
