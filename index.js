//#region Imports

const moment = require("moment");
const fs = require("fs");

//#endregion

//#region Properties

const fileNames = fs.readdirSync("Files");

//#endregion

//#region Constants

const ESTIMATED_PRINT_TIME_REGEX = /\; estimated printing time \([a-zA-Z\s]+\) \= ([0-9]+(d|h|m|s)\s)+/g;
const FILAMENT_USAGE_REGEX = /\; total filament used \[g\] \= [0-9]+(\.[0-9]+)?/g;

//#endregion

let analysis = {
    filament: {
        kilograms: 0,
        grams: 0,
    },
    time: {
        normalMode: {
            milliseconds: 0 // Used for processing
        },
        silentMode: {
            milliseconds: 0 // Used for processing
        }
    }
};

// Iterate through the file names
for (const fileName of fileNames) {
    // Read contents of gcode file
    const gcode = fs.readFileSync(`Files/${fileName}`).toString();

    // Execute calculations
    analysis.filament.grams += extractFilamentUsage(gcode);
    extractTimeEstimate(gcode);
}

/**
 * @param {string} gcode 
 */
function extractFilamentUsage(gcode) {
    const matches = gcode.match(FILAMENT_USAGE_REGEX);

    if (matches.length) {
        const match = matches[0];

        return parseFloat(match.split(/\; total filament used \[g\] \= /g)[1]);
    }

    return 0;
}

/**
 * @param {string} gcode 
 */
function extractTimeEstimate(gcode) {
    const matches = gcode.match(ESTIMATED_PRINT_TIME_REGEX);

    if (matches.length) {
        for (const match of matches) {
            const timeEstimate = match.split(/=/g)[1].trim();
            const totalMilliseconds = timeToMilliseconds(timeEstimate);

            if (match.indexOf("normal") >= 0) {
                analysis.time.normalMode.milliseconds += totalMilliseconds;
            } else {
                analysis.time.silentMode.milliseconds += totalMilliseconds;
            }
        }
    }
}

/**
 * @param {string} timeEstimate 
 */
function timeToMilliseconds(timeEstimate) {
    let totalMilliseconds = 0;

    let values = timeEstimate.split(/\s/g);
    for (let value of values) {
        let num = value.split(/[a-zA-Z]+/g)[0];

        if (value.endsWith("d")) {
            totalMilliseconds += num * 24 * 60 * 60 * 1000;
        } else if (value.endsWith("h")) {
            totalMilliseconds += num * 60 * 60 * 1000;
        } else if (value.endsWith("m")) {
            totalMilliseconds += num * 60 * 1000;
        } else if (value.endsWith("s")) {
            totalMilliseconds += num * 1000;
        }
    }

    return totalMilliseconds;
}

// Finalize analysis
(() => {
    analysis.filament.kilograms = analysis.filament.grams / 1000;

    const normalDuration = moment.duration(analysis.time.normalMode.milliseconds);
    const silentDuration = moment.duration(analysis.time.silentMode.milliseconds);

    analysis.time.normalMode = {
        days: normalDuration.days(),
        hours: normalDuration.hours(),
        minutes: normalDuration.minutes(),
        seconds: normalDuration.seconds()
    };

    analysis.time.silentMode = {
        days: silentDuration.days(),
        hours: silentDuration.hours(),
        minutes: silentDuration.minutes(),
        seconds: silentDuration.seconds()
    };
})();

// Output results
console.log(`Analysis completed`, JSON.stringify(analysis, null, 4));