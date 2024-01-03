function convert(products, salesData, categoryData) {
    let uomData = {};
    products.forEach((productsElement) => {
        let key = productsElement[0].trim();
        uomData[key] = {
            stockUnit: productsElement[13].trim(),
            itemWeight: productsElement[14].trim(),
            pricingUnit1: productsElement[27].trim(),
            pricingUnitConvFact: productsElement[26].trim(),
            pricingUnit2: productsElement[28].trim(),
            subUnit1: productsElement[29].trim(),
            subUnit1Coef: productsElement[30].trim(),
            subUnit1Function: productsElement[31].trim(),
            subUnit2: productsElement[32].trim(),
            subUnit2Coef: productsElement[33].trim(),
            subUnit2Function: productsElement[34].trim(),
            catchWeight: productsElement[39].trim(),
            description1: productsElement[1].trim(),
            description2: productsElement[2].trim(),
            unified_description: productsElement[1].trim() +" "+ productsElement[2].trim(),
            major: productsElement[4].trim() == "0" ? "000" : productsElement[4].trim(),
            minor: productsElement[5].trim(),
            status: productsElement[8].trim(),
            sortCategory: productsElement[5].trim() + productsElement[4].trim(),
            weightUnit: "LB",
            volumeUnit: "GAL",
        } // - how to add unit of measure, pricing unit and q-ty shipped from another file (Work_related1.csv)?
    });
    /*uomData["AEB0386"]["stockUnitX3"] = "Test";
    console.log(uomData);
    console.log(uomData["AEB0386"]);
    console.log(uomData["AEB0386"].catchWeight);
    for (const item in uomData) {
        console.log(item);
    }
    */

    for (const item in uomData) {

        uomData[item]["isInteger"] = salesData[item] ? salesData[item].isInteger : undefined;
        uomData[item]["qtyShipped"] = salesData[item] ? [...salesData[item].qtyShipped] : [];

        let unitOfMeasure = [];
        if (salesData[item] != undefined) {
            unitOfMeasure = salesData[item].unitOfMeasure;
        }
        
        uomData[item]["salesUnitX3"] = addE(searchCrossrefReverse(uomData[item]["subUnit1"], uomData[item]["subUnit2"], uomData[item]["stockUnit"], ...unitOfMeasure));

        if (uomData[item]["salesUnitX3"] == uomData[item]["stockUnit"] && uomData[item].isInteger == false) {
            let pattern = "(?<quantity>\\d+)(?<uom>[A-Z]+)\\s*\\/\\s*" + uomData[item]["stockUnit"];
            let re = new RegExp(pattern);
            let match = re.exec(uomData[item].unified_description);
            //console.log(match, re);
            if (match && match.groups && match.groups.quantity) {
                //console.log("from: <", match.input, "> extracted -> <", match.groups.quantity, match.groups.uom,">");
            uomData[item]["salesUnitX3"] = addE(searchCrossref(match.groups.uom));
            uomData[item]["salSTKconv"] = match.groups.quantity;
            uomData[item]["purSTKconv"] = match.groups.quantity;
            }
        }

        if (uomData[item].isInteger == false && uomData[item].stockUnit == "CS") {
            let halfCase = true;
            [...uomData[item].qtyShipped].forEach((q_ty_str) => {
                let q_ty = Number.parseFloat(q_ty_str);
                if (!Number.isInteger(q_ty) && Math.abs(q_ty % 1) !== 0.5) {
                    //console.log(q_ty);
                    halfCase = false;
                }
            });
            if (halfCase && uomData[item]["subUnit2"] == "") {
                //console.log(item);
                uomData[item]["salesUnitX3"] = "HCS";
                uomData[item]["purSTKconv"] = 2;
            }
            //console.log(uomData[item]);
        } 

        uomData[item]["stockUnitX3"] = addE(searchCrossrefReverse(uomData[item]["subUnit1"], uomData[item]["subUnit2"], uomData[item]["stockUnit"], noE(uomData[item]["salesUnitX3"]), ...unitOfMeasure));

            /* - need verification of sales history with decimal q-ty shipped and Unit of measure != LBS, extract additional unit from description1,2 => add this unit if PDX doesn't  have it  */   

        


        /*if (uomData[item]["subUnit1"] == "" && uomData[item]["subUnit2"] == "") {
            uomData[item]["purchaseUnitX3"] = uomData[item].stockUnitX3;
        } else {*/
            
        let purchaseUnitsX3 = searchCrossrefOrigin(uomData[item]["subUnit1"], uomData[item]["subUnit2"], uomData[item]["stockUnit"], ...unitOfMeasure);
        if (uomData[item].catchWeight == "Y") {
            uomData[item]["purchaseUnitX3"] = purchaseUnitsX3[1];
        } else {
            if (purchaseUnitsX3[1] == noE(uomData[item]["salesUnitX3"])) {
                uomData[item]["purchaseUnitX3"] = addE(purchaseUnitsX3[1]);
            } else {
                uomData[item]["purchaseUnitX3"] = purchaseUnitsX3[1];
            }
        }

        uomData[item]["purchaseUnitOrigin"] = purchaseUnitsX3[0];

        if (uomData[item]["purchaseUnitX3"] == uomData[item].stockUnitX3) {
            uomData[item]["purSTKconv"] = "1";
        } else if (noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].subUnit1) && uomData[item].subUnit1Function == "M") {
            uomData[item]["purSTKconv"] = 1 / uomData[item].subUnit1Coef;
        } else if (noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].subUnit1) && uomData[item].subUnit1Function == "D") {
            uomData[item]["purSTKconv"] = uomData[item].subUnit1Coef;  
        } else if (noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].subUnit2) && uomData[item].subUnit2Function == "M") {
            uomData[item]["purSTKconv"] = 1 / uomData[item].subUnit2Coef;
        } else if (noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].subUnit2) && uomData[item].subUnit2Function == "D") {
            uomData[item]["purSTKconv"] = uomData[item].subUnit2Coef;
        } else if (noE(uomData[item]["purchaseUnitX3"]) == searchCrossref(uomData[item].subUnit1)) {
            uomData[item]["purSTKconv"] = uomData[item].subUnit1Coef; 
        } /*else if (uomData[item]["purchaseUnitX3"] == searchCrossref(uomData[item].subUnit2) && uomData[item].subUnit2Function == "M") {
            uomData[item]["purSTKconv"] = 1 / uomData[item].subUnit2Coef;
        } */ else if (noE(uomData[item]["purchaseUnitX3"]) == searchCrossref(uomData[item].subUnit2)) {
            uomData[item]["purSTKconv"] = uomData[item].subUnit2Coef;
        } else {
            //console.log(item, uomData[item]);
            let pattern = "(?<numbers>\\d+)"+uomData[item]["salesUnitX3"]+"\\b";
            let re = new RegExp(pattern);
            let match = re.exec(uomData[item].unified_description);
            //console.log(match, re);
            if (match && match.groups && match.groups.numbers) {
                //console.log("from: <", match.input, "> extracted -> <", match.groups.numbers, ">");
                uomData[item]["purSTKconv"] = match.groups.numbers;
            }

        }
        /*if (Number.isInteger(uomData[item]["purSTKconv"])
        && uomData[item]["stockUnitX3"] != "LB"){
            uomData[item]["purSTKconv"] = 1 / (uomData[item]["purSTKconv"]);
        }
        */
        

        if (uomData[item]["stockUnitX3"] == uomData[item]["purchaseUnitX3"] 
            && uomData[item]["stockUnitX3"] == uomData[item]["salesUnitX3"]
            && ["CS", "BG", "PC"].includes(uomData[item]["stockUnitX3"])) {
            uomData[item]["stockUnitX3"] = uomData[item]["stockUnitX3"] + "E";
            uomData[item]["purchaseUnitX3"] = uomData[item]["purchaseUnitX3"] + "E";
            uomData[item]["salesUnitX3"] = uomData[item]["salesUnitX3"] + "E";
        }

        if (uomData[item]["stockUnitX3"] == uomData[item]["salesUnitX3"]
            && ["CS", "BG", "PC"].includes(uomData[item]["stockUnitX3"])) {
            uomData[item]["stockUnitX3"] = uomData[item]["stockUnitX3"] + "E";
            uomData[item]["salesUnitX3"] = uomData[item]["salesUnitX3"] + "E";
        }

        if (uomData[item]["salesUnitX3"] == uomData[item].stockUnitX3){
            uomData[item]["salSTKconv"] = "1";
        } else if (uomData[item]["stockUnitX3"] == uomData[item].subUnit1) {
            uomData[item]["salSTKconv"] = uomData[item].subUnit1Coef;
        } else if (uomData[item]["stockUnitX3"] == uomData[item].subUnit2) {
            uomData[item]["salSTKconv"] = uomData[item].subUnit2Coef;
        }

        if (uomData[item]["stockUnitX3"] != uomData[item]["purchaseUnitX3"] || uomData[item]["salesUnitX3"] != uomData[item]["purchaseUnitX3"]) {
            if (uomData[item].salesUnitX3 != uomData[item].stockUnitX3) {
                uomData[item]["pack1"] = uomData[item].salesUnitX3;
                uomData[item]["pack1STKcoef"] = uomData[item].salSTKconv;
            } 
            if (uomData[item].purchaseUnitX3 != uomData[item].stockUnitX3) {
                uomData[item]["pack2"] = uomData[item].purchaseUnitX3;
                uomData[item]["pack2STKcoef"] = uomData[item].purSTKconv;
            } 
        } else {
            let unitOfMeasure = salesData[item] == undefined ? [] : [...salesData[item]["unitOfMeasure"].values()];
            let newPackValue = searchCrossref(uomData[item]["stockUnitX3"], ...unitOfMeasure);
            if (newPackValue != "not found" && uomData[item]["stockUnitX3"] &&  newPackValue != uomData[item]["stockUnitX3"].substring(0,2))  {
                uomData[item]["pack1"] = searchCrossref(uomData[item]["stockUnitX3"], ...unitOfMeasure);
            }
        } 
        
        if (uomData[item]["stockUnitX3"] == uomData[item]["pack1"]) {
            uomData[item]["pack1"] = " ";
        }

        if (uomData[item].catchWeight == "Y") {
            uomData[item]["stockUnitX3"] = "LB";
            if (uomData[item]["purchaseUnitX3"] == "EA") {
                uomData[item]["purchaseUnitX3"] = "PC";
            }
            if (uomData[item]["pack1"] == "EA") {
                uomData[item]["pack1"] = "PC";
            }
            if (uomData[item]["pack2"] == "EA") {
                uomData[item]["pack2"] = "PC";
            }
        } else {
        if (uomData[item].catchWeight == "N" && uomData[item].stockUnit == "LBS") {
            uomData[item]["stockUnitX3"] = "LB";
            uomData[item]["purchaseUnitX3"] = "LB";
            uomData[item]["salSTKconv"] = "1";
            uomData[item]["salesUnitX3"] = "LB";
            uomData[item]["purSTKconv"] = "1";
            uomData[item]["pack1"] = uomData[item].subUnit1 == "PK" ? "BG" : uomData[item].subUnit1;
            uomData[item]["pack1STKcoef"] = uomData[item].subUnit1Coef;
            uomData[item]["pack2"] = uomData[item].subUnit2;
            uomData[item]["pack2STKcoef"] = uomData[item].subUnit2Coef;
            
            } /* else if (uomData[item]["pack1"] == "PK") {
                uomData[item]["pack1"] = "PCE";
            } */
        }


        if (uomData[item]["status"] == "AA") {
            uomData[item]["statusX3"] = "1";
            } 
        else if (uomData[item]["status"] == "IA") {
            uomData[item]["statusX3"] = "6";
        }

        if (categoryData[uomData[item].sortCategory] != undefined) {
            uomData[item]["category"] = categoryData[uomData[item].sortCategory].category;
        }

        if (uomData[item].stockUnit == uomData[item].stockUnitX3.substring(0,2)) {
            uomData[item]["seasoft_STU_STK_conv"] = "1";
        } else if (uomData[item].stockUnit == "LBS" && uomData[item].stockUnitX3 == "LB") {
            uomData[item]["seasoft_STU_STK_conv"] = "1";
        } else {
            if (searchCrossref(uomData[item].stockUnit, noE(uomData[item].stockUnitX3)) == uomData[item].stockUnit) {
                uomData[item]["seasoft_STU_STK_conv"] = 1 / uomData[item]["purSTKconv"];
            } else {
                uomData[item]["seasoft_STU_STK_conv"] = uomData[item]["purSTKconv"];
            } 
        } 
        
        // Remap weight depending on NEW calculated StockUnitX3:
        if (searchCrossrefReverseX3(uomData[item].stockUnit, noE(uomData[item].stockUnitX3)) != uomData[item].stockUnit) {
            uomData[item]["itemWeight"] = uomData[item]["itemWeight"] / uomData[item]["purSTKconv"];
        }

        if (uomData[item]["itemWeight"] == "1" && uomData[item]["stockUnitX3"] != "LB") {
            //console.log(item, uomData[item]);
            let pattern = "(?<numbers>[0-9.]+)[gG]\\s*(?:[xX/)]\\s*(?<multiplier>\\d+)(?<unit>[a-zA-Z]*))?";
            let re = new RegExp(pattern);
            let match = re.exec(uomData[item].unified_description);
            //console.log(match, re);
            if (match && match.groups && match.groups.numbers) {
                //console.log("from: <", match.input, "> extracted -> <", match.groups.numbers, ">");
                uomData[item]["weightG"] = match.groups.numbers;
                uomData[item]["itemWeight"] = match.groups.numbers * 0.00220462;
            }
            if (match && match.groups && match.groups.multiplier){
                if (match.groups.unit) {
                    if (uomData[item].stockUnit != match.groups.unit && noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].stockUnit)) {
                        //console.log("from: <", match.input, "> extracted multiplier -> <", match.groups.multiplier, ">"); 
                        // do some stuff with it like 
                        let multipliedValue = match.groups.multiplier;
                        uomData[item]["weightMultip"] = multipliedValue;
                        uomData[item]["itemWeight"] = uomData[item]["weightG"] * multipliedValue * 0.00220462;
                    }
                } else {
                    if (noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].stockUnit)) {
                        //console.log("from: <", match.input, "> extracted multiplier -> <", match.groups.multiplier, ">"); 
                        // do some stuff with it like 
                        let multipliedValue = match.groups.multiplier;
                        uomData[item]["weightMultip"] = multipliedValue;
                        uomData[item]["itemWeight"] = uomData[item]["weightG"] * multipliedValue * 0.00220462;
                    }
                }
                
            }

        }

        if (uomData[item]["itemWeight"] == "1" && uomData[item]["stockUnitX3"] != "LB") {
            //console.log(item, uomData[item]);
            let pattern = "(?<numbers>[0-9.]+)[kK][gG]\\s*(?:[xX/)]\\s*(?<multiplier>\\d+)(?<unit>[a-zA-Z]*))?";
            let re = new RegExp(pattern);
            let match = re.exec(uomData[item].unified_description);
            //console.log(match, re);
            if (match && match.groups && match.groups.numbers) {
                //console.log("from: <", match.input, "> extracted -> <", match.groups.numbers, ">");
                uomData[item]["weightKG"] = match.groups.numbers;
                uomData[item]["itemWeight"] = match.groups.numbers * 2.20462;
            }
            if (match && match.groups && match.groups.multiplier){
                if (match.groups.unit) {
                    if (uomData[item].stockUnit != match.groups.unit && noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].stockUnit)) {
                        //console.log("from: <", match.input, "> extracted multiplier -> <", match.groups.multiplier, ">"); 
                        // do some stuff with it like 
                        let multipliedValue = match.groups.multiplier;
                        uomData[item]["weightMultip"] = multipliedValue;
                        uomData[item]["itemWeight"] = uomData[item]["weightKG"] * multipliedValue * 2.20462;
                    }
                } else {
                    if (noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].stockUnit)) {
                        //console.log("from: <", match.input, "> extracted multiplier -> <", match.groups.multiplier, ">"); 
                        // do some stuff with it like 
                        let multipliedValue = match.groups.multiplier;
                        uomData[item]["weightMultip"] = multipliedValue;
                        uomData[item]["itemWeight"] = uomData[item]["weightKG"] * multipliedValue * 2.20462;
                    }
                }
                
            }

        }

        if (uomData[item]["itemWeight"] == "1" && uomData[item]["stockUnitX3"] != "LB") {
            //console.log(item, uomData[item]);
            let pattern = "(?<numbers>[0-9.]+)[lL][bB]\\s*(?:[xX/)]\\s*(?<multiplier>\\d+)(?<unit>[a-zA-Z]*))?";
            let re = new RegExp(pattern);
            let match = re.exec(uomData[item].unified_description);
            //console.log(match, re);
            if (match && match.groups && match.groups.numbers) {
                //console.log("from: <", match.input, "> extracted -> <", match.groups.numbers, ">");
                uomData[item]["weightLB"] = match.groups.numbers;
                uomData[item]["itemWeight"] = match.groups.numbers;
            }
            if (match && match.groups && match.groups.multiplier){
                if (match.groups.unit) {
                    if (uomData[item].stockUnit != match.groups.unit && noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].stockUnit)) {
                        //console.log("from: <", match.input, "> extracted multiplier -> <", match.groups.multiplier, ">"); 
                        // do some stuff with it like 
                        let multipliedValue = match.groups.multiplier;
                        uomData[item]["weightMultip"] = multipliedValue;
                        uomData[item]["itemWeight"] = uomData[item]["weightLB"] * multipliedValue;
                    }
                } else {
                    if (noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].stockUnit)) {
                        //console.log("from: <", match.input, "> extracted multiplier -> <", match.groups.multiplier, ">"); 
                        // do some stuff with it like 
                        let multipliedValue = match.groups.multiplier;
                        uomData[item]["weightMultip"] = multipliedValue;
                        uomData[item]["itemWeight"] = uomData[item]["weightLB"] * multipliedValue;
                    }
                }
                
            }

        }

        if (uomData[item]["itemWeight"] == "1" && uomData[item]["stockUnitX3"] != "LB") {
            //console.log(item, uomData[item]);
            let pattern = "(?<numbers>[0-9.]+)[oO][zZ]\\s*(?:[xX/)]\\s*(?<multiplier>\\d+)(?<unit>[a-zA-Z]*))?";
            let re = new RegExp(pattern);
            let match = re.exec(uomData[item].unified_description);
            //console.log(match, re);
            if (match && match.groups && match.groups.numbers) {
                //console.log("from: <", match.input, "> extracted -> <", match.groups.numbers, ">");
                uomData[item]["weightOZ"] = match.groups.numbers;
                uomData[item]["itemWeight"] = match.groups.numbers * 0.0625;
            }
            if (match && match.groups && match.groups.multiplier){
                if (match.groups.unit) {
                    if (uomData[item].stockUnit != match.groups.unit && noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].stockUnit)) {
                        //console.log("from: <", match.input, "> extracted multiplier -> <", match.groups.multiplier, ">"); 
                        // do some stuff with it like 
                        let multipliedValue = match.groups.multiplier;
                        uomData[item]["weightMultip"] = multipliedValue;
                        uomData[item]["itemWeight"] = uomData[item]["weightOZ"] * multipliedValue * 0.0625;
                    }
                } else {
                    if (noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].stockUnit)) {
                        //console.log("from: <", match.input, "> extracted multiplier -> <", match.groups.multiplier, ">"); 
                        // do some stuff with it like 
                        let multipliedValue = match.groups.multiplier;
                        uomData[item]["weightMultip"] = multipliedValue;
                        uomData[item]["itemWeight"] = uomData[item]["weightOZ"] * multipliedValue * 0.0625;
                    }
                }
                
            }

        }

        if ((uomData[item]["major"] == "700" || uomData[item]["major"] == "710") && (uomData[item]["stockUnitX3"] == "BTL" || uomData[item]["stockUnitX3"] == "CSE")) {
            //console.log(item, uomData[item]);
            let pattern = "(?<numbers>[0-9.]+)[lL][^bB](?:[xX/)]\\s*(?<multiplier>\\d+)(?<unit>[a-zA-Z]*))?";
            let re = new RegExp(pattern);
            let match = re.exec(uomData[item].unified_description);
            //console.log(match, re);
            if (match && match.groups && match.groups.numbers) {
                //console.log("from: <", match.input, "> extracted -> <", match.groups.numbers, ">");
                uomData[item]["volumeL"] = match.groups.numbers;
                uomData[item]["STK_volume"] = match.groups.numbers * 0.264172;
            }
            if (match && match.groups && match.groups.multiplier){
                if (match.groups.unit) {
                    if (uomData[item].stockUnit != match.groups.unit && noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].stockUnit)) {
                        //console.log("from: <", match.input, "> extracted multiplier -> <", match.groups.multiplier, ">"); 
                        // do some stuff with it like 
                        let multipliedValue = match.groups.multiplier;
                        uomData[item]["volumeMultip"] = multipliedValue;
                        uomData[item]["STK_volume"] = uomData[item]["volumeL"] * multipliedValue * 0.264172;
                    }
                } else {
                    if (noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].stockUnit)) {
                        //console.log("from: <", match.input, "> extracted multiplier -> <", match.groups.multiplier, ">"); 
                        // do some stuff with it like 
                        let multipliedValue = match.groups.multiplier;
                        uomData[item]["volumeMultip"] = multipliedValue;
                        uomData[item]["STK_volume"] = uomData[item]["volumeL"] * multipliedValue * 0.264172;
                    }
                }
                
            }

        }

        if ((uomData[item]["major"] == "700" || uomData[item]["major"] == "710") && (uomData[item]["stockUnitX3"] == "BTL" || uomData[item]["stockUnitX3"] == "CSE")) {
            //console.log(item, uomData[item]);
            let pattern = "(?<numbers>[0-9.]+)[mM][lL]\\s*(?:[xX/)]\\s*(?<multiplier>\\d+)(?<unit>[a-zA-Z]*))?";
            let re = new RegExp(pattern);
            let match = re.exec(uomData[item].unified_description);
            //console.log(match, re);
            if (match && match.groups && match.groups.numbers) {
                //console.log("from: <", match.input, "> extracted -> <", match.groups.numbers, ">");
                uomData[item]["volumeML"] = match.groups.numbers;
                uomData[item]["STK_volume"] = match.groups.numbers * 0.000264172;
            }
            if (match && match.groups && match.groups.multiplier){
                if (match.groups.unit) {
                    if (uomData[item].stockUnit != match.groups.unit && noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].stockUnit)) {
                        //console.log("from: <", match.input, "> extracted multiplier -> <", match.groups.multiplier, ">"); 
                        // do some stuff with it like 
                        let multipliedValue = match.groups.multiplier;
                        uomData[item]["volumeMultip"] = multipliedValue;
                        uomData[item]["STK_volume"] = uomData[item]["volumeML"] * multipliedValue * 0.000264172;
                    }
                } else {
                    if (noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].stockUnit)) {
                        //console.log("from: <", match.input, "> extracted multiplier -> <", match.groups.multiplier, ">"); 
                        // do some stuff with it like 
                        let multipliedValue = match.groups.multiplier;
                        uomData[item]["volumeMultip"] = multipliedValue;
                        uomData[item]["STK_volume"] = uomData[item]["volumeML"] * multipliedValue * 0.000264172;
                    }
                }
                
            }

        }

        if ((uomData[item]["major"] == "700" || uomData[item]["major"] == "710") && (uomData[item]["stockUnitX3"] == "BTL" || uomData[item]["stockUnitX3"] == "CSE")) {
            //console.log(item, uomData[item]);
            let pattern = "(?<numbers>[0-9.]+)[GAL]\\s*(?:[xX/)]\\s*(?<multiplier>\\d+)(?<unit>[a-zA-Z]*))?";
            let re = new RegExp(pattern);
            let match = re.exec(uomData[item].unified_description);
            //console.log(match, re);
            if (match && match.groups && match.groups.numbers) {
                //console.log("from: <", match.input, "> extracted -> <", match.groups.numbers, ">");
                uomData[item]["volumeGAL"] = match.groups.numbers;
                uomData[item]["STK_volume"] = match.groups.numbers;
            }
            if (match && match.groups && match.groups.multiplier){
                if (match.groups.unit) {
                    if (uomData[item].stockUnit != match.groups.unit && noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].stockUnit)) {
                        //console.log("from: <", match.input, "> extracted multiplier -> <", match.groups.multiplier, ">"); 
                        // do some stuff with it like 
                        let multipliedValue = match.groups.multiplier;
                        uomData[item]["volumeMultip"] = multipliedValue;
                        uomData[item]["STK_volume"] = uomData[item]["volumeGAL"] * multipliedValue;
                    }
                } else {
                    if (noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].stockUnit)) {
                        //console.log("from: <", match.input, "> extracted multiplier -> <", match.groups.multiplier, ">"); 
                        // do some stuff with it like 
                        let multipliedValue = match.groups.multiplier;
                        uomData[item]["volumeMultip"] = multipliedValue;
                        uomData[item]["STK_volume"] = uomData[item]["volumeGAL"] * multipliedValue;
                    }
                }
                
            }

        }

        if ((uomData[item]["major"] == "700" || uomData[item]["major"] == "710") && (uomData[item]["stockUnitX3"] == "BTL" || uomData[item]["stockUnitX3"] == "CSE")) {
            //console.log(item, uomData[item]);
            let pattern = "(?<numbers>[0-9.]+)[oO][zZ]\\s*(?:[xX/)]\\s*(?<multiplier>\\d+)(?<unit>[a-zA-Z]*))?";
            let re = new RegExp(pattern);
            let match = re.exec(uomData[item].unified_description);
            //console.log(match, re);
            if (match && match.groups && match.groups.numbers) {
                //console.log("from: <", match.input, "> extracted -> <", match.groups.numbers, ">");
                uomData[item]["volumeOZ"] = match.groups.numbers;
                uomData[item]["STK_volume"] = match.groups.numbers * 0.0078125;
            }
            if (match && match.groups && match.groups.multiplier){
                if (match.groups.unit) {
                    if (uomData[item].stockUnit != match.groups.unit && noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].stockUnit)) {
                        //console.log("from: <", match.input, "> extracted multiplier -> <", match.groups.multiplier, ">"); 
                        // do some stuff with it like 
                        let multipliedValue = match.groups.multiplier;
                        uomData[item]["volumeMultip"] = multipliedValue;
                        uomData[item]["STK_volume"] = uomData[item]["volumeOZ"] * multipliedValue * 0.0078125;
                    }
                } else {
                    if (noE(uomData[item]["stockUnitX3"]) == searchCrossref(uomData[item].stockUnit)) {
                        //console.log("from: <", match.input, "> extracted multiplier -> <", match.groups.multiplier, ">"); 
                        // do some stuff with it like 
                        let multipliedValue = match.groups.multiplier;
                        uomData[item]["volumeMultip"] = multipliedValue;
                        uomData[item]["STK_volume"] = uomData[item]["volumeOZ"] * multipliedValue * 0.0078125;
                    }
                }
                
            }

        }

        // if L, ml, Gl or BTL in Unified description (description 1&2) => there should be volume unit GAL and STK volume!
            
        uomData[item].qtyShipped = uomData[item].qtyShipped.join(";");

        //uomData[item]["purchaseUnitX3"] = addE(uomData[item]["purchaseUnitX3"])

        if (uomData[item]["stockUnit"] == "LBS") {
            uomData[item]["sales$LB"] = "2";
        }

    }
    return uomData;
}

function noE (unit) {
    if (["CSE", "BGE", "PCE"].includes(unit)) {
        return unit.substring(0,2);
    } 
    return unit;
}

function addE (unit) {
    if (["CS", "BG", "PC"].includes(unit)) {
        return unit + "E";
    } 
    return unit;
}