/*
==========================================================================

 * Created by tim on 2019-08-02.
 
 
 ==========================================================================
arbor-ui in arbor

Author:   Tim Erickson

Copyright (c) 2018 by The Concord Consortium, Inc. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==========================================================================

*/

/**
 * All about the confusion matrix: display the relevant numbers.
 * @type {{updateConfusionMatrix: arbor.ui.updateConfusionMatrix}}
 */
arbor.ui = {

    updateConfusionMatrix: function (tRes, kPositive, kNegative) {
        const confusionCaseCountDisplay = `<span class='confusionHed'> ${arbor.state.dependentVariableName}</span><br> ${tRes.sampleSize} ${localize.getString("cases")}`;

        document.getElementById("tableHead").innerHTML = confusionCaseCountDisplay;

        document.getElementById("truthHead").innerHTML = localize.getString("staticStrings.truthHead");
        document.getElementById("predHead").innerHTML = localize.getString("staticStrings.predHead");

        document.getElementById("truthPositiveHead").innerHTML = `${kPositive} (${tRes.TP + tRes.FN + tRes.PU})`;
        document.getElementById("truthNegativeHead").innerHTML = `${kNegative} (${tRes.FP + tRes.TN + tRes.NU})`;
        document.getElementById("predPositiveHead").innerHTML = `${kPositive} (${tRes.TP + tRes.FP})`;
        document.getElementById("predNegativeHead").innerHTML = `${kNegative} (${tRes.TN + tRes.FN})`;

        document.getElementById("noPredictionTableHead").innerHTML = `${localize.getString("sNoPrediction")} (${tRes.PU + tRes.NU})`;

        document.getElementById("TP").innerHTML = tRes.TP;
        document.getElementById("FP").innerHTML = tRes.FP;
        document.getElementById("TN").innerHTML = tRes.TN;
        document.getElementById("FN").innerHTML = tRes.FN;
        document.getElementById("PU").innerHTML = tRes.PU;
        document.getElementById("NU").innerHTML = tRes.NU;

    },

    updateAlternativeVisualizations: function () {
        const tRes = arbor.state.tree.rootNode.getResultCounts();
        const kPositive = arbor.state.dependentVariableSplit.leftLabel;
        const kNegative = arbor.state.dependentVariableSplit.rightLabel;

        this.updateConfusionMatrix(tRes, kPositive, kNegative);
        mosaic.update(tRes);
        doubleTree.updateDataInDisplay(tRes);
    },

    regressionSummary: function (iData) {
        const sigma = arbor.constants.kSigma;
        const accounted = (100 * (1 - iData.sumOfSquaresOfDeviationsOfLeaves)).toFixed(3);
        const SSModelLabel = localize.getString("attributeNames.sanSSModel");
        const SSTotalLabel = localize.getString("attributeNames.sanSSTotal");

        //  toda: format values using say 3 sigfigs, not fixed!
        let out = `
        <div class = "correct resultsPill noselect">${SSModelLabel} = ${iData.SSModel.newFixed(3)}</div>
        <div class = "correct resultsPill noselect">${SSTotalLabel} = ${iData.SSTotal.newFixed(3)}</div>
        <div class = "correct resultsPill noselect">${localize.getString("sExplainedPercentage", iData.explainedPercentage)}</div>
        `

        out += `
            <div class="filler"></div>
            <img src="art/emit.png" width="24" height="16" 
                    class="imageButton"
                    id="emitDataButton" onclick="arbor.emitTreeData()" 
                    title = "${localize.getString('staticStrings.emitDataButton')}"/>
            `
        return out;

    },

    classificationSummary: function (iRes) {

        const TPlabel = `${localize.getString("attributeNames.sanTP")} = ${iRes.TP}`;
        const TNlabel = `${localize.getString("attributeNames.sanTN")} = ${iRes.TN}`;
        const FPlabel = `${localize.getString("attributeNames.sanFP")} = ${iRes.FP}`;
        const FNlabel = `${localize.getString("attributeNames.sanFN")} = ${iRes.FN}`;

        let out = `
            <div class="correct resultsPill noselect" title="${localize.getString("sTrue")} ${localize.getString("sPositive")}">${TPlabel}</div>
            <div class="correct resultsPill noselect" title="${localize.getString("sTrue")} ${localize.getString("sNegative")}">${TNlabel}</div>
            <div class="incorrect resultsPill noselect" title="${localize.getString("sFalse")} ${localize.getString("sPositive")}">${FPlabel}</div>
            <div class="incorrect resultsPill noselect" title="${localize.getString("sFalse")} ${localize.getString("sNegative")}">${FNlabel}</div>
            
        </div>
            `;

        if (iRes.undiagDenominator) {
            out += `<div class="no-pred resultsPill noselect">
                        ${localize.getString("sNoPrediction")} = ${iRes.PU + iRes.NU}</div>`
        }

        out += `
            <div class="filler"></div>
            <img src="art/emit.png" width="24" height="16" 
                    class="imageButton"
                    id="emitDataButton" onclick="arbor.emitTreeData()" 
                    title = "${localize.getString('staticStrings.emitDataButton')}"/>
            `
        return out;
    },


};