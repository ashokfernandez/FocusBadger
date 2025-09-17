import { useCallback, useState } from "react";
import { Badge, Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import TaskCard from "./TaskCard.jsx";

export default function ProjectSection({
  name,
  projectKey,
  items,
  onEditTask,
  onToggleTask,
  onDropProject,
  onEffortChange
}) {
  const allowDrop = Boolean(onDropProject);
  const [isHover, setHover] = useState(false);

  const handleDragOver = useCallback(
    (event) => {
      if (!allowDrop) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      if (!isHover) setHover(true);
    },
    [allowDrop, isHover]
  );

  const handleDragLeave = useCallback(() => {
    setHover(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      if (!allowDrop) return;
      event.preventDefault();
      setHover(false);
      const raw = event.dataTransfer?.getData("text/plain");
      if (!raw) return;
      onDropProject?.(projectKey ?? undefined, raw);
    },
    [allowDrop, onDropProject, projectKey]
  );

  return (
    <Box
      borderWidth="1px"
      borderRadius="2xl"
      bg="white"
      p={5}
      boxShadow={allowDrop && isHover ? "xl" : "md"}
      borderColor={allowDrop && isHover ? "purple.400" : "gray.100"}
      borderStyle={allowDrop ? "dashed" : "solid"}
      onDragOver={allowDrop ? handleDragOver : undefined}
      onDragLeave={allowDrop ? handleDragLeave : undefined}
      onDrop={allowDrop ? handleDrop : undefined}
      transition="border-color 0.15s ease, box-shadow 0.15s ease"
    >
      <Flex align="center" justify="space-between" mb={4}>
        <Heading size="sm">{name}</Heading>
        <Badge colorScheme="gray">{items.length}</Badge>
      </Flex>
      {items.length ? (
        <Stack as="ul" spacing={3}>
          {items.map((item) => (
            <TaskCard
              key={item.index}
              item={item}
              onEdit={onEditTask}
              onToggleDone={onToggleTask}
              onEffortChange={onEffortChange}
              draggable={allowDrop}
            />
          ))}
        </Stack>
      ) : (
        <Text fontSize="sm" color="gray.400">
          {projectKey ? `Drag tasks here to assign to ${name}.` : "Drag tasks here to keep tasks unassigned."}
        </Text>
      )}
    </Box>
  );
}
