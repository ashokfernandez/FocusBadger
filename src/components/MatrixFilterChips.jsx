import { Children, useCallback, useMemo } from "react";
import { Button, Wrap, WrapItem } from "@chakra-ui/react";
import { ALL_PROJECTS, UNASSIGNED_LABEL } from "../matrix.js";
import { MATRIX_FILTER_CHIP_SPACING } from "./componentTokens.js";

export default function MatrixFilterChips({ options, active, onToggle, children }) {
  const renderLabel = useCallback((value) => {
    if (value === ALL_PROJECTS) return "All projects";
    if (value === UNASSIGNED_LABEL) return "Unassigned";
    return value;
  }, []);

  const extraItems = useMemo(() => Children.toArray(children), [children]);

  return (
    <Wrap spacing={MATRIX_FILTER_CHIP_SPACING} mt={1}>
      {options.map((option) => {
        const selected = active.includes(option);
        return (
          <WrapItem key={option}>
            <Button
              size="xs"
              variant={selected ? "solid" : "outline"}
              colorScheme={selected ? "purple" : "gray"}
              onClick={() => onToggle(option)}
              aria-pressed={selected}
            >
              {renderLabel(option)}
            </Button>
          </WrapItem>
        );
      })}
      {extraItems.map((child, index) => (
        <WrapItem key={`extra-${index}`}>{child}</WrapItem>
      ))}
    </Wrap>
  );
}
