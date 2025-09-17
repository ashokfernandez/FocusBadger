import { useCallback, useState } from "react";
import { Badge, Box, Flex, Heading, Stack, Text, useColorMode } from "@chakra-ui/react";
import TaskCard from "./TaskCard.jsx";
import { MATRIX_SORTS } from "../matrix.js";
import { colors } from "../theme/tokens.js";

const toCssVar = (token) => `var(--chakra-colors-${token.replace(/\./g, "-")})`;

export default function MatrixQuadrant({
  title,
  subtitle,
  colorScheme,
  items,
  emptyMessage,
  onEditTask,
  onRenameTask,
  onToggleTask,
  onDropTask,
  quadrantKey,
  onEffortChange,
  highlightMode,
  highlightedTaskIndexes
}) {
  const [isHover, setHover] = useState(false);
  const { colorMode } = useColorMode();
  const gradientTarget = toCssVar(colors.surfaceBase);
  const baseStop = `${colorScheme}.${colorMode === "dark" ? "900" : "50"}`;
  const hoverStop = `${colorScheme}.${colorMode === "dark" ? "800" : "100"}`;
  const highlightStop = `${colorScheme}.${colorMode === "dark" ? "700" : "100"}`;
  const baseGradient = `linear(to-br, ${toCssVar(baseStop)}, ${gradientTarget})`;
  const hoverGradient = `linear(to-br, ${toCssVar(hoverStop)}, ${gradientTarget})`;
  const isPriorityHighlight = highlightMode === MATRIX_SORTS.SCORE && quadrantKey === "today";
  const highlightedGradient = `linear(to-br, ${toCssVar(highlightStop)}, ${gradientTarget})`;
  const hoverBorderColor = toCssVar(`${colorScheme}.${colorMode === "dark" ? "400" : "300"}`);

  const handleDragOver = useCallback(
    (event) => {
      if (!onDropTask) return;
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
      if (!isHover) setHover(true);
    },
    [isHover, onDropTask]
  );

  const handleDragLeave = useCallback(() => {
    setHover(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      if (!onDropTask) return;
      event.preventDefault();
      setHover(false);
      const raw = event.dataTransfer?.getData("text/plain");
      if (!raw) return;
      onDropTask(quadrantKey, raw);
    },
    [onDropTask, quadrantKey]
  );

  return (
    <Box
      borderWidth="1px"
      borderRadius="2xl"
      bgGradient={isPriorityHighlight ? highlightedGradient : isHover ? hoverGradient : baseGradient}
      p={5}
      boxShadow={isPriorityHighlight || isHover ? "lg" : "md"}
      display="flex"
      flexDirection="column"
      gap={3.5}
      borderColor={isPriorityHighlight ? colors.borderPriority : isHover ? hoverBorderColor : colors.borderSubtle}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Flex align="flex-start" justify="space-between" gap={3}>
        <Box>
          <Heading size="sm">{title}</Heading>
          {subtitle ? (
            <Text fontSize="sm" color={colors.textMuted}>
              {subtitle}
            </Text>
          ) : null}
        </Box>
        <Badge colorScheme={colorScheme} variant="subtle">
          {items.length}
        </Badge>
      </Flex>
      {items.length ? (
        <Stack as="ul" spacing={2.5}>
          {items.map((item) => (
            <TaskCard
              key={item.index}
              item={item}
              onEdit={onEditTask}
              onRenameTitle={onRenameTask}
              onToggleDone={onToggleTask}
              onEffortChange={onEffortChange}
              highlightMode={highlightMode}
              highlightedTaskIndexes={highlightedTaskIndexes}
              draggable={Boolean(onDropTask)}
            />
          ))}
        </Stack>
      ) : (
        <Flex
          align="center"
          justify="center"
          py={8}
          borderRadius="lg"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor={colors.matrixEmptyBorder}
          color={colors.matrixEmptyText}
          fontSize="sm"
        >
          {emptyMessage ?? "Nothing here right now."}
        </Flex>
      )}
    </Box>
  );
}
