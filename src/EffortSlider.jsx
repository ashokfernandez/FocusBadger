import { Badge, Box, HStack, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Text } from "@chakra-ui/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  clampEffort,
  DEFAULT_EFFORT,
  describeEffort,
  shouldCommitEffortChange,
  MIN_EFFORT,
  MAX_EFFORT
} from "./effortMath.js";
import { colors } from "./theme/tokens.js";

export function EffortSlider({
  value,
  onChange,
  size = "md",
  isCompact = false,
  defaultValue = DEFAULT_EFFORT,
  showDescriptor = true,
  isAlwaysVisible = false
}) {
  const [internalValue, setInternalValue] = useState(() => clampEffort(value ?? defaultValue, defaultValue));
  const committedValueRef = useRef(clampEffort(value ?? defaultValue, defaultValue));
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const hasDefinedValue = value != null;
  const sliderId = useId();

  useEffect(() => {
    const clamped = clampEffort(value ?? defaultValue, defaultValue);
    setInternalValue(clamped);
    committedValueRef.current = clamped;
  }, [value, defaultValue]);

  const descriptor = useMemo(
    () => describeEffort(hasDefinedValue ? internalValue : null),
    [hasDefinedValue, internalValue]
  );

  const badgeText = hasDefinedValue ? `${internalValue}/10` : "Set effort";
  const badgeVariant = hasDefinedValue ? "solid" : "subtle";

  const fontSize = size === "sm" ? "xs" : "sm";
  const isSliderVisible = isAlwaysVisible || isExpanded || isHovering || isFocused;
  const compactMaxHeight = showDescriptor ? "112px" : "64px";

  const handleSliderChange = useCallback((next) => {
    setInternalValue((prev) => clampEffort(next, prev));
  }, []);

  const handleSliderCommit = useCallback(
    (next) => {
      setInternalValue((prev) => {
        const clamped = clampEffort(next, prev);
        if (!shouldCommitEffortChange(committedValueRef.current, clamped)) {
          return clamped;
        }
        committedValueRef.current = clamped;
        onChange?.(clamped);
        return clamped;
      });
    },
    [onChange]
  );

  const handleToggleVisibility = useCallback(() => {
    if (isAlwaysVisible) return;
    setIsExpanded((prev) => {
      const next = !prev;
      if (!next) {
        setIsHovering(false);
        setIsFocused(false);
      }
      return next;
    });
  }, [isAlwaysVisible]);

  const handleBadgeKeyDown = useCallback(
    (event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        handleToggleVisibility();
      }
    },
    [handleToggleVisibility]
  );

  const toggleProps = isAlwaysVisible
    ? { as: "span", cursor: "default" }
    : {
        as: "button",
        type: "button",
        cursor: "pointer",
        onClick: handleToggleVisibility,
        onKeyDown: handleBadgeKeyDown
      };

  return (
    <Box
      data-testid="effort-slider"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        if (!isExpanded && !isAlwaysVisible) {
          setIsFocused(false);
        }
      }}
    >
      <HStack justify="space-between" mb={isCompact ? 1 : 2} spacing={3} align="center">
        <Text fontSize={fontSize} fontWeight="medium" color={colors.textMuted}>
          Effort
        </Text>
        <HStack spacing={2} align="center">
          <Badge
            {...toggleProps}
            colorScheme={descriptor.colorScheme}
            variant={badgeVariant}
            fontSize={fontSize}
            borderRadius="full"
            px={3}
            py={0.5}
            aria-pressed={isAlwaysVisible ? undefined : isExpanded}
            aria-controls={sliderId}
            aria-expanded={isSliderVisible}
            title={
              isAlwaysVisible
                ? "Effort level"
                : isSliderVisible
                ? "Hide effort slider"
                : "Adjust effort"
            }
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
        maxHeight={isSliderVisible ? (isCompact ? compactMaxHeight : "140px") : "0px"}
        overflow="hidden"
        aria-hidden={!isSliderVisible}
      >
        <Slider
          value={internalValue}
          min={MIN_EFFORT}
          max={MAX_EFFORT}
          step={1}
          onChange={handleSliderChange}
          onChangeEnd={handleSliderCommit}
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
          <SliderTrack bg={colors.surfaceSubtle} borderRadius="full">
            <SliderFilledTrack
              bgGradient={hasDefinedValue ? "linear(to-r, green.400, yellow.400, orange.400, red.500)" : undefined}
              bg={hasDefinedValue ? undefined : colors.borderDefault}
            />
          </SliderTrack>
          <SliderThumb boxSize={size === "sm" ? 5 : 6} bg={hasDefinedValue ? colors.interactiveAccent : colors.borderEmphasis} boxShadow="md">
            <Box color="white" fontWeight="semibold" fontSize={fontSize}>
              {internalValue}
            </Box>
          </SliderThumb>
        </Slider>
        {showDescriptor ? (
          <Text mt={isCompact ? 1.5 : 2} fontSize="xs" color={colors.textSubtle}>
            {descriptor.label}
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}

export default EffortSlider;
