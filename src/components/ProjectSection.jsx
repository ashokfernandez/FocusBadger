import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Box, Flex, SimpleGrid, Text, Textarea, Tooltip } from "@chakra-ui/react";
import TaskCard from "./TaskCard.jsx";
import { getProjectMoodHighlight } from "../matrix.js";

export default function ProjectSection({
  name,
  projectKey,
  items,
  onRenameProject,
  onRenameTask,
  onEditTask,
  onToggleTask,
  onDropProject,
  onEffortChange,
  highlightMode
}) {
  const allowDrop = Boolean(onDropProject);
  const [isHover, setHover] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState("");
  const [isEditing, setEditing] = useState(false);
  const canRename = useMemo(() => Boolean(projectKey && onRenameProject), [projectKey, onRenameProject]);
  const { hasPriorityHighlight, hasLowEffortHighlight } = useMemo(
    () => getProjectMoodHighlight(items, highlightMode),
    [items, highlightMode]
  );
  const projectBorderColor = hasPriorityHighlight
    ? "purple.400"
    : hasLowEffortHighlight
      ? "green.300"
      : "gray.100";
  const projectBackground = hasLowEffortHighlight && !hasPriorityHighlight ? "green.50" : "white";
  const projectShadow = hasPriorityHighlight ? "xl" : hasLowEffortHighlight ? "lg" : "md";

  useEffect(() => {
    setValue(name);
    setError("");
    setEditing(false);
  }, [name]);

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

  const handleRename = useCallback(
    (nextValue) => {
      if (!canRename) return;
      const trimmed = nextValue.trim();
      if (!trimmed || trimmed === name) {
        setValue(name);
        setError("");
        setEditing(false);
        return;
      }
      const result = onRenameProject?.(name, trimmed);
      if (!result?.ok) {
        setValue(name);
        setError(result?.message ?? "Unable to rename project");
        setEditing(false);
        return;
      }
      setValue(result.name ?? trimmed);
      setError("");
      setEditing(false);
    },
    [canRename, name, onRenameProject]
  );

  return (
    <Box
      borderWidth="1px"
      borderRadius="2xl"
      bg={allowDrop && isHover ? "purple.50" : projectBackground}
      p={5}
      boxShadow={allowDrop && isHover ? "xl" : projectShadow}
      borderColor={allowDrop && isHover ? "purple.400" : projectBorderColor}
      borderStyle={allowDrop ? "dashed" : "solid"}
      onDragOver={allowDrop ? handleDragOver : undefined}
      onDragLeave={allowDrop ? handleDragLeave : undefined}
      onDrop={allowDrop ? handleDrop : undefined}
      transition="border-color 0.15s ease, box-shadow 0.15s ease"
    >
      <Flex align="center" justify="space-between" mb={4} gap={3}>
        <Box flex="1" minW={0}>
          {isEditing ? (
            <Textarea
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError("");
              }}
              autoFocus
              variant="unstyled"
              fontSize="md"
              fontWeight="semibold"
              resize="vertical"
              rows={Math.max(2, value.split("\n").length)}
              borderWidth="1px"
              borderColor="purple.400"
              borderRadius="md"
              px={3}
              py={2}
              onBlur={() => handleRename(value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setValue(name);
                  setError("");
                  setEditing(false);
                  return;
                }
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleRename(value);
                }
              }}
            />
          ) : (
            <Tooltip label={canRename ? "Rename" : undefined} placement="top" isDisabled={!canRename}>
              <Text
                as="span"
                display="inline-block"
                fontSize="md"
                fontWeight="semibold"
                wordBreak="break-word"
                cursor={canRename ? "text" : "default"}
                color={canRename ? "purple.600" : "inherit"}
                onClick={() => {
                  if (!canRename) return;
                  setEditing(true);
                  setValue(name);
                  setError("");
                }}
              >
                {value || "Untitled project"}
              </Text>
            </Tooltip>
          )}
        </Box>
        <Badge colorScheme="gray">{items.length}</Badge>
      </Flex>
      {error ? (
        <Text fontSize="xs" color="red.500" mb={3}>
          {error}
        </Text>
      ) : null}
      {items.length ? (
        <SimpleGrid
          as="ul"
          columns={{ base: 1, md: 2, xl: 3 }}
          spacing={3}
          listStyleType="none"
          m={0}
          p={0}
        >
          {items.map((item) => (
            <TaskCard
              key={item.index}
              item={item}
              onEdit={onEditTask}
              onRenameTitle={onRenameTask}
              onToggleDone={onToggleTask}
              onEffortChange={onEffortChange}
              draggable={allowDrop}
              highlightMode={highlightMode}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Text fontSize="sm" color="gray.400">
          {projectKey ? `Drag tasks here to assign to ${name}.` : "Drag tasks here to keep tasks unassigned."}
        </Text>
      )}
    </Box>
  );
}
