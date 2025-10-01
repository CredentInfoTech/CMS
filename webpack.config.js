
// filepath: c:\Credent\CMS\webpack.config.js
const path = require("path");

module.exports = {
    // ...existing code...
    resolve: {
        alias: {
            ControlStrings: path.resolve(__dirname, "src/webparts/cmsRebuild/ControlStrings.js"),
        },
    },
};
