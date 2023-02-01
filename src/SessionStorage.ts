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
          reject(chrome.runtime.lastError.message);
          return;
        }
        const item = items[SessionStorage.currentDetectedContentMessageKey];
        if (!item) {
          resolve(null);
          return;
        }
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
    return chrome.storage.session.set(items);
  }
}
