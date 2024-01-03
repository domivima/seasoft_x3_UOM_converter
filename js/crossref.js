function searchCrossref(...units) {
    let result = crossUnits.find((unitsElement) => {
        return units.includes(unitsElement[0])
    })
    if (result == undefined) {
        return "not found"
    }
    return result[1]
}

function searchCrossrefReverse(...units) {
    let result = crossUnits.toReversed().find((unitsElement) => {
        return units.includes(unitsElement[0])
    })
    if (result == undefined) {
        return "not found"
    }
    return result[1]
}

function searchCrossrefOrigin(...units) {
    let result = crossUnits.find((unitsElement) => {
        return units.includes(unitsElement[0])
    })
    if (result == undefined) {
        return "not found"
    }
    return result;
}

function searchCrossrefReverseX3(...units) {
    let result = crossUnits.toReversed().find((unitsElement) => {
        return units.includes(unitsElement[1])
    })
    if (result == undefined) {
        return "not found"
    }
    return result[1];
}

let crossUnits = [
["BD","BD","Bundle",""],
["BUN","BD","Bundle",""],
["BO","BD","Bundle (BO?)",""],
["CT","CT","Carton",""],
["CS","CS","Case",""],
["CX","CS","Case (CX?)",""],
["PL","PL","Pail",""],
["HCS","HCS","Half Case",""],
["BX","BOX","Box",""],
["BOX","BOX","Box"],
["DZ","DZ","Dozen",""],
["BG","BG","Bag",""],
["BLK","CTR","Container",""],
["BN","BUN","Bunch",""],
["EA","EA","Each","nonfood"],
["BT","BTL","Bottle",""],
["BTL","BTL","Bottle",""],
["BU","BU","Bucket",""],
["CN","CN","Can"],
["SE","EA","Each","nonfood"],
["PC","PC","Piece","catch weight"],
["P","PC","Piece"],
["PCS","PC","Piece"],
["PK","PK","Pack",""],
["SETS","PK","Pack"],
["GA","BU","Bucket (GA shuck Clams)",""],
["JA","JR","Jar (JA discontinue)",""],
["JR","JR","Jar",""],
["PS","ROL","Roll",""],
["RL","ROL","Roll",""],
["TB","BU","Tub",""],
["TR","TR","Tray",""],
["GAL","GAL","Gallon",""],
["HBU","BU","Half Bucket",""],
["HD","HDZ","Half Dozen",""],
["HG","GAL","Half Gallon",""],
["KG","KG","Kilo",""],
["LBS","LB","Pounds",""],
["OZ","OZ","Ounces",""],
];
