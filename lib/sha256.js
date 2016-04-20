"use strict";

const crypto = require("crypto");

module.exports = function(value) {
    return crypto.createHash("sha256").update(value).digest();
}