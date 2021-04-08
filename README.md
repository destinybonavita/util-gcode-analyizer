**NOTE** This has only been tested with PrusaSlicer. Please let me know if there's issues with other slicers!

> How to use
1. Execute `git clone https://github.com/destinybonavita/util-gcode-analyizer` using your favorite terminal
2. Create `Files` directory to cloned location
3. Copy `.gcode` files into that directory
4. Run `npm install` on in the cloned directory
5. Run `node index.js` to get output
> Example Output
```
Analysis completed {
    "filament": {
        "kilograms": 2.26583,
        "grams": 2265.83
    },
    "time": {
        "normalMode": {
            "days": 6,
            "hours": 8,
            "minutes": 24,
            "seconds": 41
        },
        "silentMode": {
            "days": 6,
            "hours": 11,
            "minutes": 28,
            "seconds": 44
        }
    }
}
```
