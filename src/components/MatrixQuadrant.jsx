import { useCallback, useState } from "react";
import { Badge, Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import TaskCard from "./TaskCard.jsx";
import { MATRIX_SORTS } from "../matrix.js";

export default function MatrixQuadrant({
  title,
  subtitle,
  colorScheme,
  items,
  emptyMessage,
  onEditTask,
  onToggleTask,
  onDropTask,
  quadrantKey,
  onEffortChange,
  highlightMode
}) {
  const [isHover, setHover] = useState(false);
  const baseGradient = `linear(to-br, ${colorScheme}.50, white)`;
  const hoverGradient = `linear(to-br, ${colorScheme}.100, white)`;
  const isPriorityHighlight = highlightMode === MATRIX_SORTS.SCORE && quadrantKey === "today";
  const highlightedGradient = `linear(to-br, ${colorScheme}.100, white)`;

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
      borderColor={isPriorityHighlight ? `${colorScheme}.400` : isHover ? `${colorScheme}.300` : "gray.100"}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Flex align="flex-start" justify="space-between" gap={3}>
        <Box>
          <Heading size="sm">{title}</Heading>
          {subtitle ? (
            <Text fontSize="sm" color="gray.500">
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
              onToggleDone={onToggleTask}
              onEffortChange={onEffortChange}
              highlightMode={highlightMode}
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
          borderColor="gray.200"
          color="gray.400"
          fontSize="sm"
        >
          {emptyMessage ?? "Nothing here right now."}
        </Flex>
      )}
    </Box>
  );
}
