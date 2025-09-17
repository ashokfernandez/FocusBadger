import { extendTheme } from "@chakra-ui/react";

const toRgba = (light, dark) => ({ default: light, _dark: dark });

const theme = extendTheme({
  config: {
    initialColorMode: "system",
    useSystemColorMode: true
  },
  semanticTokens: {
    colors: {
      "app.bg": { default: "gray.50", _dark: "gray.900" },
      "text.primary": { default: "gray.800", _dark: "gray.100" },
      "text.muted": { default: "gray.600", _dark: "gray.300" },
      "text.subtle": { default: "gray.500", _dark: "gray.400" },
      "text.accent": { default: "purple.600", _dark: "purple.300" },
      "text.project": { default: "purple.500", _dark: "purple.200" },
      "text.warning": { default: "orange.600", _dark: "orange.300" },
      "text.error": { default: "red.500", _dark: "red.300" },
      "text.success": { default: "green.600", _dark: "green.300" },
      "text.inverse": { default: "white", _dark: "gray.900" },
      "surface.base": { default: "white", _dark: "gray.800" },
      "surface.elevated": { default: "white", _dark: "#1f2733" },
      "surface.subtle": { default: "gray.100", _dark: "gray.700" },
      "surface.muted": { default: "gray.50", _dark: "gray.800" },
      "surface.priority": toRgba("rgba(128, 90, 213, 0.12)", "rgba(159, 122, 234, 0.28)"),
      "surface.lowEffort": toRgba("rgba(56, 161, 105, 0.16)", "rgba(56, 161, 105, 0.26)"),
      "surface.done": toRgba("rgba(56, 161, 105, 0.18)", "rgba(56, 161, 105, 0.32)"),
      "surface.dropzone": toRgba("rgba(128, 90, 213, 0.16)", "rgba(128, 90, 213, 0.32)"),
      "border.subtle": { default: "gray.200", _dark: "gray.700" },
      "border.default": { default: "gray.300", _dark: "gray.600" },
      "border.emphasis": { default: "gray.400", _dark: "gray.500" },
      "border.priority": { default: "purple.400", _dark: "purple.300" },
      "border.lowEffort": { default: "green.400", _dark: "green.300" },
      "border.done": { default: "green.400", _dark: "green.300" },
      "border.dropzone": { default: "purple.400", _dark: "purple.300" },
      "interactive.focus": { default: "purple.400", _dark: "purple.300" },
      "interactive.accent": { default: "purple.500", _dark: "purple.300" },
      "interactive.muted": toRgba("rgba(128, 90, 213, 0.12)", "rgba(128, 90, 213, 0.28)"),
      "matrix.emptyState.border": { default: "gray.200", _dark: "gray.700" },
      "matrix.emptyState.text": { default: "gray.500", _dark: "gray.400" },
      "projects.empty.text": { default: "gray.500", _dark: "gray.400" },
      "assistant.text": { default: "gray.600", _dark: "gray.300" },
      "feedback.info": { default: "blue.500", _dark: "blue.300" },
      "feedback.error": { default: "red.500", _dark: "red.300" },
      "feedback.warning": { default: "orange.500", _dark: "orange.300" },
      "state.success.solid": { default: "green.500", _dark: "green.300" },
      "state.success.text": { default: "white", _dark: "gray.900" },
      "task.checkbox.border": { default: "gray.300", _dark: "gray.500" },
      "task.checkbox.borderChecked": { default: "green.400", _dark: "green.300" },
      "task.checkbox.bg": { default: "white", _dark: "gray.800" },
      "task.checkbox.bgChecked": { default: "green.500", _dark: "green.300" },
      "task.checkbox.icon": { default: "white", _dark: "gray.900" },
      "selection.bg": { default: "purple.100", _dark: "purple.700" },
      "selection.color": { default: "gray.900", _dark: "gray.100" }
    }
  },
  styles: {
    global: {
      body: {
        bg: "app.bg",
        color: "text.primary"
      },
      "::selection": {
        background: "var(--chakra-colors-selection-bg)",
        color: "var(--chakra-colors-selection-color)"
      }
    }
  }
});

export default theme;
