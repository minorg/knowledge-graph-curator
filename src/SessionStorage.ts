import {
  DetectedContentMessage,
  detectedContentMessageSchema,
} from "~/DetectedContentMessage";

export class SessionStorage {
  private static readonly detectedContentMessageKeyPrefix =
    "detectedContentMessage";

  getDetectedContentMessage(
    windowLocation: string
  ): Promise<DetectedContentMessage | null> {
    return new Promise<DetectedContentMessage | null>((resolve, reject) => {
      chrome.storage.session.get((items) => {
        if (chrome.runtime.lastError) {
          console.debug(
            "session storage: lastError from runtime:",
            chrome.runtime.lastError
          );
          reject(chrome.runtime.lastError.message);
          return;
        }
        const item =
          items[
            SessionStorage.detectedContentMessageKeyPrefix + windowLocation
          ];
        if (!item) {
          console.debug(
            "session storage: no detected content message found for",
            windowLocation
          );
          resolve(null);
          return;
        }
        console.debug(
          "session storage: retrieved detected content message:",
          item
        );
        resolve(detectedContentMessageSchema.validateSync(item));
      });
    });
  }

  setDetectedContentMessage(
    detectedContentMessage: DetectedContentMessage
  ): Promise<void> {
    const items: {[index: string]: string} = {};
    const item = (items[
      SessionStorage.detectedContentMessageKeyPrefix +
        detectedContentMessage.windowLocation
    ] = JSON.stringify(detectedContentMessage));
    console.debug("session storage: setting detected content message:", item);
    return chrome.storage.session.set(items);
  }
}
