import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Flex,
  Text,
  Textarea,
  Tooltip,
  Wrap,
  WrapItem
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import EffortSlider from "../EffortSlider.jsx";
import { MATRIX_SORTS, classifyTaskPriority, getTaskMoodHighlight } from "../matrix.js";

const MotionCircle = motion(Box);

export default function TaskCard({
  item,
  onEdit,
  onRenameTitle,
  onToggleDone,
  onEffortChange,
  highlightMode,
  highlightedTaskIndexes,
  draggable = false
}) {
  const { task, index, priority: providedPriority } = item;
  const [isPopping, setPopping] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const priority = providedPriority ?? classifyTaskPriority(task);
  const urgencyColorScheme = priority.isUrgent ? "red" : "gray";
  const importanceColorScheme = priority.isImportant ? "teal" : "gray";
  const [titleValue, setTitleValue] = useState(task.title ?? "");
  const [titleError, setTitleError] = useState("");
  const [isEditingTitle, setEditingTitle] = useState(false);
  const canRenameTitle = useMemo(() => Boolean(onRenameTitle), [onRenameTitle]);
  const projectLabel = task.project?.trim();
  const hasProject = Boolean(projectLabel);
  const hasDueDate = Boolean(task.due);
  const { isPriorityHighlight, isLowEffortHighlight } = getTaskMoodHighlight(task, highlightMode, {
    priority,
    highlightedTaskIndexes,
    taskIndex: index
  });
  const highlightBorderColor = isPriorityHighlight
    ? "purple.400"
    : isLowEffortHighlight
      ? "green.300"
      : "gray.200";
  const highlightBackground = task.done
    ? "gray.100"
    : isPriorityHighlight
      ? "white"
      : isLowEffortHighlight
        ? "green.50"
        : "white";

  const handleEffortUpdate = useCallback(
    (value) => {
      onEffortChange?.(index, value);
    },
    [index, onEffortChange]
  );

  const handleDragStart = useCallback(
    (event) => {
      if (!draggable || !event.dataTransfer) return;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
      setDragging(true);
    },
    [draggable, index]
  );

  const handleDragEnd = useCallback(() => {
    setDragging(false);
  }, []);

  const handleToggle = useCallback(
    (event) => {
      event.stopPropagation();
      onToggleDone(index);
      setPopping(true);
    },
    [index, onToggleDone]
  );

  useEffect(() => {
    if (!isPopping) return;
    const timeout = setTimeout(() => setPopping(false), 220);
    return () => clearTimeout(timeout);
  }, [isPopping]);

  useEffect(() => {
    setTitleValue(task.title ?? "");
    setTitleError("");
  }, [task.title]);

  const handleTitleSubmit = useCallback(
    (nextValue) => {
      if (!canRenameTitle) return;
      const result = onRenameTitle?.(index, nextValue);
      if (!result?.ok) {
        setTitleError(result?.message ?? "Unable to rename task");
        setTitleValue(task.title ?? "");
        setEditingTitle(false);
        return;
      }
      setTitleValue(result.name ?? (nextValue ?? "").trim());
      setTitleError("");
      setEditingTitle(false);
    },
    [canRenameTitle, index, onRenameTitle, task.title]
  );

  return (
    <Box
      as="li"
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => {
        if (isDragging || isEditingTitle) return;
        onEdit(index);
      }}
      cursor={draggable ? "grab" : "pointer"}
      borderWidth="1px"
      borderRadius="xl"
      p={3}
      bg={highlightBackground}
      borderColor={highlightBorderColor}
      boxShadow={isDragging ? "lg" : isPriorityHighlight ? "lg" : isLowEffortHighlight ? "md" : "sm"}
      transition="all 0.15s ease"
      _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
      display="flex"
      flexDirection="column"
      gap={2.5}
      h="full"
    >
      <Flex align="flex-start" gap={3}>
        <MotionCircle
          boxSize={6}
          minW={6}
          minH={6}
          flexShrink={0}
          borderRadius="full"
          borderWidth="2px"
          borderColor={task.done ? "green.400" : "gray.300"}
          bg={task.done ? "green.400" : "white"}
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="white"
          role="button"
          aria-pressed={task.done}
          onClick={handleToggle}
          whileTap={{ scale: 0.9 }}
          animate={isPopping ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : {}}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {task.done ? <CheckIcon w={3} h={3} /> : null}
        </MotionCircle>
        <Box flex="1" minW={0}>
          <Wrap spacing={1} shouldWrapChildren mb={2}>
            <WrapItem>
              <Badge
                colorScheme={urgencyColorScheme}
                variant="subtle"
                fontSize="2xs"
                fontWeight="semibold"
                borderRadius="full"
                px={2}
                py={0.5}
              >
                {priority.urgencyLabel}
              </Badge>
            </WrapItem>
            <WrapItem>
              <Badge
                colorScheme={importanceColorScheme}
                variant="subtle"
                fontSize="2xs"
                fontWeight="semibold"
                borderRadius="full"
                px={2}
                py={0.5}
              >
                {priority.importanceLabel}
              </Badge>
            </WrapItem>
          </Wrap>
          <Box onClick={(event) => event.stopPropagation()}>
            {isEditingTitle ? (
              <Textarea
                value={titleValue}
                onChange={(event) => {
                  setTitleValue(event.target.value);
                  setTitleError("");
                }}
                autoFocus
                variant="unstyled"
                fontSize="sm"
                fontWeight="semibold"
                resize="vertical"
                rows={Math.max(2, titleValue.split("\n").length)}
                borderWidth="1px"
                borderColor="purple.400"
                borderRadius="md"
                px={2}
                py={1}
                onMouseDown={(event) => event.stopPropagation()}
                onBlur={() => handleTitleSubmit(titleValue)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setTitleValue(task.title ?? "");
                    setTitleError("");
                    setEditingTitle(false);
                    return;
                  }
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleTitleSubmit(titleValue);
                  }
                }}
              />
            ) : (
              <Tooltip label={canRenameTitle ? "Rename" : undefined} placement="top" isDisabled={!canRenameTitle}>
                <Text
                  as="span"
                  display="inline-block"
                  fontSize="sm"
                  fontWeight="semibold"
                  lineHeight="short"
                  wordBreak="break-word"
                  cursor={canRenameTitle ? "text" : "pointer"}
                  onClick={(event) => {
                    if (!canRenameTitle) return;
                    event.stopPropagation();
                    setEditingTitle(true);
                    setTitleValue(task.title ?? "");
                    setTitleError("");
                  }}
                >
                  {titleValue || "Untitled"}
                </Text>
              </Tooltip>
            )}
          </Box>
          {titleError ? (
            <Text fontSize="xs" color="red.500" mt={1}>
              {titleError}
            </Text>
          ) : null}
          {(hasProject || hasDueDate) && (
            <Flex
              mt={1}
              gap={2}
              align="center"
              wrap="wrap"
              fontSize="xs"
              color="gray.500"
            >
              {hasProject ? (
                <Text fontWeight="semibold" color="purple.500" noOfLines={1}>
                  {projectLabel}
                </Text>
              ) : null}
              {hasProject && hasDueDate ? (
                <Box as="span" color="gray.400">
                  •
                </Box>
              ) : null}
              {hasDueDate ? (
                <Text color="orange.500" noOfLines={1}>
                  Due {task.due}
                </Text>
              ) : null}
            </Flex>
          )}
        </Box>
      </Flex>
      <Box
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <EffortSlider value={task.effort} onChange={handleEffortUpdate} size="sm" isCompact showDescriptor />
      </Box>
    </Box>
  );
}
