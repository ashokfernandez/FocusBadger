import { FormControl, FormLabel, Switch, useColorMode } from "@chakra-ui/react";
import { useEffect } from "react";

export default function ColorModeToggle() {
  const { colorMode, setColorMode, toggleColorMode } = useColorMode();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncWithSystem = (event) => {
      setColorMode(event.matches ? "dark" : "light");
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", syncWithSystem);
    } else {
      mediaQuery.addListener(syncWithSystem);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", syncWithSystem);
      } else {
        mediaQuery.removeListener(syncWithSystem);
      }
    };
  }, [setColorMode]);
  return (
    <FormControl display="flex" alignItems="center" width="auto">
      <FormLabel htmlFor="workspace-color-mode" mb="0" fontSize="sm" fontWeight="medium">
        Dark mode
      </FormLabel>
      <Switch
        id="workspace-color-mode"
        colorScheme="purple"
        isChecked={colorMode === "dark"}
        onChange={toggleColorMode}
      />
    </FormControl>
  );
}
