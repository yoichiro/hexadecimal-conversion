"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const actions_on_google_1 = require("actions-on-google");
const i18n = require("i18n");
i18n.configure({
    locales: ["ja-JP", "en-US"],
    directory: "locales",
    defaultLocale: "ja-JP"
});
const app = actions_on_google_1.actionssdk({
    debug: true
});
const createHexadecimalResponseForDisplay = (input) => {
    return i18n.__("HEX", {
        input: input,
        hex: Number(input).toString(16)
    });
};
const createHexadecimalResponseForSpeech = (input) => {
    return i18n.__("HEX", {
        input: input,
        hex: `<say-as interpret-as="characters">${Number(input).toString(16)}</say-as>`
    });
};
const createDecimalResponseForDisplay = (input) => {
    return i18n.__("DEC", {
        input: input,
        dec: String(parseInt(input, 16))
    });
};
const createDecimalResponseForSpeech = (input) => {
    return i18n.__("DEC", {
        input: `<say-as interpret-as="characters">${input}</say-as>`,
        dec: String(parseInt(input, 16))
    });
};
const createResponse = (conv, raw) => {
    return new Promise((resolve, reject) => {
        const input = raw.split(" ").join("");
        if (input.match(/^[0-9]+$/)) {
            resolve(new actions_on_google_1.SimpleResponse({
                text: createHexadecimalResponseForDisplay(input) + createDecimalResponseForDisplay(input),
                speech: `<speak>${createHexadecimalResponseForSpeech(input) + createDecimalResponseForSpeech(input)}</speak>`
            }));
        }
        else if (input.match(/^[0-9a-fA-F]+$/)) {
            resolve(new actions_on_google_1.SimpleResponse({
                text: createDecimalResponseForDisplay(input),
                speech: `<speak>${createDecimalResponseForSpeech(input)}</speak>`
            }));
        }
        else {
            reject();
        }
    });
};
app.intent("actions.intent.MAIN", (conv) => {
    i18n.setLocale(conv.user.locale);
    conv.data['invalidCount'] = 0;
    const triggerQuery = conv.arguments.parsed.get("trigger_query");
    if (triggerQuery) {
        return createResponse(conv, triggerQuery.toString()).then(response => {
            conv.close(response);
        }).catch(() => {
            conv.ask(i18n.__("WELCOME"));
        });
    }
    else {
        conv.ask(i18n.__("WELCOME"));
    }
});
app.intent("actions.intent.TEXT", (conv, raw) => {
    i18n.setLocale(conv.user.locale);
    return createResponse(conv, raw).then((response) => {
        conv.data['invalidCount'] = 0;
        conv.ask(response);
    }).catch(() => {
        if (i18n.__("QUIT_PHRASE").split(",").indexOf(raw) !== -1) {
            conv.close(i18n.__("QUIT"));
        }
        else {
            const currentInvalidCount = conv.data['invalidCount'];
            if (currentInvalidCount === 2) {
                conv.close(i18n.__("QUIT"));
            }
            else {
                conv.data['invalidCount'] = currentInvalidCount + 1;
                conv.ask(i18n.__("INVALID"));
            }
        }
    });
});
exports.fulfillment = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map