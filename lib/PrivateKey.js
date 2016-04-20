"use strict";

const childProcess = require("child_process");
const base64url = require("./base64url");
const sha256 = require("./sha256");

class PrivateKey {
    constructor(pem) {
        this.pem = pem;
        this._parseKey();
        this.header = {
            alg: "RS256", 
            jwk: {
                e: base64url(this.publicExponent),
                kty: "RSA",
                n: base64url(this.modulus),
            },
        };
        this.thumbprint = base64url(sha256(JSON.stringify(this.header.jwk)));
    }
    
    _parseKey() {
        let output = childProcess.execSync("openssl rsa -noout -text", {input: this.pem, encoding: "utf8"});
        this.publicExponent = this._parsePublicExponent(output);
        this.modulus = this._parseModulus(output)
    }
    
    _parsePublicExponent(output) {
        let match = output.match(/publicExponent:\s+([0-9]+)/);
        if (!match) throw new Error("Could not find publicExponent");
        let hex = parseInt(match[1]).toString(16);
        if (hex.length % 2 == 1) hex = "0" + hex;
        return new Buffer(hex, "hex");
    }
    
    _parseModulus(output) {
        let match = output.match(/modulus:\n\s+00((\:(\n\s+)?[0-9a-f]{2})+)/);
        if (!match) throw new Error("Could not find modulus");
        let hex = match[1].replace(/(\s|\:)/g, "");
        return new Buffer(hex, "hex");
    }
}

module.exports = PrivateKey;
