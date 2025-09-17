import { Box, Button, Flex, Heading, Menu, MenuButton, MenuItem, MenuList, Text, Wrap, WrapItem } from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import SaveStatusIndicator from "./SaveStatusIndicator.jsx";
import { HEADER_LAYOUT } from "../layout.js";
import { WORKSPACE_HEADER_ACTION_SPACING, WORKSPACE_HEADER_MENU_STYLES } from "./componentTokens.js";

export default function WorkspaceHeader({
  onAddTask,
  onOpenFile,
  onAssistantTab,
  saveState,
  onSave,
  title = "TaskBadger",
  subtitle = "Focus on what matters"
}) {
  return (
    <Flex align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={4}>
      <Box>
        <Heading size="lg">{title}</Heading>
        <Text color="gray.500">{subtitle}</Text>
      </Box>
      <Flex {...HEADER_LAYOUT.container}>
        <SaveStatusIndicator state={saveState} onSave={onSave} />
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
