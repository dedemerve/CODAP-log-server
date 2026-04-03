/**
 * Singleton to draw a doubleTree using D3
 *
 * The doubleTree has 10 boxes in it (1-2-4-2-1).
 * the net diagram has three rows (3-3-3) where the central item is really two
 *
 * #theDoubleTree is an svg in the DOM (in index.html). It's the "paper" for the view
 *
 * @type {{}}
 */
const doubleTree = {
    width: 400,
    height: 310,
    boxWidth: 80,
    boxHeight: 40,
    tagSizeY: 16,
    tagSizeX: 24,
    tagPositionRatio: 0.5,

    transitionDuration: 1000,

    mostRecentResultCounts : null,

    /**
     * The various "modes" of this kind of diagram. We animate between them.
     */
    modes: ["doubleTreePred", "networkPred", "confusion2"],

    //  these are localize keys for the labels corresponding to each mode (see `doubleTree.modes`)
    diagramLabelKeys: {
        doubleTreePred: "doubleTreeLabels.doubleTreeDiagramLabel",
        networkPred: "doubleTreeLabels.netDiagramLabel",
        confusion2: "doubleTreeLabels.confusion2Label"
    },

    paper: null,        //  the paper on which the doubleTree gets drawn

    /**
     * The roles of the various boxes in these diagrams.
     */
    roles: [
        "DTotal",           //  total diagnoses
        "DP", "DN",         //  diagnosed positive, diagnosed negative
        "TP", "FP", "FN", "TN",
        "AP", "AN",         //  actually positive, actually negative
        "ATotal"            //  total actually known, = total diagnoses. This is N :)
    ],

    /**
     * Set up the display space
     */
    initialize: function () {
        this.paper = d3.select("#theDoubleTree")
            .attr("width", this.width)
            .attr("height", this.height);

        this.updateLayout()
    },

    updateLayout: function () {
        this.updateConnectingLines();
        this.updateBoxLayout();
        this.updateLineTagLayout();
        this.fillControlStrip();    //  display the control strip at the bottom of the tree display
    },

    updateDataInDisplay: function (iRes) {
        counts = iRes || this.mostRecentResultCounts;
        if (counts) {
            this.mostRecentResultCounts = counts;     //  remember these for when we don't want to find them!
            const theBoxDataObject = this.updateBoxData(counts);
            this.updateLineTagData(theBoxDataObject);
        }
    },


    /**
     * called on initialize or change of mode, this positions the "boxes" in a net
     * or double tree diagram.
     * In the D3-svg, this creates the groups (class .box),
     * translates them to their locations,
     * and installs the background rects (.dtBGBox)
     */
    updateBoxLayout: function () {
        console.log("updating double tree positions");
        const loco = this.makeBoxLocationArray();

        const boxes = doubleTree.paper.selectAll(".box")
            .data(loco, (d) => d.role)
            .join("g")      //  create a <g> if it doesn't exist
            .attr("class", "box")

        boxes.transition()
            .duration(doubleTree.transitionDuration)
            .attr("transform", (d) => `translate(${d.x}, ${d.y})`)

        /*
        We are in the <g> environment, so the <rect> has x = 0 and y = 0 by default.
         */
        boxes.selectAll(".dtBGBox")
            .data(d => [d])
            .join("rect")
            .attr("width", (d) => d.width)
            .attr("height", (d) => d.height)
            .attr("fill", d => d.boxFillColor)
            .attr("class", "dtBGBox")

    },

    /**
     * Updates the lines connecting the boxes
     * @param boxes
     */
    updateConnectingLines: function ( ) {

        const theDashVis = (arbor.state.doubleTreeMode === "networkPred" ? "visible" : "hidden");
        console.log(`updating lines; dashed lines will be ${theDashVis}`);

        const locs = doubleTree.boxLocations[arbor.state.doubleTreeMode];

        const lines = doubleTree.paper.selectAll(".connectingLine")
            .data(doubleTree.theLines)
            .join("line")
            .attr("class", "connectingLine")
            .transition()
            .duration(doubleTree.transitionDuration)
            .attr("x1", L => locs[L.from].x)
            .attr("x2", L => locs[L.to].x)
            .attr("y1", L => locs[L.from].y)
            .attr("y2", L => locs[L.to].y)
            .attr("stroke", "green");

        const theDashedLines = doubleTree.paper.selectAll(".dashedLine")
            .data(doubleTree.theDashedLines)
            .join("line")
            .attr("class", "dashedLine")
            .attr("visibility", theDashVis)
            .transition()
            .duration(doubleTree.transitionDuration)
            .attr("x1", L => locs[L.from].x)
            .attr("x2", L => locs[L.to].x)
            .attr("y1", L => locs[L.from].y)
            .attr("y2", L => locs[L.to].y)
            .attr("stroke", "red")


    },

    /**
     * Updates the contents (data) in the boxes.
     * This occurs whenever the underlying data changes or when the mode changes.
     *
     * * `.dtValue` is the count of cases that live in the box
     * * `.dtLabel` is the label for the box (e.g., `TP`, `survived = 0`)
     *
     * @param iResultCounts results for the current tree, e.g., N, TP, FN, etc
     */
    updateBoxData: function (iResultCounts) {
        if (!iResultCounts) return;

        if (!doubleTree.paper) {
            this.initialize();
        }
        const theBoxDataObject = this.makeBoxDataObject(iResultCounts);     //  keyed by role, not an array!
        const theBoxDataArray = doubleTree.makeBoxDataArray(theBoxDataObject);

        console.log("updating double tree data", theBoxDataArray);

        const boxes = doubleTree.paper.selectAll(".box")
            .data(theBoxDataArray, (d) => d.role)

        boxes.selectAll(".dtValue")                 //  each box, right?
            .data(d => [d])         //  pass through the data for this box, into an array with one element
            .join("text")   //  create a text if it doesn't exist
            .attr("x", doubleTree.boxWidth / 2)
            .attr("y", doubleTree.boxHeight - 6)
            .attr("width", doubleTree.boxWidth)
            .attr("class", "dtValue")
            .text(d => d.value)
            .attr("fill", d => d.fill)

        boxes.selectAll(".dtLabel")
            .data(d => [d])         //  pass through the data for this box, into an array with one element
            .text(d => d.label)
            .join("text")
            .attr("x", doubleTree.boxWidth / 2)
            .attr("y", 14)
            .attr("class", "dtLabel")
            .text(d => d.label)
            .attr("fill", d => d.fill)

        //  set tooltips for the boxes
        boxes.selectAll(".dtBoxTitle")
            .data(d => [d])
            .join("title")  //  creates the <title> tags
            .attr("class", "dtBoxTitle")
            .text(d => d.tip)      //  stuff the text in!

        return theBoxDataObject;
    },

    /**
     * Creates the group for a "line tag," which displays percentages on the lines.
     * This consists of:
     *
     * * the group itself (`.lineTag`)
     * * a shape for the background (starting as a circle) (`.tagBGCircle`)
     * * text with the percentage (`.tagText`)
     *
     */
    updateLineTagLayout: function () {
        const theTagData = this.makeLineTagLayoutArray();

        const tags = doubleTree.paper.selectAll(".lineTag")
            .data(theTagData, (d) => d.id)
            .join("g")      //  create a <g> if it doesn't exist
            .attr("class", "lineTag")

        tags.transition()
            .duration(doubleTree.transitionDuration)
            .attr("transform", (d) => `translate(${d.x}, ${d.y})`)

        tags.selectAll(".tagBGCircle")
            .data(d => [d])
            .join("ellipse")
            .attr("rx", doubleTree.tagSizeX / 2)
            .attr("ry", doubleTree.tagSizeY / 2)
            .attr("fill", d => "white")
            .attr("class", "tagBGCircle")
    },

    makeLineTagLayoutArray: function () {
        const locs = doubleTree.boxLocations[arbor.state.doubleTreeMode];
        let out = [];
        const maxdx = doubleTree.boxWidth / 2 + doubleTree.tagSizeX / 2;
        const maxdy = doubleTree.boxHeight / 2 + doubleTree.tagSizeY / 2;
        const yOverlap = 2;     //  points
        const xOverlap = 3;     //  points

        //  make an array that has all lines, both solid and dashed
        const allLines = [...doubleTree.theLines, ...doubleTree.theDashedLines];

        allLines.forEach(L => {
            const from = locs[L.from];
            const to = locs[L.to];
            //  let dx = to.x - from.x;

            let xx = (to.x * (this.tagPositionRatio) + from.x * (1 - this.tagPositionRatio));
            let yy = (to.y * (this.tagPositionRatio) + from.y * (1 - this.tagPositionRatio));

            if (arbor.state.doubleTreeMode === "doubleTreePred") {
                //  constrain y position to touch the box (with a small overlap)
                //  let dy = yy - from.y;
                const yymin = from.y - maxdy + yOverlap;
                const yymax = from.y + maxdy - yOverlap;
                if (yy < yymin) yy = yymin;
                if (yy > yymax) yy = yymax;
                const xxmin = from.x - maxdx + xOverlap;
                const xxmax = from.x + maxdx - xOverlap;
                if (xx < xxmin) xx = xxmin;
                if (xx > xxmax) xx = xxmax;
            }

            let entry = {
                id: L.id, x: xx, y: yy,
                dashed : L.dashed,
                pct: "-?-"
            }
            out.push(entry);
        })
        return out;
    },

    setLineTagVisibility: function (d) {
        const theVis = document.getElementById("lineTagVisibilityToggle").checked;
        if (!theVis) return "hidden";

        switch (arbor.state.doubleTreeMode) {
            case  "confusion2":
                return "hidden";
                break;

            case "doubleTreePred":
                if (d.dashed) return "hidden";
                break;
        }

        return ((d.pct.length) ? "visible" : "hidden");
    },

    updateLineTagData: function (iBoxData) {
        const theTagData = this.makeLineTagDataArray(iBoxData);

        const tags = doubleTree.paper.selectAll(".lineTag")
            .data(theTagData, (d) => d.id)
            .attr("visibility", (d) => doubleTree.setLineTagVisibility(d))

        tags.selectAll(".tagText")
            .data(d => [d])
            .join("text")
            .attr("x", 0)   //       (d) => d.x)
            .attr("y", 4)   //  -doubleTree.tagSizeY / 2)
            .attr("width", doubleTree.tagSizeX)
            .text(d => d.pct)
            .attr("class", "tagText")
    },

    /**
     * construct an array of objects that have the relevant data for line tags.
     * This will include visibility!
     *
     * @param iBoxData
     * @returns {*[]}
     */
    makeLineTagDataArray: function (iBoxData) {

        const allLines = [...this.theLines, ...this.theDashedLines];
        let out = [];

        allLines.forEach(L => {
            const from = iBoxData[L.from];  //  the count in the from cell
            const to = iBoxData[L.to];      //  the count in the to cell

            let pct = "";
            if (from) pct = Math.round(to / from * 100) + "%";

            let entry = {
                id: L.id, pct: pct, dashed : L.dashed,
                visibility: function(d) {doubleTree.setLineTagVisibility(d)}
            };

            out.push(entry);
        })

        // doubleTree.theDashedLines.forEach(L => {
        //     const from = iBoxData[L.from];  //  the count in the from cell
        //     const to = iBoxData[L.to];      //  the count in the to cell
        //
        //     let pct = "";
        //     if (from) pct = Math.round(to / from * 100) + "%";
        //
        //     let entry = {id: L.id, pct: pct, dashed : L.dashed};
        //
        //     out.push(entry);
        // })

        return out;
    },


    makeBoxDataObject: function (d) {

        if (!d) {
            //  make error message visible
            return {};
        }

        return {
            DTotal: d.TP + d.FN + d.FP + d.TN,
            DP: d.TP + d.FP,
            DN: d.TN + d.FN,
            TP: d.TP,
            FP: d.FP,
            FN: d.FN,
            TN: d.TN,
            AP: d.TP + d.FN + d.PU,
            AN: d.TN + d.FP + d.NU,
            ATotal: (d.TP + d.FN + d.FP + d.TN + d.NU + d.PU),
            NU: d.NU,
            PU: d.PU
        }
    },

    /**
     * Convert the data from the tree (resultCounts) into an array we can bind using D3.
     * Called from `updateBoxData()`.
     *
     * @param d     the result counts
     * @returns {[{role: string, tip: (string|*), label: string, value: *},{role: string, tip: (string|*), label: string, value: *},{role: string, tip: (string|*), label: string, value: *},{role: string, tip: (string|*), label: string, value},{role: string, tip: (string|*), label: string, value},null,null,null,null,null]|*[]}
     */
    makeBoxDataArray: function (d) {

        let out = [];

        doubleTree.roles.forEach(role => {
            const oneObject = {
                role: role,
                value: d[role],
                label: doubleTree.constructBoxLabel(role),
                tip: doubleTree.getTip(role, d),
                fill : doubleTree.boxColors[role].stroke,       //  fill of the text...
            }
            out.push(oneObject);
        })

        return out;

    },

    /**
     * Depending on `state.doubleTreeMode`, creates an array of box locations
     * we can bind in D3.
     *
     * @returns {[{role: string, x: number, width: number, y: number, height: number, boxFillColor: string},{role: string, x: number, width: number, y: number, height: number, boxFillColor: string},{role: string, x: number, width: number, y: number, height: number, boxFillColor: string},{role: string, x: number, width: number, y: number, height: number, boxFillColor: string},{role: string, x: number, width: number, y: number, height: number, boxFillColor: string},null,null,null,null,null]}
     */
    makeBoxLocationArray: function () {

        const locs = doubleTree.boxLocations[arbor.state.doubleTreeMode];

        const w = doubleTree.boxWidth;
        const h = doubleTree.boxHeight;

        let out = [];

        doubleTree.roles.forEach(R => {
            const oneObject = {
                role: R, x: locs[R].x - w / 2, y: locs[R].y - h / 2,
                width: w, height: h,
                boxFillColor: doubleTree.boxColors[R].fill
            }
            out.push(oneObject);
        })

        return out;
    },

    constructBoxLabel: function (role) {
        let out = "wrong label";

        switch (role) {
            case "AP":
                out = arbor.state.dependentVariableSplit ?
                    arbor.state.dependentVariableSplit.branchDescription("L") :
                    localize.getString(`doubleTreeLabels.${role}`);
                break;
            case "AN":
                out = arbor.state.dependentVariableSplit ?
                    arbor.state.dependentVariableSplit.branchDescription("R") :
                    localize.getString(`doubleTreeLabels.${role}`);
                break;
            default:
                out = localize.getString(`doubleTreeLabels.${role}`);
                break;
        }

        return out;
    },

    pct: function (iNum, iDen) {
        let out = "-";
        let val = 0;
        let divisor = 1;
        if (iDen) {
            val = 100 * iNum / iDen;
            if (val < 10) {
                val *= 10;
                divisor *= 10;
            }
            if (val < 10) {
                val *= 10;
                divisor *= 10;
            }
            out = Math.round(val) / divisor;
        }
        return out;
    },

    /**
     * Creates the (elaborate) tool tip for a box.
     *
     * @param role  Box role, e.g., `TP`, `ATotal`.
     * @param d     the data object (`resultCounts` from the tree containing data)
     * @returns {string}
     */
    getTip: function (role, d) {
        let out;
        if (arbor.state.dependentVariableSplit) {
            const depAttName = arbor.state.dependentVariableSplit.attName;
            const N = d.TP + d.FN + d.FP + d.TN + d.PU + d.NU;
            const DTotal = d.TP + d.FN + d.FP + d.TN;
            switch (role) {

                case "DP":      //  diagnosed positive
                    out = DTotal ?
                        localize.getString("doubleTreeTips.DP",
                            depAttName, arbor.state.dependentVariableSplit.leftLabel) + "\n" +
                        localize.getString("doubleTreeTipsPart2.DP",
                            this.pct(d.TP + d.FP, DTotal)
                        ) :
                        localize.getString("doubleTreeTips.noPredictions");
                    break;
                case "DN":      //  diagnosed negative
                    out = DTotal ?
                        localize.getString("doubleTreeTips.DN",
                            depAttName, arbor.state.dependentVariableSplit.rightLabel) + "\n" +
                        localize.getString("doubleTreeTipsPart2.DN",
                            this.pct(d.TN + d.FN, DTotal)) :
                        localize.getString("doubleTreeTips.noPredictions");
                    break;

                case "AP":      //  actual positives
                    out = N ?
                        localize.getString("doubleTreeTips.AP",
                            depAttName, arbor.state.dependentVariableSplit.leftLabel) + "\n" +
                        localize.getString("doubleTreeTipsPart2.AP",
                            this.pct(d.TP + d.FN + d.PU, N)) :
                        localize.getString("doubleTreeTips.noCases");
                    break;
                case "AN":      //  actual negatives
                    out = N ?
                        localize.getString("doubleTreeTips.AN",
                            depAttName, arbor.state.dependentVariableSplit.rightLabel) + "\n" +
                        localize.getString("doubleTreeTipsPart2.AN",
                            this.pct((d.TN + d.FP + d.NU), N)) :
                        localize.getString("doubleTreeTips.noCases");
                    break;
                case "ATotal":
                    out = localize.getString("doubleTreeTips.ATotal", N, depAttName);
                    break;
                case "DTotal":
                    out = localize.getString("doubleTreeTips.DTotal", DTotal);
                    break;

                case "TP":
                    out = localize.getString(
                            (d.TP === 1) ? "doubleTreeTips.TP1" : "doubleTreeTips.TP",
                            arbor.state.dependentVariableSplit.branchDescription("L"), d.TP
                        ) + "\n" +
                        localize.getString(
                            (d.TP === 1) ? "doubleTreeTipsPart2.TP1" : "doubleTreeTipsPart2.TP",
                            this.pct(d.TP, N), this.pct(d.TP, d.TP + d.FP), this.pct(d.TP, d.TP + d.FN),
                            arbor.state.dependentVariableSplit.branchDescription("L")
                        );
                    break;
                case "FP":
                    out = localize.getString(
                            (d.FP === 1) ? "doubleTreeTips.FP1" : "doubleTreeTips.FP",
                            arbor.state.dependentVariableSplit.branchDescription("L"), d.FP,
                            arbor.state.dependentVariableSplit.branchDescription("R")
                        ) + "\n" +
                        localize.getString(
                            (d.FP === 1) ? "doubleTreeTipsPart2.FP1" : "doubleTreeTipsPart2.FP",
                            this.pct(d.FP, N), this.pct(d.FP, d.TP + d.FP), this.pct(d.FP, d.FP + d.TN),
                            arbor.state.dependentVariableSplit.branchDescription("R")
                        );
                    break;
                case "FN":
                    out = localize.getString(
                            (d.FN === 1) ? "doubleTreeTips.FN1" : "doubleTreeTips.FN",
                            arbor.state.dependentVariableSplit.branchDescription("R"), d.FN,
                            arbor.state.dependentVariableSplit.branchDescription("L")
                        ) + "\n" +
                        localize.getString(
                            (d.FN === 1) ? "doubleTreeTipsPart2.FN1" : "doubleTreeTipsPart2.FN",
                            this.pct(d.FN, N), this.pct(d.FN, d.TN + d.FN), this.pct(d.FN, d.TP + d.FN),
                            arbor.state.dependentVariableSplit.branchDescription("L")
                        );
                    break;
                case "TN":
                    out = localize.getString(
                            (d.TN === 1) ? "doubleTreeTips.TN1" : "doubleTreeTips.TN",
                            arbor.state.dependentVariableSplit.branchDescription("R"), d.TN
                        ) + "\n" +
                        localize.getString(
                            (d.TN === 1) ? "doubleTreeTipsPart2.TN1" : "doubleTreeTipsPart2.TN",
                            this.pct(d.TP, N), this.pct(d.TN, d.TN + d.FN), this.pct(d.TN, d.FP + d.TN),
                            arbor.state.dependentVariableSplit.branchDescription("R")
                        );
                    break;
            }
        } else {
            //  no dependent variable split
            out = localize.getString("doubleTreeTips.noCases");
        }
        return out;
    },

    /**
     * Update the strings and UI for the strip at the bottom of the display
     */
    fillControlStrip: function () {
        const theKey = doubleTree.diagramLabelKeys[arbor.state.doubleTreeMode];
        const theTitle = localize.getString(theKey);
        document.getElementById("netDiagramLabel").innerHTML = theTitle;
    },

    /**
     * User has pressed a control to change the mode of the display
     */
    changeMode: function () {
        const tRes = arbor.state.tree.rootNode.getResultCounts();

        arbor.state.doubleTreeModeIndex++;

        if (arbor.state.doubleTreeModeIndex >= doubleTree.modes.length) {
            arbor.state.doubleTreeModeIndex = 0;
        }
        arbor.state.doubleTreeMode = doubleTree.modes[arbor.state.doubleTreeModeIndex];

        this.updateLayout();
        this.updateDataInDisplay(tRes);      //  different modes have different visibility situations
    },

    /**
     * User has clicked the line tag visibility checkbox.
     * This should trigger a refresh
     */
    changeLineTagVisibility: function () {

        const theVis = document.getElementById("lineTagVisibilityToggle").checked;
        this.updateDataInDisplay();
        /*
        const tags = doubleTree.paper.selectAll(".lineTag")    //  select all the tag groups
            .attr("visibility", theVis ? "visible" : "hidden");

         */
    },

    boxColors  : {
        DTotal: { fill : "#666", stroke : "#ddd"},
        DP: { fill : "#cca", stroke : "#333"},
        DN: { fill : "#cca", stroke : "#333"},
        TP: { fill : "#cec", stroke : "#333"},
        FP: { fill : "#ecc", stroke : "#333"},
        FN: { fill : "#ecc", stroke : "#333"},
        TN: { fill : "#cec", stroke : "#333"},
        AP: { fill : "#cac", stroke : "#333"},
        AN: { fill : "#cac", stroke : "#333"},
        ATotal: { fill : "#666", stroke : "#ddd"}
    },

    /**
     * Information on box locations and other information that defind the
     * various modes.
     * Keyed by the name of the mode.
     */
    boxLocations: {
        doubleTreePred: {
            DTotal: {x: 200, y: 35},
            DP: {x: 100, y: 95},
            DN: {x: 300, y: 95},
            TP: {x: 50, y: 155},
            FP: {x: 150, y: 155},
            FN: {x: 250, y: 155},
            TN: {x: 350, y: 155},
            AP: {x: 140, y: 215},
            AN: {x: 260, y: 215},
            ATotal: {x: 200, y: 275},
        },
        networkPred: {
            DTotal: {x: 200, y: 155},
            DP: {x: 200, y: 55},
            DN: {x: 200, y: 255},
            TP: {x: 80, y: 55},
            FP: {x: 320, y: 55},
            FN: {x: 80, y: 255},
            TN: {x: 320, y: 255},
            AP: {x: 80, y: 155},
            AN: {x: 320, y: 155},
            ATotal: {x: 200, y: 155},
        },
        confusion2: {
            DTotal: {x: 290, y: 155},
            DP: {x: 290, y: 115},
            DN: {x: 290, y: 155},
            TP: {x: 120, y: 115},
            FP: {x: 200, y: 115},
            FN: {x: 120, y: 155},
            TN: {x: 200, y: 155},
            AP: {x: 120, y: 215},
            AN: {x: 200, y: 215},
            ATotal: {x: 290, y: 215},
        }
    },

    theLines: [
        {id: "DTotal-DP", from: "DTotal", to: "DP", dashed : false},
        {id: "DTotal-DN", from: "DTotal", to: "DN", dashed : false},
        {id: "DP-TP", from: "DP", to: "TP", dashed : false},
        {id: "DP-FP", from: "DP", to: "FP", dashed : false},
        {id: "DN-FN", from: "DN", to: "FN", dashed : false},
        {id: "DN-TN", from: "DN", to: "TN", dashed : false},
        {id: "AP-TP", from: "AP", to: "TP", dashed : false},
        {id: "AP-FN", from: "AP", to: "FN", dashed : false},
        {id: "AN-FP", from: "AN", to: "FP", dashed : false},
        {id: "AN-TN", from: "AN", to: "TN", dashed : false},
        {id: "ATotal-AN", from: "ATotal", to: "AN", dashed : false},
        {id: "ATotal-AP", from: "ATotal", to: "AP", dashed : false}
    ],

    theDashedLines: [
        {id: "ATotal-TP", from: "ATotal", to: "TP", dashed : true},
        {id: "ATotal-FP", from: "ATotal", to: "FP", dashed : true},
        {id: "ATotal-FN", from: "ATotal", to: "FN", dashed : true},
        {id: "ATotal-TN", from: "ATotal", to: "TN", dashed : true}
    ]

}