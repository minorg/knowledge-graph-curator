import {
  DetectedContentMessage,
  detectedContentMessageSchema,
} from "~/DetectedContentMessage";

export class SessionStorage {
  private static readonly currentDetectedContentMessageKey =
    "currentDetectedContentMessage";

  getCurrentDetectedContentMessage(): Promise<DetectedContentMessage | null> {
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
        const item = items[SessionStorage.currentDetectedContentMessageKey];
        if (!item) {
          console.debug(
            "session storage: no item in current detected content message"
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

  setCurrentDetectedContentMessage(
    detectedContentMessage: DetectedContentMessage
  ): Promise<void> {
    const items: {[index: string]: string} = {};
    items[SessionStorage.currentDetectedContentMessageKey] = JSON.stringify(
      detectedContentMessage
    );
    console.debug(
      "session storage: setting detected content message:",
      items[SessionStorage.currentDetectedContentMessageKey]
    );
    return chrome.storage.session.set(items);
  }
}
