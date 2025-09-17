import { useMemo } from "react";
import { Button, ButtonGroup, HStack, Text } from "@chakra-ui/react";
import { MATRIX_SORT_OPTION_CONFIG } from "./componentTokens.js";

export default function MatrixSortControl({ value, onChange }) {
  const options = useMemo(() => MATRIX_SORT_OPTION_CONFIG, []);

  return (
    <HStack spacing={2} align="center">
      <Text fontSize="xs" textTransform="uppercase" letterSpacing="wide" color="gray.500">
        Sort
      </Text>
      <ButtonGroup size="xs" isAttached variant="outline">
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <Button
              key={option.value}
              variant={isActive ? "solid" : "outline"}
              colorScheme={isActive ? "purple" : "gray"}
              onClick={() => {
                if (isActive) return;
                onChange(option.value);
              }}
              aria-pressed={isActive}
            >
              {option.label}
            </Button>
          );
        })}
      </ButtonGroup>
    </HStack>
  );
}
