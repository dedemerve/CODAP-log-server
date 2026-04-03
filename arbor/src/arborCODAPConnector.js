/**
 * Created by tim on 1/7/16.
 */

/**
 * A  manager class responsible for communicating with the CODAP environment
 * @constructor
 */
arbor.codapConnector = {
    gameCaseID: 0,
    gameNumber: 0,

    /**
     * Does the named dataset already exist?
     * @param iName
     * @returns {Promise<void>}
     */
    datasetExists: async function (iName) {
        let out = false;

        const existMessage = {
            action: "get",
            resource: `dataContextList`,
        }
        const tListResult = await codapInterface.sendRequest(existMessage);
        if (tListResult.success) {
            tListResult.values.forEach((ds) => {
                if (ds.name === iName) {
                    out = true;
                }
            })
        }
        return out;
    },

    /**
     * Emit a "tree" case.
     * @param iValues   the case values
     */
    createClassificationTreeItem: function (iValues) {
        pluginHelper.createItems(
            iValues,
            arbor.constants.kClassTreeDataSetName,
        ); // no callback.
        codapInterface.sendRequest({
            "action": "create",
            "resource": "component",
            "values": {
                "type": "caseTable",
                "dataContext": arbor.constants.kClassTreeDataSetName,
            }
        })
    },

    createRegressionTreeItem : function(iValues ) {
        pluginHelper.createItems(
            iValues,
            arbor.constants.kRegressTreeDataSetName,
        );
        codapInterface.sendRequest({
            "action": "create",
            "resource": "component",
            "values": {
                "type": "caseTable",
                "dataContext": arbor.constants.kRegressTreeDataSetName,
            }
        })

    },

    /**
     * Object needed by codapHelper to initialize a dataset
     * @type {{name: string, title: string, description: string, collections: [null]}}
     */
    getClassificationTreesDatasetSetupObject : function() {
        return {
            name: arbor.constants.kClassTreeDataSetName,
            title : localize.getString("sClassTreeDataSetTitle"),
            description : localize.getString("sClassTreeDataSetDescription"),
            collections: [  // first, simple: one collection
                {
                    name: localize.getString("sClassTreeCollectionName"),
                    labels: {
                        singleCase: "tree",
                        pluralCase: "trees",
                        setOfCasesWithArticle: "our trees"
                    },
                    // The (child) collection specification:
                    attrs: [
                        {   //  what we are predicting, e.g., MI = yes
                            name : localize.getString("attributeNames.sanPredict"),
                            title: localize.getString("attributeNames.sanPredict"),
                            type: 'categorical',
                            description: localize.getString("attributeDescriptions.sadPredict")
                        },
                        {   //  name of the focus attribute
                            name : localize.getString("staticStrings.focusAttributeNameBoxLabel"),
                            title: localize.getString("staticStrings.focusAttributeNameBoxLabel"),
                            type: 'categorical',
                            description : localize.getString("attributeDescriptions.sadFocusAttributeName")
                        },
                        {   //  value of the focus attribute
                            name : localize.getString("staticStrings.focusAttributeValueBoxLabel"),
                            title: localize.getString("staticStrings.focusAttributeValueBoxLabel"),
                            type: 'numeric',
                            description : localize.getString("attributeDescriptions.sadFocusAttributeValue")
                        },

                        //  misclassification rate; note that this has a formula
                        {
                            name : localize.getString("attributeNames.sanMisclassificationRate"),
                            title: localize.getString("attributeNames.sanMisclassificationRate"),
                            type: 'numeric', precision: 3, editable : true,
                            description : localize.getString("attributeDescriptions.sadMisclassificationRate"),
                            formula : `(${localize.getString("attributeNames.sanN")} - ${localize.getString("attributeNames.sanTP")} - ${localize.getString("attributeNames.sanTN")})/${localize.getString("attributeNames.sanN")}`
                        },
                        //  sensitivity
                        {
                            name : localize.getString("attributeNames.sanSensitivity"),
                            title: localize.getString("attributeNames.sanSensitivity"),
                            type: 'numeric', precision: 3, editable : true,
                            description : localize.getString("attributeDescriptions.sadSensitivity"),
                            formula : ` ${localize.getString("attributeNames.sanTP")}/( ${localize.getString("attributeNames.sanTP")} +  ${localize.getString("attributeNames.sanFN")} +  ${localize.getString("attributeNames.sanNPPos")})`
                        },

                        //  the four base stats!
                        {
                            name : localize.getString("attributeNames.sanTP"),
                            title: localize.getString("attributeNames.sanTP"), type: 'numeric', precision: 0,
                            description : localize.getString("attributeDescriptions.sadTP")
                        },
                        {
                            name : localize.getString("attributeNames.sanFN"),
                            title: localize.getString("attributeNames.sanFN"), type: 'numeric', precision: 0,
                            description : localize.getString("attributeDescriptions.sadFN")
                        },
                        {
                            name : localize.getString("attributeNames.sanFP"),
                            title: localize.getString("attributeNames.sanFP"), type: 'numeric', precision: 0,
                            description : localize.getString("attributeDescriptions.sadFP")
                        },
                        {
                            name : localize.getString("attributeNames.sanTN"),
                            title: localize.getString("attributeNames.sanTN"), type: 'numeric', precision: 0,
                            description : localize.getString("attributeDescriptions.sadTN")
                        },

                        //  two extras for no prediction

                        {
                            name : localize.getString("attributeNames.sanNPPos"),
                            title: localize.getString("attributeNames.sanNPPos"), type: 'numeric', precision: 0,
                            description : localize.getString("attributeDescriptions.sadNPPos")
                        },
                        {
                            name : localize.getString("attributeNames.sanNPNeg"),
                            title: localize.getString("attributeNames.sanNPNeg"), type: 'numeric', precision: 0,
                            description : localize.getString("attributeDescriptions.sadNPNeg")
                        },

                        //  N, the number of cases

                        {
                            name : localize.getString("attributeNames.sanN"),
                            title: localize.getString("attributeNames.sanN"), type: 'numeric', precision : 0,
                            description : localize.getString("attributeDescriptions.sadN")
                        },
                        {
                            name : localize.getString("attributeNames.sanBaseRate"),
                            title: localize.getString("attributeNames.sanBaseRate"), type: 'numeric', precision: 3,
                            description : localize.getString("attributeDescriptions.sadBaseRate")
                        },


                        //  number of nodes
                        {
                            name : localize.getString("attributeNames.sanNodes"),
                            title: localize.getString("attributeNames.sanNodes"), type: 'numeric', precision : 0,
                            description : localize.getString("attributeDescriptions.sadNodes")
                        },

                        //  depth of the tree
                        {
                            name : localize.getString("attributeNames.sanDepth"),
                            title: localize.getString("attributeNames.sanDepth"), type: 'numeric', precision : 0,
                            description : localize.getString("attributeDescriptions.sadDepth")
                        },

                        //  hidden the tree state! This is what lets the plugin reconstitute the tree on selection
                        {
                            name : `state`, title: "state", type: 'categorical', description: "save state for this tree", editable : true, hidden: true}
                    ]
                }
            ]   //  end of collections

        }
    },

    regressionTreesDatasetSetupObject : function() {
        return {
            name: arbor.constants.kRegressTreeDataSetName,
            title: localize.getString("sRegressTreeDataSetTitle"),
            description : localize.getString("sRegressTreeDataSetDescription"),
            collections: [
                {
                    name: localize.getString("sRegressTreeCollectionName"),
                    labels: {
                        singleCase: "tree",
                        pluralCase: "trees",
                        setOfCasesWithArticle: "our trees"
                    },

                    attrs: [
                        {
                            name : localize.getString("attributeNames.sanPredict"),
                            title: localize.getString("attributeNames.sanPredict"), type: 'categorical',
                            description: localize.getString("attributeDescriptions.sadPredict")
                        },
                        {
                            name : localize.getString("attributeNames.sanSSModel"),
                            title: localize.getString("attributeNames.sanSSModel"), type: 'numeric', precision: 3,
                            description : localize.getString("attributeDescriptions.sadSSModel")
                        },
                        {
                            name : localize.getString("attributeNames.sanSSTotal"),
                            title: localize.getString("attributeNames.sanSSTotal"), type: 'numeric', precision: 3,
                            description : localize.getString("attributeDescriptions.sadSSTotal")
                        },
                        {
                            name : localize.getString("attributeNames.sanExplained"),
                            title: localize.getString("attributeNames.sanExplained"), type: 'numeric', precision: 3,
                            description : localize.getString("attributeDescriptions.sadExplained")
                        },
/*
                        {
                            name : localize.getString("attributeNames.sanSumSSD"),
                            title: localize.getString("attributeNames.sanSumSSD"), type: 'numeric', precision: 3,
                            description : localize.getString("attributeDescriptions.sadSumSSD")
                        },
*/
                        {
                            name : localize.getString("attributeNames.sanN"),
                            title: localize.getString("attributeNames.sanN"), type: 'numeric', precision : 0,
                            description : localize.getString("attributeDescriptions.sadN")
                        },
                        {
                            name : localize.getString("attributeNames.sanNodes"),
                            title: localize.getString("attributeNames.sanNodes"), type: 'numeric', precision : 0,
                            description : localize.getString("attributeDescriptions.sadNodes")
                        },
                        {
                            name: localize.getString("attributeNames.sanDepth"),
                            title: localize.getString("attributeNames.sanDepth"), type: 'numeric', precision: 0,
                            description: localize.getString("attributeDescriptions.sadDepth")
                        },

                        {
                            name : `state`, title: "state", type: 'categorical', description: "save state for this tree", editable : true, hidden: true
                        }
                    ]
                }
            ]   //  end of collections
        }
    },
};


