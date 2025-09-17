import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Switch,
  Text,
  Wrap,
  WrapItem,
  useColorMode
} from "@chakra-ui/react";
import { AttachmentIcon, ChevronDownIcon, SettingsIcon } from "@chakra-ui/icons";
import { useSystemColorModeSync } from "./ColorModeToggle.jsx";
import SaveStatusIndicator from "./SaveStatusIndicator.jsx";
import { HEADER_LAYOUT } from "../layout.js";
import { WORKSPACE_HEADER_ACTION_SPACING, WORKSPACE_HEADER_MENU_STYLES } from "./componentTokens.js";

export default function WorkspaceHeader({
  onAddTask,
  onOpenFile,
  onAssistantTab,
  saveState,
  onSave,
  isLocalStorageEnabled = false,
  onToggleLocalStorage,
  activeFileName = "",
  title = "FocusBadger",
  subtitle = "Focus on what matters"
}) {
  const { colorMode, toggleColorMode } = useColorMode();
  useSystemColorModeSync();

  const handleLocalStorageToggle = (event) => {
    event?.stopPropagation?.();
    const nextValue = event?.target?.checked;
    if (typeof nextValue === "boolean") {
      onToggleLocalStorage?.(nextValue);
    }
  };

  const handleColorModeToggle = (event) => {
    event?.stopPropagation?.();
    toggleColorMode();
  };

  return (
    <Flex align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4}>
      <Box>
        <Heading size="lg">{title}</Heading>
        <Text color="gray.500">{subtitle}</Text>
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
        </Wrap>
        <Wrap spacing={WORKSPACE_HEADER_ACTION_SPACING} justify="flex-end">
          <WrapItem>
            <Button colorScheme="purple" onClick={onAddTask} {...HEADER_LAYOUT.button}>
              Add idea
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
                Assistant IO
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => onAssistantTab(0)}>Copy snapshot</MenuItem>
                <MenuItem onClick={() => onAssistantTab(1)}>Apply assistant output</MenuItem>
              </MenuList>
            </Menu>
          </WrapItem>
          <WrapItem>
            <Menu placement="bottom-end">
              <MenuButton
                as={IconButton}
                variant="ghost"
                icon={<SettingsIcon />}
                aria-label="Workspace settings"
              />
              <MenuList minW="260px">
                <MenuGroup title="Workspace settings">
                  <MenuItem closeOnSelect={false}>
                    <Flex align="center" justify="space-between" w="full" gap={4}>
                      <Text fontSize="sm" fontWeight="medium">
                        Use local storage
                      </Text>
                      <Switch
                        id="workspace-local-storage"
                        colorScheme="purple"
                        isChecked={isLocalStorageEnabled}
                        onClick={(event) => event.stopPropagation()}
                        onChange={handleLocalStorageToggle}
                      />
                    </Flex>
                  </MenuItem>
                  <MenuItem closeOnSelect={false}>
                    <Flex align="center" justify="space-between" w="full" gap={4}>
                      <Text fontSize="sm" fontWeight="medium">
                        Dark mode
                      </Text>
                      <Switch
                        id="workspace-color-mode"
                        colorScheme="purple"
                        isChecked={colorMode === "dark"}
                        onClick={(event) => event.stopPropagation()}
                        onChange={handleColorModeToggle}
                      />
                    </Flex>
                  </MenuItem>
                </MenuGroup>
                <MenuDivider />
                <MenuItem
                  icon={<AttachmentIcon />}
                  isDisabled={isLocalStorageEnabled}
                  onClick={() => {
                    if (!isLocalStorageEnabled) {
                      onOpenFile?.();
                    }
                  }}
                >
                  <Flex align="center" justify="space-between" w="full" gap={3}>
                    <Text>Open file</Text>
                    {!isLocalStorageEnabled ? (
                      <Text fontSize="sm" color="gray.500" noOfLines={1} maxW="140px">
                        {activeFileName || "No file selected"}
                      </Text>
                    ) : null}
                  </Flex>
                </MenuItem>
              </MenuList>
            </Menu>
          </WrapItem>
        </Wrap>
      </Flex>
    </Flex>
  );
}
