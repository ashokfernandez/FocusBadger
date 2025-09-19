import { useMemo } from "react";
import { Button, HStack, Text } from "@chakra-ui/react";
import { MATRIX_SORT_OPTION_CONFIG } from "./componentTokens.js";
import { MATRIX_SORTS } from "../matrix.js";

export default function MatrixSortControl({ value, onChange }) {
  const options = useMemo(() => MATRIX_SORT_OPTION_CONFIG, []);
  const focusStyles = useMemo(
    () => ({
      [MATRIX_SORTS.SCORE]: {
        colorScheme: "red",
        shadow: "0 0 0 1px rgba(229, 62, 62, 0.55), 0 0 12px rgba(229, 62, 62, 0.35)"
      },
      [MATRIX_SORTS.LOW_EFFORT]: {
        colorScheme: "green",
        shadow: "0 0 0 1px rgba(56, 161, 105, 0.55), 0 0 12px rgba(56, 161, 105, 0.35)"
      }
    }),
    []
  );

  return (
    <HStack spacing={2} align="center">
      <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide" color="purple.500">
        Focus
      </Text>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <Button
            key={option.value}
            size="xs"
            variant={isActive ? "solid" : "outline"}
            colorScheme={isActive ? focusStyles[option.value]?.colorScheme ?? "purple" : "gray"}
            boxShadow={isActive ? focusStyles[option.value]?.shadow : undefined}
            onClick={() => {
              if (isActive) {
                onChange(null);
                return;
              }
              onChange(option.value);
            }}
            aria-pressed={isActive}
          >
            {option.label}
          </Button>
        );
      })}
    </HStack>
  );
}
