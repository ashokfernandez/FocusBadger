import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Switch,
  Text,
  Wrap,
  WrapItem
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import SaveStatusIndicator from "./SaveStatusIndicator.jsx";
import { HEADER_LAYOUT } from "../layout.js";
import { WORKSPACE_HEADER_ACTION_SPACING, WORKSPACE_HEADER_MENU_STYLES } from "./componentTokens.js";
import ColorModeToggle from "./ColorModeToggle.jsx";
import { colors } from "../theme/tokens.js";

export default function WorkspaceHeader({
  onAddTask,
  onOpenFile,
  onAssistantTab,
  saveState,
  onSave,
  isLocalStorageEnabled = false,
  onToggleLocalStorage,
  title = "FocusBadger",
  subtitle = "Focus on what matters"
}) {
  return (
    <Flex align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4}>
      <Box>
        <Heading size="lg">{title}</Heading>
        <Text color={colors.textMuted}>{subtitle}</Text>
      </Box>
      <Flex
        {...HEADER_LAYOUT.container}
        align={{ base: "flex-start", md: "center" }}
        gap={6}
        flexWrap={{ base: "wrap", md: "nowrap" }}
      >
        <Wrap spacing={3} align="center">
          <WrapItem>
            <SaveStatusIndicator state={saveState} onSave={onSave} />
          </WrapItem>
          <WrapItem>
            <ColorModeToggle />
          </WrapItem>
          <WrapItem>
            <FormControl display="flex" alignItems="center" width="auto">
              <FormLabel htmlFor="workspace-local-storage" mb="0" fontSize="sm" fontWeight="medium">
                Use local storage
              </FormLabel>
              <Switch
                id="workspace-local-storage"
                colorScheme="purple"
                isChecked={isLocalStorageEnabled}
                onChange={(event) => onToggleLocalStorage?.(event.target.checked)}
              />
            </FormControl>
          </WrapItem>
        </Wrap>
        <Wrap spacing={WORKSPACE_HEADER_ACTION_SPACING} justify="flex-end">
          <WrapItem>
            <Button colorScheme="purple" onClick={onAddTask} {...HEADER_LAYOUT.button}>
              Add task
            </Button>
          </WrapItem>
          <WrapItem>
            <Button variant="outline" onClick={onOpenFile} {...HEADER_LAYOUT.button}>
              Open file
            </Button>
          </WrapItem>
          <WrapItem>
            <Menu placement="bottom-end">
              <MenuButton
                as={Button}
                {...HEADER_LAYOUT.button}
                bgGradient={WORKSPACE_HEADER_MENU_STYLES.gradient}
                color="white"
                _hover={{ bgGradient: WORKSPACE_HEADER_MENU_STYLES.hover }}
                _active={{ bgGradient: WORKSPACE_HEADER_MENU_STYLES.active }}
                rightIcon={<ChevronDownIcon />}
              >
                Assistant I/O
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => onAssistantTab(0)}>Copy snapshot</MenuItem>
                <MenuItem onClick={() => onAssistantTab(1)}>Apply assistant output</MenuItem>
              </MenuList>
            </Menu>
          </WrapItem>
        </Wrap>
      </Flex>
    </Flex>
  );
}
