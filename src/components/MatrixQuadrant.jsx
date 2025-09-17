import { useCallback, useMemo, useState } from "react";
import { Badge, Box, Flex, Heading, Stack, Text, useToken } from "@chakra-ui/react";
import TaskCard from "./TaskCard.jsx";

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
  onEffortChange
}) {
  const [isHover, setHover] = useState(false);
  const [accentColor, borderHighlight] = useToken(
    "colors",
    useMemo(() => [`${colorScheme}.50`, `${colorScheme}.300`], [colorScheme])
  );

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
      bg="white"
      p={5}
      boxShadow={isHover ? "xl" : "md"}
      display="flex"
      flexDirection="column"
      gap={4}
      borderColor={isHover ? borderHighlight : "gray.100"}
      backgroundImage={isHover && accentColor ? `linear-gradient(135deg, ${accentColor}, white)` : undefined}
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
