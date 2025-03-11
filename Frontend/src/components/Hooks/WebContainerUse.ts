import { WebContainer } from "@webcontainer/api";
import { useEffect, useState } from "react";

export function useWebContainer() {
  const [webcontainer, setWebcontainer] = useState<WebContainer>();
  async function main() {
    const webContainerInstance = await WebContainer.boot();
    setWebcontainer(webContainerInstance);
  }
  useEffect(() => {
    main();
  }, []);
  return webcontainer;
}
