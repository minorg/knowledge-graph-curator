import {Configuration, configurationSchema} from "~/Configuration";
import {defaultConfiguration} from "~/defaultConfiguration";

export class SyncStorage {
  private static readonly configurationKey = "configuration";

  getConfiguration(): Promise<Configuration> {
    return new Promise<Configuration>((resolve, reject) => {
      chrome.storage.sync.get((items) => {
        if (chrome.runtime.lastError) {
          console.debug(
            "sync storage: lastError from runtime:",
            chrome.runtime.lastError
          );
          reject(chrome.runtime.lastError.message);
          return;
        }
        const item = items[SyncStorage.configurationKey];
        if (!item) {
          console.debug("sync storage: no item in configuration");
          resolve(defaultConfiguration);
          return;
        }
        console.debug("sync storage: retrieved configuration:", item);
        resolve(configurationSchema.validateSync(item));
      });
    });
  }

  setConfiguration(configuration: Configuration): Promise<void> {
    const items: {[index: string]: string} = {};
    items[SyncStorage.configurationKey] = JSON.stringify(configuration);
    console.debug(
      "sync storage: setting configuration:",
      items[SyncStorage.configurationKey]
    );
    return chrome.storage.sync.set(items);
  }
}
