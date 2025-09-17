import { Badge, Box, HStack, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Text } from "@chakra-ui/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

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
  const committedValueRef = useRef(clampEffort(value ?? defaultValue));
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const hasDefinedValue = value != null;
  const sliderId = useId();

  useEffect(() => {
    const clamped = clampEffort(value ?? defaultValue);
    setInternalValue(clamped);
    committedValueRef.current = clamped;
  }, [value, defaultValue]);

  const commitValue = useCallback(
    (next) => {
      const clamped = clampEffort(next);
      setInternalValue(clamped);
      if (committedValueRef.current === clamped) return;
      committedValueRef.current = clamped;
      onChange?.(clamped);
    },
    [onChange]
  );

  const descriptor = useMemo(
    () => describeEffort(hasDefinedValue ? internalValue : null),
    [hasDefinedValue, internalValue]
  );

  const badgeText = hasDefinedValue ? `${internalValue}/10` : "Set effort";
  const badgeVariant = hasDefinedValue ? "solid" : "subtle";

  const fontSize = size === "sm" ? "xs" : "sm";
  const isSliderVisible = isExpanded || isHovering || isFocused;

  const handleToggleVisibility = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (!next) {
        setIsHovering(false);
        setIsFocused(false);
      }
      return next;
    });
  };

  return (
    <Box
      data-testid="effort-slider"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        if (!isExpanded) {
          setIsFocused(false);
        }
      }}
    >
      <HStack justify="space-between" mb={isCompact ? 1 : 2} spacing={3} align="center">
        <Text fontSize={fontSize} fontWeight="medium" color="gray.600">
          Effort
        </Text>
        <HStack spacing={2} align="center">
          <Badge
            as="button"
            type="button"
            onClick={handleToggleVisibility}
            onKeyDown={(event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                handleToggleVisibility();
              }
            }}
            colorScheme={descriptor.colorScheme}
            variant={badgeVariant}
            fontSize={fontSize}
            borderRadius="full"
            px={3}
            py={0.5}
            aria-pressed={isExpanded}
            aria-controls={sliderId}
            aria-expanded={isSliderVisible}
            title={isSliderVisible ? "Hide effort slider" : "Adjust effort"}
          >
            {badgeText}
          </Badge>
        </HStack>
      </HStack>
      <Box
        data-testid="effort-slider-panel"
        id={sliderId}
        mt={isSliderVisible ? (isCompact ? 1 : 2) : 0}
        opacity={isSliderVisible ? 1 : 0}
        transform={isSliderVisible ? "translateY(0)" : "translateY(-6px)"}
        pointerEvents={isSliderVisible ? "auto" : "none"}
        transition="opacity 0.2s ease, transform 0.2s ease, max-height 0.2s ease"
        maxHeight={isSliderVisible ? (isCompact ? "64px" : "140px") : "0px"}
        overflow="hidden"
        aria-hidden={!isSliderVisible}
      >
        <Slider
          value={internalValue}
          min={MIN_EFFORT}
          max={MAX_EFFORT}
          step={1}
          onChange={commitValue}
          onChangeEnd={commitValue}
          aria-label="Effort"
          aria-valuetext={hasDefinedValue ? `${internalValue} – ${descriptor.label}` : "Set effort"}
          focusThumbOnChange={false}
          onFocus={() => {
            setIsFocused(true);
            setIsExpanded(true);
          }}
          onBlur={(event) => {
            const nextFocusTarget = event.relatedTarget;
            if (nextFocusTarget && event.currentTarget?.contains(nextFocusTarget)) {
              return;
            }
            setIsFocused(false);
            setIsExpanded(false);
          }}
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
    </Box>
  );
}

export default EffortSlider;
