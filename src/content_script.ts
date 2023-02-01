import {translators} from "~/translators/translators";
import invariant from "ts-invariant";
import {NO_DETECTED_CONTENT_MESSAGE_TYPE} from "~/NoDetectedContentMessage";

const detectContent = () => {
  console.debug("detecting content");
  for (const translator of translators) {
    const detectedContentMessage = translator.detect();
    if (!detectedContentMessage) {
      console.debug("translator", translator.type, "did not detect content");
      continue;
    }
    console.debug(
      "translator",
      translator.type,
      "detected content:",
      JSON.stringify(detectedContentMessage)
    );
    invariant(detectedContentMessage.type === translator.type);
    chrome.runtime.sendMessage(detectedContentMessage);
    return;
  }

  console.debug("no content detected");
  chrome.runtime.sendMessage({type: NO_DETECTED_CONTENT_MESSAGE_TYPE});
};

document.onreadystatechange = detectContent;
if (document.readyState == "complete") {
  detectContent();
}

export {};
