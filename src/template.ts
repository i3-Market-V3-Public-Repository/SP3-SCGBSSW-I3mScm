// To parse this data:
//
//   import { Convert, Template } from "./file";
//
//   const template = Convert.toTemplate(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Template {
    dataOfferingDescription: DataOfferingDescription;
    parties:                 Parties;
    purpose:                 string;
    duration:                Duration;
    intendedUse:             IntendedUse;
    licenseGrant:            { [key: string]: boolean };
    dataStream:              boolean;
    personalData:            boolean;
    pricingModel:            PricingModel;
    dataExchangeAgreement:   DataExchangeAgreement;
    signatures:              Signatures;
}

export interface DataExchangeAgreement {
    orig:                  string;
    dest:                  string;
    encAlg:                string;
    signingAlg:            string;
    hashAlg:               string;
    ledgerContractAddress: string;
    ledgerSignerAddress:   string;
    pooToPorDelay:         number;
    pooToPopDelay:         number;
    pooToSecretDelay:      number;
}

export interface DataOfferingDescription {
    dataOfferingId: string;
    version:        number;
    title:          string;
    category:       string;
    active:         boolean;
}

export interface Duration {
    creationDate: number;
    startDate:    number;
    endDate:      number;
}

export interface IntendedUse {
    processData:             boolean;
    shareDataWithThirdParty: boolean;
    editData:                boolean;
}

export interface Parties {
    providerDid: string;
    consumerDid: string;
}

export interface PricingModel {
    paymentType:              string;
    pricingModelName:         string;
    basicPrice:               number;
    currency:                 string;
    fee:                      number;
    hasPaymentOnSubscription: HasPaymentOnSubscription;
    hasFreePrice:             HasFreePrice;
}

export interface HasFreePrice {
    hasPriceFree: boolean;
}

export interface HasPaymentOnSubscription {
    paymentOnSubscriptionName: string;
    paymentType:               string;
    timeDuration:              string;
    description:               string;
    repeat:                    string;
    hasSubscriptionPrice:      number;
}

export interface Signatures {
    providerSignature: string;
    consumerSignature: string;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class ConvertToTemplate {
    public static toTemplate(json: string): Template {
        return cast(JSON.parse(json), r("Template"));
    }

    public static templateToJson(value: Template): string {
        return JSON.stringify(uncast(value, r("Template")), null, 2);
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
    "Template": o([
        { json: "dataOfferingDescription", js: "dataOfferingDescription", typ: r("DataOfferingDescription") },
        { json: "parties", js: "parties", typ: r("Parties") },
        { json: "purpose", js: "purpose", typ: "" },
        { json: "duration", js: "duration", typ: r("Duration") },
        { json: "intendedUse", js: "intendedUse", typ: r("IntendedUse") },
        { json: "licenseGrant", js: "licenseGrant", typ: m(true) },
        { json: "dataStream", js: "dataStream", typ: true },
        { json: "personalData", js: "personalData", typ: true },
        { json: "pricingModel", js: "pricingModel", typ: r("PricingModel") },
        { json: "dataExchangeAgreement", js: "dataExchangeAgreement", typ: r("DataExchangeAgreement") },
        { json: "signatures", js: "signatures", typ: r("Signatures") },
    ], false),
    "DataExchangeAgreement": o([
        { json: "orig", js: "orig", typ: "" },
        { json: "dest", js: "dest", typ: "" },
        { json: "encAlg", js: "encAlg", typ: "" },
        { json: "signingAlg", js: "signingAlg", typ: "" },
        { json: "hashAlg", js: "hashAlg", typ: "" },
        { json: "ledgerContractAddress", js: "ledgerContractAddress", typ: "" },
        { json: "ledgerSignerAddress", js: "ledgerSignerAddress", typ: "" },
        { json: "pooToPorDelay", js: "pooToPorDelay", typ: 0 },
        { json: "pooToPopDelay", js: "pooToPopDelay", typ: 0 },
        { json: "pooToSecretDelay", js: "pooToSecretDelay", typ: 0 },
    ], false),
    "DataOfferingDescription": o([
        { json: "dataOfferingId", js: "dataOfferingId", typ: "" },
        { json: "version", js: "version", typ: 0 },
        { json: "title", js: "title", typ: "" },
        { json: "category", js: "category", typ: "" },
        { json: "active", js: "active", typ: true },
    ], false),
    "Duration": o([
        { json: "creationDate", js: "creationDate", typ: 0 },
        { json: "startDate", js: "startDate", typ: 0 },
        { json: "endDate", js: "endDate", typ: 0 },
    ], false),
    "IntendedUse": o([
        { json: "processData", js: "processData", typ: true },
        { json: "shareDataWithThirdParty", js: "shareDataWithThirdParty", typ: true },
        { json: "editData", js: "editData", typ: true },
    ], false),
    "Parties": o([
        { json: "providerDid", js: "providerDid", typ: "" },
        { json: "consumerDid", js: "consumerDid", typ: "" },
    ], false),
    "PricingModel": o([
        { json: "paymentType", js: "paymentType", typ: "" },
        { json: "pricingModelName", js: "pricingModelName", typ: "" },
        { json: "basicPrice", js: "basicPrice", typ: 0 },
        { json: "currency", js: "currency", typ: "" },
        { json: "fee", js: "fee", typ: 0 },
        { json: "hasPaymentOnSubscription", js: "hasPaymentOnSubscription", typ: r("HasPaymentOnSubscription") },
        { json: "hasFreePrice", js: "hasFreePrice", typ: r("HasFreePrice") },
    ], false),
    "HasFreePrice": o([
        { json: "hasPriceFree", js: "hasPriceFree", typ: true },
    ], false),
    "HasPaymentOnSubscription": o([
        { json: "paymentOnSubscriptionName", js: "paymentOnSubscriptionName", typ: "" },
        { json: "paymentType", js: "paymentType", typ: "" },
        { json: "timeDuration", js: "timeDuration", typ: "" },
        { json: "description", js: "description", typ: "" },
        { json: "repeat", js: "repeat", typ: "" },
        { json: "hasSubscriptionPrice", js: "hasSubscriptionPrice", typ: 0 },
    ], false),
    "Signatures": o([
        { json: "providerSignature", js: "providerSignature", typ: "" },
        { json: "consumerSignature", js: "consumerSignature", typ: "" },
    ], false),
};
