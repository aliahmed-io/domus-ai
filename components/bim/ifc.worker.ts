/// <reference lib="webworker" />
import * as WebIFC from "web-ifc";

let ifcApi: WebIFC.IfcAPI | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, data } = e.data;
  if (type === "PARSE_IFC" && data) {
    try {
      if (!ifcApi) {
        ifcApi = new WebIFC.IfcAPI();
        ifcApi.SetWasmPath("/");
        await ifcApi.Init();
      }

      const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);
      const modelID = ifcApi.OpenModel(uint8);

      const walls = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCWALL);
      const doors = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCDOOR);
      const windows = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCWINDOW);
      const storeys = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCBUILDINGSTOREY);

      const summary = {
        modelID,
        wallCount: walls.size(),
        doorCount: doors.size(),
        windowCount: windows.size(),
        storeyCount: storeys.size(),
      };

      ifcApi.CloseModel(modelID);

      self.postMessage({ type: "PARSE_SUCCESS", payload: summary });
    } catch (err) {
      self.postMessage({
        type: "PARSE_ERROR",
        payload: err instanceof Error ? err.message : String(err),
      });
    }
  }
};

