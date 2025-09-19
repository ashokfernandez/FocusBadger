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
import { AddIcon, AttachmentIcon, ChevronDownIcon, MinusIcon, SettingsIcon } from "@chakra-ui/icons";
import { useSystemColorModeSync } from "./ColorModeToggle.jsx";
import SaveStatusIndicator from "./SaveStatusIndicator.jsx";
import { HEADER_LAYOUT } from "../layout.js";
import { WORKSPACE_HEADER_ACTION_SPACING, WORKSPACE_HEADER_MENU_STYLES } from "./componentTokens.js";
import { colors } from "../theme/tokens.js";

export default function WorkspaceHeader({
  onAddTask,
  onOpenFile,
  onAssistantTab,
  saveState,
  onSave,
  isLocalStorageEnabled = false,
  onToggleLocalStorage,
  activeFileName = "",
  moodHighlightLimit = 3,
  onMoodHighlightLimitChange,
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

  const canDecreaseMoodHighlights = moodHighlightLimit > 1;
  const canIncreaseMoodHighlights = moodHighlightLimit < 5;

  const adjustMoodHighlightLimit = (delta) => {
    onMoodHighlightLimitChange?.((current) => {
      const next = typeof current === "number" ? current + delta : moodHighlightLimit + delta;
      return next;
    });
  };

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
                Assistant I/O
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
                  <MenuItem closeOnSelect={false}>
                    <Flex align="center" justify="space-between" w="full" gap={4}>
                      <Box>
                        <Text fontSize="sm" fontWeight="medium">
                          Focus highlights
                        </Text>
                        <Text fontSize="xs" color={colors.textSubtle}>
                          Choose how many tasks glow when the focus switch is on.
                        </Text>
                      </Box>
                      <Flex align="center" gap={2}>
                        <IconButton
                          size="xs"
                          variant="outline"
                          aria-label="Decrease focus highlight count"
                          icon={<MinusIcon />}
                          isDisabled={!canDecreaseMoodHighlights}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (canDecreaseMoodHighlights) {
                              adjustMoodHighlightLimit(-1);
                            }
                          }}
                        />
                        <Box minW="32px">
                          <Text fontSize="sm" fontWeight="semibold" textAlign="center">
                            {moodHighlightLimit}
                          </Text>
                        </Box>
                        <IconButton
                          size="xs"
                          variant="outline"
                          aria-label="Increase focus highlight count"
                          icon={<AddIcon />}
                          isDisabled={!canIncreaseMoodHighlights}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (canIncreaseMoodHighlights) {
                              adjustMoodHighlightLimit(1);
                            }
                          }}
                        />
                      </Flex>
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
                      <Text fontSize="sm" color={colors.textSubtle} noOfLines={1} maxW="140px">
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
