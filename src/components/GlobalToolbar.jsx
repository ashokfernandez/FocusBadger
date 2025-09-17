import { useMemo } from "react";
import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import MatrixFilterChips from "./MatrixFilterChips.jsx";
import {
  GLOBAL_TOOLBAR_SORT_OPTIONS,
  GLOBAL_TOOLBAR_STACK_SPACING
} from "./componentTokens.js";

export default function GlobalToolbar({
  filterOptions,
  activeFilters,
  onToggleFilter,
  sortMode,
  onSortModeChange,
  children
}) {
  const sortOptions = useMemo(() => GLOBAL_TOOLBAR_SORT_OPTIONS, []);

  const activeSortLabel = useMemo(() => {
    const match = sortOptions.find((option) => option.value === sortMode);
    return match ? match.label : sortOptions[0].label;
  }, [sortOptions, sortMode]);

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="gray.100"
      boxShadow="md"
      px={{ base: 4, md: 6 }}
      py={{ base: 4, md: 5 }}
      data-testid="workspace-toolbar"
    >
      <Stack spacing={GLOBAL_TOOLBAR_STACK_SPACING}>
        <MatrixFilterChips options={filterOptions} active={activeFilters} onToggle={onToggleFilter}>
          <Menu>
            <MenuButton
              as={Button}
              size="xs"
              variant="outline"
              colorScheme="purple"
              rightIcon={<ChevronDownIcon />}
              data-testid="project-sort-select"
            >
              Sort: {activeSortLabel}
            </MenuButton>
            <MenuList>
              {sortOptions.map((option) => {
                const isActive = option.value === sortMode;
                return (
                  <MenuItem
                    key={option.value}
                    onClick={() => {
                      if (isActive) return;
                      onSortModeChange?.(option.value);
                    }}
                    fontWeight={isActive ? "semibold" : "normal"}
                  >
                    {option.label}
                  </MenuItem>
                );
              })}
            </MenuList>
          </Menu>
          {children}
        </MatrixFilterChips>
      </Stack>
    </Box>
  );
}
