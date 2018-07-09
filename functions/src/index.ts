import * as functions from "firebase-functions"
import {actionssdk, SimpleResponse} from "actions-on-google"
import * as i18n from "i18n"

i18n.configure({
  locales: ["ja-JP", "en-US"],
  directory: "locales",
  defaultLocale: "ja-JP"
})

const app = actionssdk({
  debug: true
})

const createHexadecimalResponseForDisplay = (input: string): string => {
  return i18n.__("HEX", {
    input: input,
    hex: Number(input).toString(16)
  })
}

const createHexadecimalResponseForSpeech = (input: string): string => {
  return i18n.__("HEX", {
    input: input,
    hex: `<say-as interpret-as="characters">${Number(input).toString(16)}</say-as>`
  })
}

const createDecimalResponseForDisplay = (input: string): string => {
  return i18n.__("DEC", {
    input: input,
    dec: String(parseInt(input, 16))
  })
}

const createDecimalResponseForSpeech = (input: string): string => {
  return i18n.__("DEC", {
    input: `<say-as interpret-as="characters">${input}</say-as>`,
    dec: String(parseInt(input, 16))
  })
}

const createResponse = (conv, raw: string): Promise<SimpleResponse> => {
  return new Promise((resolve: (value: SimpleResponse) => void, reject: (reason?: any) => void) => {
    const input = raw.split(" ").join("")
    if (input.match(/^[0-9]+$/)) {
      resolve(new SimpleResponse(
        {
          text: createHexadecimalResponseForDisplay(input) + createDecimalResponseForDisplay(input),
          speech: `<speak>${createHexadecimalResponseForSpeech(input) + createDecimalResponseForSpeech(input)}</speak>`
        }
      ))
    } else if (input.match(/^[0-9a-fA-F]+$/)) {
      resolve(new SimpleResponse(
        {
          text: createDecimalResponseForDisplay(input),
          speech: `<speak>${createDecimalResponseForSpeech(input)}</speak>`
        }
      ))
    } else {
      reject()
    }
  })
}

app.intent("actions.intent.MAIN", (conv): Promise<void> | void => {
  i18n.setLocale(conv.user.locale)
  conv.data['invalidCount'] = 0
  const triggerQuery = conv.arguments.parsed.get("trigger_query")
  if (triggerQuery) {
    return createResponse(conv, triggerQuery.toString()).then(response => {
      conv.close(response)
    }).catch((): void => {
      conv.ask(i18n.__("WELCOME"))
    })
  } else {
    conv.ask(i18n.__("WELCOME"))
  }
})

app.intent("actions.intent.TEXT", (conv, raw): Promise<void> => {
  i18n.setLocale(conv.user.locale)
  return createResponse(conv, raw).then((response: SimpleResponse): void => {
    conv.data['invalidCount'] = 0
    conv.ask(response)
  }).catch((): void => {
    if (i18n.__("QUIT_PHRASE").split(",").indexOf(raw) !== -1) {
      conv.close(i18n.__("QUIT"))
    } else {
      const currentInvalidCount = conv.data['invalidCount']
      if (currentInvalidCount === 2) {
        conv.close(i18n.__("QUIT"))
      } else {
        conv.data['invalidCount'] = currentInvalidCount + 1
        conv.ask(i18n.__("INVALID"))
      }
    }
  })
})

exports.fulfillment = functions.https.onRequest(app)
