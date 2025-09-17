import { useCallback, useEffect, useState } from "react";
import { Badge, Box, Flex, Heading, Text, Wrap, WrapItem } from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import EffortSlider from "../EffortSlider.jsx";
import { MATRIX_SORTS, classifyTaskPriority } from "../matrix.js";

const MotionCircle = motion(Box);

export default function TaskCard({
  item,
  onEdit,
  onToggleDone,
  onEffortChange,
  highlightMode,
  draggable = false
}) {
  const { task, index, priority: providedPriority } = item;
  const [isPopping, setPopping] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const priority = providedPriority ?? classifyTaskPriority(task);
  const urgencyColorScheme = priority.isUrgent ? "red" : "gray";
  const importanceColorScheme = priority.isImportant ? "teal" : "gray";
  const hasEffort = task.effort != null;
  const projectLabel = task.project?.trim();
  const hasProject = Boolean(projectLabel);
  const hasDueDate = Boolean(task.due);
  const isPriorityHighlight =
    highlightMode === MATRIX_SORTS.SCORE && priority.isUrgent && priority.isImportant && !task.done;
  const isLowEffortHighlight =
    highlightMode === MATRIX_SORTS.LOW_EFFORT && hasEffort && task.effort <= 3 && !task.done;
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

  return (
    <Box
      as="li"
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => {
        if (isDragging) return;
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
          <Heading as="h3" size="sm" noOfLines={2}>
            {task.title}
          </Heading>
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
