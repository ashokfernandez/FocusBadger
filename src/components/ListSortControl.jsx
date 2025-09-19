import { useMemo } from "react";
import { Button, HStack, Menu, MenuButton, MenuItem, MenuList, Text } from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { GLOBAL_TOOLBAR_SORT_OPTIONS } from "./componentTokens.js";

export default function ListSortControl({ value, onChange, label = "Sort" }) {
  const options = useMemo(() => GLOBAL_TOOLBAR_SORT_OPTIONS, []);
  const activeOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value]
  );

  return (
    <Menu>
      <MenuButton as={Button} size="sm" variant="outline" colorScheme="purple" rightIcon={<ChevronDownIcon />}
        aria-label={`${label}: ${activeOption.label}`}>
        <HStack spacing={1}>
          <Text fontSize="xs" textTransform="uppercase" fontWeight="semibold" letterSpacing="wide">
            {label}
          </Text>
          <Text fontSize="sm" fontWeight="semibold">
            {activeOption.label}
          </Text>
        </HStack>
      </MenuButton>
      <MenuList>
        {options.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => {
              if (option.value === activeOption.value) return;
              onChange?.(option.value);
            }}
            aria-checked={option.value === activeOption.value}
            role="menuitemradio"
          >
            {option.label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}
