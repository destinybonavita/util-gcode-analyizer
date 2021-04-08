//#region Imports

const moment = require("moment");
const fs = require("fs");

//#endregion

//#region Properties

const fileNames = fs.readdirSync("src/data");

//#endregion

//#region Constants

const ESTIMATED_PRINT_TIME_REGEX = /\; estimated printing time \([a-zA-Z\s]+\) \= ([0-9]+(d|h|m|s)\s)+/g;
const FILAMENT_USAGE_REGEX = /\; total filament used \[g\] \= [0-9]+(\.[0-9]+)?/g;

//#endregion

let analysis = {
    overall: {
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
    },
    raw: {}
};

// Iterate through the file names
for (const fileName of fileNames) {
    // Read contents of gcode file
    const gcode = fs.readFileSync(`src/data/${fileName}`).toString();

    // Analyze the individual file
    const { filamentUsage, timeEstimates } = analyzeFile(gcode);

    // Store the file analysis
    analysis.raw[fileName] = {
        filament: {
            grams: filamentUsage
        },
        time: {
            normalMode: { milliseconds: timeEstimates.normalMilliseconds },
            silentMode: { milliseconds: timeEstimates.silentMilliseconds }
        }
    };

    // Update the overall analysis
    analysis.overall.filament.grams += filamentUsage;
    analysis.overall.time.normalMode.milliseconds += timeEstimates.normalMilliseconds;
    analysis.overall.time.silentMode.milliseconds += timeEstimates.silentMilliseconds;

    // // Execute calculations
    // analysis.filament.grams += extractFilamentUsage(gcode);
    // extractTimeEstimate(gcode);
}

function analyzeFile(gcode) {
    const filamentUsage = extractFilamentUsage(gcode);
    const timeEstimates = extractTimeEstimate(gcode);

    return {
        filamentUsage,
        timeEstimates
    };
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
    let normalMilliseconds = 0, silentMilliseconds = 0;

    if (matches.length) {
        for (const match of matches) {
            const timeEstimate = match.split(/=/g)[1].trim();
            const totalMilliseconds = timeToMilliseconds(timeEstimate);

            if (match.indexOf("normal") >= 0) {
                normalMilliseconds += totalMilliseconds;
            } else {
                silentMilliseconds += totalMilliseconds;
            }
        }
    }

    return {
        normalMilliseconds, silentMilliseconds
    };
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

/**
 * @param {number} milliseconds 
 */
function durationFromMilliseconds(milliseconds) {
    const duration = moment.duration(milliseconds);

    return {
        days: duration.days(),
        hours: duration.hours(),
        minutes: duration.minutes(),
        seconds: duration.seconds()
    };
}

// Finalize analysis
(() => {
    // Handle overall finalization 
    analysis.overall.filament.kilograms = analysis.overall.filament.grams / 1000;
    analysis.overall.time.normalMode = durationFromMilliseconds(analysis.overall.time.normalMode.milliseconds);
    analysis.overall.time.silentMode = durationFromMilliseconds(analysis.overall.time.silentMode.milliseconds);

    // Handle individual finalization
    for (let fileName of Object.keys(analysis.raw)) {
        analysis.raw[fileName].filament.kilograms = analysis.raw[fileName].filament.grams / 1000;
        analysis.raw[fileName].time.normalMode = durationFromMilliseconds(analysis.raw[fileName].time.normalMode.milliseconds);
        analysis.raw[fileName].time.silentMode = durationFromMilliseconds(analysis.raw[fileName].time.silentMode.milliseconds);
    }
})();

// Output results
console.log(`Analysis completed`, JSON.stringify(analysis, null, 4));