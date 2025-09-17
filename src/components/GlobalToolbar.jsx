import { Box, Flex, Stack } from "@chakra-ui/react";
import MatrixFilterChips from "./MatrixFilterChips.jsx";
import { GLOBAL_TOOLBAR_STACK_SPACING } from "./componentTokens.js";

export default function GlobalToolbar({
  filterOptions,
  activeFilters,
  onToggleFilter,
  children
}) {
  return (
    <Stack spacing={GLOBAL_TOOLBAR_STACK_SPACING} data-testid="workspace-toolbar">
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        gap={{ base: 3, md: 6 }}
      >
        <Box flex="1" w="full">
          <MatrixFilterChips options={filterOptions} active={activeFilters} onToggle={onToggleFilter} />
        </Box>
        {children ? (
          <Box flexShrink={0} alignSelf={{ base: "flex-start", md: "center" }}>
            {children}
          </Box>
        ) : null}
      </Flex>
    </Stack>
  );
}
