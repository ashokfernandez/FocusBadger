import { Badge, Box, HStack, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";

const MIN_EFFORT = 1;
const MAX_EFFORT = 10;
const DEFAULT_EFFORT = 5;

function clampEffort(value) {
  if (value == null || Number.isNaN(value)) return DEFAULT_EFFORT;
  if (value < MIN_EFFORT) return MIN_EFFORT;
  if (value > MAX_EFFORT) return MAX_EFFORT;
  return Math.round(value);
}

function describeEffort(value) {
  if (value == null) {
    return { label: "Slide to set", colorScheme: "gray" };
  }
  if (value <= 3) {
    return { label: "Light lift", colorScheme: "green" };
  }
  if (value <= 7) {
    return { label: "In the zone", colorScheme: "yellow" };
  }
  return { label: "Deep focus", colorScheme: "red" };
}

export function EffortSlider({ value, onChange, size = "md", isCompact = false, defaultValue = DEFAULT_EFFORT }) {
  const [internalValue, setInternalValue] = useState(() => clampEffort(value ?? defaultValue));
  const hasDefinedValue = value != null;

  useEffect(() => {
    setInternalValue(clampEffort(value ?? defaultValue));
  }, [value, defaultValue]);

  const descriptor = useMemo(
    () => describeEffort(hasDefinedValue ? internalValue : null),
    [hasDefinedValue, internalValue]
  );

  const badgeText = hasDefinedValue ? `${internalValue}/10` : "Set effort";
  const badgeVariant = hasDefinedValue ? "solid" : "subtle";

  const fontSize = size === "sm" ? "xs" : "sm";

  return (
    <Box>
      <HStack justify="space-between" mb={isCompact ? 1 : 2} spacing={3} align="center">
        <Text fontSize={fontSize} fontWeight="medium" color="gray.600">
          Effort
        </Text>
        <Badge colorScheme={descriptor.colorScheme} variant={badgeVariant} fontSize={fontSize} borderRadius="full" px={3} py={0.5}>
          {badgeText}
        </Badge>
      </HStack>
      <Slider
        value={internalValue}
        min={MIN_EFFORT}
        max={MAX_EFFORT}
        step={1}
        onChange={(next) => setInternalValue(clampEffort(next))}
        onChangeEnd={(next) => {
          const clamped = clampEffort(next);
          setInternalValue(clamped);
          onChange?.(clamped);
        }}
        aria-label="Effort"
        aria-valuetext={hasDefinedValue ? `${internalValue} – ${descriptor.label}` : "Set effort"}
        focusThumbOnChange={false}
      >
        <SliderTrack bg="gray.100" borderRadius="full">
          <SliderFilledTrack
            bgGradient={hasDefinedValue ? "linear(to-r, green.400, yellow.400, orange.400, red.500)" : undefined}
            bg={hasDefinedValue ? undefined : "gray.300"}
          />
        </SliderTrack>
        <SliderThumb boxSize={size === "sm" ? 5 : 6} bg={hasDefinedValue ? "purple.500" : "gray.400"} boxShadow="md">
          <Box color="white" fontWeight="semibold" fontSize={fontSize}>
            {internalValue}
          </Box>
        </SliderThumb>
      </Slider>
      {isCompact ? null : (
        <Text mt={2} fontSize="xs" color="gray.500">
          {descriptor.label}
        </Text>
      )}
    </Box>
  );
}

export default EffortSlider;
