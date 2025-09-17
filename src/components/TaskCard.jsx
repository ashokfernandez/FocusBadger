import { useCallback, useEffect, useState } from "react";
import { Box, Flex, Heading, Tag, Text, Wrap, WrapItem } from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import EffortSlider, { describeEffort } from "../EffortSlider.jsx";
import { classifyTaskPriority } from "../matrix.js";

const MotionCircle = motion(Box);

export default function TaskCard({ item, onEdit, onToggleDone, onEffortChange, draggable = false }) {
  const { task, index, priority: providedPriority } = item;
  const [isPopping, setPopping] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const priority = providedPriority ?? classifyTaskPriority(task);
  const urgencyColorScheme = priority.isUrgent ? "red" : "gray";
  const importanceColorScheme = priority.isImportant ? "teal" : "gray";
  const effortDescriptor = describeEffort(task.effort);
  const hasEffort = task.effort != null;
  const projectLabel = task.project?.trim();
  const hasProject = Boolean(projectLabel);
  const hasDueDate = Boolean(task.due);

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
      bg={task.done ? "gray.100" : "white"}
      boxShadow={isDragging ? "lg" : "sm"}
      transition="all 0.15s ease"
      _hover={{ boxShadow: "lg", transform: "translateY(-2px)" }}
      display="flex"
      flexDirection="column"
      gap={2}
    >
      <Flex align="flex-start" gap={3}>
        <MotionCircle
          boxSize={8}
          minW={8}
          minH={8}
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
          <Heading as="h3" size="xs" noOfLines={2}>
            {task.title}
          </Heading>
          <Text fontSize="xs" color="gray.500" noOfLines={2} mt={0.5}>
            {task.notes ? task.notes : "Click to edit details"}
          </Text>
          {hasProject || hasDueDate ? (
            <Wrap spacing={1} mt={1} shouldWrapChildren>
              {hasProject ? (
                <WrapItem>
                  <Tag size="xs" variant="subtle" colorScheme="purple">
                    {projectLabel}
                  </Tag>
                </WrapItem>
              ) : null}
              {hasDueDate ? (
                <WrapItem>
                  <Tag size="xs" variant="subtle" colorScheme="orange">
                    Due {task.due}
                  </Tag>
                </WrapItem>
              ) : null}
            </Wrap>
          ) : null}
        </Box>
      </Flex>
      <Flex align="center" gap={2}>
        <Box
          flex="1"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <EffortSlider value={task.effort} onChange={handleEffortUpdate} size="sm" isCompact />
        </Box>
        <Text
          fontSize="xs"
          color={isDragging ? "purple.500" : hasEffort ? "gray.600" : "gray.400"}
          fontWeight={isDragging ? "semibold" : "medium"}
          whiteSpace="nowrap"
        >
          {hasEffort ? effortDescriptor.label : "Set effort"}
        </Text>
      </Flex>
      <Wrap spacing={1} shouldWrapChildren>
        <WrapItem>
          <Tag size="xs" variant="subtle" colorScheme={urgencyColorScheme}>
            {priority.urgencyLabel}
          </Tag>
        </WrapItem>
        <WrapItem>
          <Tag size="xs" variant="subtle" colorScheme={importanceColorScheme}>
            {priority.importanceLabel}
          </Tag>
        </WrapItem>
      </Wrap>
    </Box>
  );
}
