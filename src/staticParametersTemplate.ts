// To parse this data:
//
//   import { Convert, StaticParametersTemplate } from "./file";
//
//   const staticParametersTemplate = Convert.toStaticParametersTemplate(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface StaticParametersTemplate {
    offeringId:         string;
    version:            number;
    provider:           string;
    providerDid:        string;
    active:             boolean;
    dataStream:         boolean;
    personalData:       boolean;
    category:           string;
    dataOfferingTitle:  string;
    contractParameters: ContractParameters;
    hasPricingModel:    HasPricingModel;
    dataExchangeSpec:   DataExchangeSpec;
}

export interface ContractParameters {
    interestOfProvider:       string;
    interestDescription:      string;
    hasGoverningJurisdiction: string;
    purpose:                  string;
    purposeDescription:       string;
    hasIntendedUse:           HasIntendedUse;
    hasLicenseGrant:          HasLicenseGrant;
}

export interface HasIntendedUse {
    processData:             boolean;
    shareDataWithThirdParty: boolean;
    editData:                boolean;
}

export interface HasLicenseGrant {
    copyData:      boolean;
    transferable:  boolean;
    exclusiveness: boolean;
    revocable:     boolean;
}

export interface DataExchangeSpec {
    encAlg:                string;
    signingAlg:            string;
    hashAlg:               string;
    ledgerContractAddress: string;
    ledgerSignerAddress:   string;
    pooToPorDelay:         number;
    pooToPopDelay:         number;
    pooToSecretDelay:      number;
}

export interface HasPricingModel {
    pricingModelName:         string;
    basicPrice:               number;
    currency:                 string;
    hasPaymentOnSubscription: HasPaymentOnSubscription;
    hasPaymentOnApi:          HasPaymentOnAPI;
    hasPaymentOnUnit:         HasPaymentOnUnit;
    hasPaymentOnSize:         HasPaymentOnSize;
    hasFreePrice:             HasFreePrice;
}

export interface HasFreePrice {
    hasPriceFree: boolean;
}

export interface HasPaymentOnAPI {
    paymentOnApiName: string;
    description:      string;
    numberOfObject:   number;
    hasApiPrice:      number;
}

export interface HasPaymentOnSize {
    paymentOnSizeName: string;
    description:       string;
    dataSize:          string;
    hasSizePrice:      number;
}

export interface HasPaymentOnSubscription {
    paymentOnSubscriptionName: string;
    paymentType:               string;
    timeDuration:              string;
    description:               string;
    repeat:                    string;
    hasSubscriptionPrice:      number;
}

export interface HasPaymentOnUnit {
    paymentOnUnitName: string;
    description:       string;
    dataUnit:          number;
    hasUnitPrice:      number;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class ConvertToStaticParametersTemplate {
    public static toStaticParametersTemplate(json: string): StaticParametersTemplate {
        return cast(JSON.parse(json), r("StaticParametersTemplate"));
    }

    public static staticParametersTemplateToJson(value: StaticParametersTemplate): string {
        return JSON.stringify(uncast(value, r("StaticParametersTemplate")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any = ''): never {
    if (key) {
        throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
    }
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`, );
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, prop.key);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "StaticParametersTemplate": o([
        { json: "offeringId", js: "offeringId", typ: "" },
        { json: "version", js: "version", typ: 0 },
        { json: "provider", js: "provider", typ: "" },
        { json: "providerDid", js: "providerDid", typ: "" },
        { json: "active", js: "active", typ: true },
        { json: "dataStream", js: "dataStream", typ: true },
        { json: "personalData", js: "personalData", typ: true },
        { json: "category", js: "category", typ: "" },
        { json: "dataOfferingTitle", js: "dataOfferingTitle", typ: "" },
        { json: "contractParameters", js: "contractParameters", typ: r("ContractParameters") },
        { json: "hasPricingModel", js: "hasPricingModel", typ: r("HasPricingModel") },
        { json: "dataExchangeSpec", js: "dataExchangeSpec", typ: r("DataExchangeSpec") },
    ], false),
    "ContractParameters": o([
        { json: "interestOfProvider", js: "interestOfProvider", typ: "" },
        { json: "interestDescription", js: "interestDescription", typ: "" },
        { json: "hasGoverningJurisdiction", js: "hasGoverningJurisdiction", typ: "" },
        { json: "purpose", js: "purpose", typ: "" },
        { json: "purposeDescription", js: "purposeDescription", typ: "" },
        { json: "hasIntendedUse", js: "hasIntendedUse", typ: r("HasIntendedUse") },
        { json: "hasLicenseGrant", js: "hasLicenseGrant", typ: r("HasLicenseGrant") },
    ], false),
    "HasIntendedUse": o([
        { json: "processData", js: "processData", typ: true },
        { json: "shareDataWithThirdParty", js: "shareDataWithThirdParty", typ: true },
        { json: "editData", js: "editData", typ: true },
    ], false),
    "HasLicenseGrant": o([
        { json: "copyData", js: "copyData", typ: true },
        { json: "transferable", js: "transferable", typ: true },
        { json: "exclusiveness", js: "exclusiveness", typ: true },
        { json: "revocable", js: "revocable", typ: true },
    ], false),
    "DataExchangeSpec": o([
        { json: "encAlg", js: "encAlg", typ: "" },
        { json: "signingAlg", js: "signingAlg", typ: "" },
        { json: "hashAlg", js: "hashAlg", typ: "" },
        { json: "ledgerContractAddress", js: "ledgerContractAddress", typ: "" },
        { json: "ledgerSignerAddress", js: "ledgerSignerAddress", typ: "" },
        { json: "pooToPorDelay", js: "pooToPorDelay", typ: 0 },
        { json: "pooToPopDelay", js: "pooToPopDelay", typ: 0 },
        { json: "pooToSecretDelay", js: "pooToSecretDelay", typ: 0 },
    ], false),
    "HasPricingModel": o([
        { json: "pricingModelName", js: "pricingModelName", typ: "" },
        { json: "basicPrice", js: "basicPrice", typ: 0 },
        { json: "currency", js: "currency", typ: "" },
        { json: "hasPaymentOnSubscription", js: "hasPaymentOnSubscription", typ: r("HasPaymentOnSubscription") },
        { json: "hasPaymentOnApi", js: "hasPaymentOnApi", typ: r("HasPaymentOnAPI") },
        { json: "hasPaymentOnUnit", js: "hasPaymentOnUnit", typ: r("HasPaymentOnUnit") },
        { json: "hasPaymentOnSize", js: "hasPaymentOnSize", typ: r("HasPaymentOnSize") },
        { json: "hasFreePrice", js: "hasFreePrice", typ: r("HasFreePrice") },
    ], false),
    "HasFreePrice": o([
        { json: "hasPriceFree", js: "hasPriceFree", typ: true },
    ], false),
    "HasPaymentOnAPI": o([
        { json: "paymentOnApiName", js: "paymentOnApiName", typ: "" },
        { json: "description", js: "description", typ: "" },
        { json: "numberOfObject", js: "numberOfObject", typ: 0 },
        { json: "hasApiPrice", js: "hasApiPrice", typ: 0 },
    ], false),
    "HasPaymentOnSize": o([
        { json: "paymentOnSizeName", js: "paymentOnSizeName", typ: "" },
        { json: "description", js: "description", typ: "" },
        { json: "dataSize", js: "dataSize", typ: "" },
        { json: "hasSizePrice", js: "hasSizePrice", typ: 0 },
    ], false),
    "HasPaymentOnSubscription": o([
        { json: "paymentOnSubscriptionName", js: "paymentOnSubscriptionName", typ: "" },
        { json: "paymentType", js: "paymentType", typ: "" },
        { json: "timeDuration", js: "timeDuration", typ: "" },
        { json: "description", js: "description", typ: "" },
        { json: "repeat", js: "repeat", typ: "" },
        { json: "hasSubscriptionPrice", js: "hasSubscriptionPrice", typ: 0 },
    ], false),
    "HasPaymentOnUnit": o([
        { json: "paymentOnUnitName", js: "paymentOnUnitName", typ: "" },
        { json: "description", js: "description", typ: "" },
        { json: "dataUnit", js: "dataUnit", typ: 0 },
        { json: "hasUnitPrice", js: "hasUnitPrice", typ: 0 },
    ], false),
};
