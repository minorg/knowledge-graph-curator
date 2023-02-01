import {SessionStorage} from "~/SessionStorage";
import {detectedContentMessageSchema} from "~/DetectedContentMessage";

const sessionStorage = new SessionStorage();

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.__parcel_hmr_reload__) {
    return;
  }

  console.debug("background: received message:", JSON.stringify(message));
  detectedContentMessageSchema
    .validate(message)
    .then((detectedContentMessage) =>
      sessionStorage.setCurrentDetectedContentMessage(detectedContentMessage)
    );
});

export {};
