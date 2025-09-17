import { useCallback, useEffect, useState } from "react";
import { Box, Flex, Heading, HStack, Tag, Text, Wrap } from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import EffortSlider from "../EffortSlider.jsx";
import { deriveTaskPriority } from "../utils/taskPriority.js";

const MotionCircle = motion(Box);

export default function TaskCard({ item, onEdit, onToggleDone, onEffortChange, draggable = false }) {
  const { task, index } = item;
  const [isPopping, setPopping] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const priority = deriveTaskPriority(task);

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
      gap={2.5}
    >
      <Flex align="flex-start" gap={3}>
        <MotionCircle
          boxSize={7}
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
          flexShrink={0}
        >
          {task.done ? <CheckIcon w={3} h={3} /> : null}
        </MotionCircle>
        <Box flex="1" minW={0}>
          <Flex
            align="flex-start"
            justify="space-between"
            gap={2}
            wrap="wrap"
          >
            <Heading
              as="h3"
              fontSize="sm"
              lineHeight="short"
              fontWeight="semibold"
              flex="1"
              minW={0}
              noOfLines={2}
            >
              {task.title}
            </Heading>
            <HStack spacing={1} flexWrap="wrap" justify="flex-end">
              <Tag
                size="sm"
                colorScheme={priority.urgencyColorScheme}
                variant="subtle"
                borderRadius="full"
              >
                {priority.urgencyLabel}
              </Tag>
              <Tag
                size="sm"
                colorScheme={priority.importanceColorScheme}
                variant="subtle"
                borderRadius="full"
              >
                {priority.importanceLabel}
              </Tag>
            </HStack>
          </Flex>
          <Text fontSize="xs" color="gray.500" mt={1} noOfLines={2}>
            {task.notes ? task.notes : "Click to edit details"}
          </Text>
        </Box>
      </Flex>
      <Box
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        borderRadius="lg"
        bg={task.done ? "white" : "gray.50"}
        p={2}
      >
        <EffortSlider value={task.effort} onChange={handleEffortUpdate} size="sm" isCompact />
      </Box>
      {task.project || task.due ? (
        <Wrap spacing={2} shouldWrapChildren>
          {task.project ? (
            <Tag size="sm" colorScheme="purple" variant="subtle">
              {task.project}
            </Tag>
          ) : null}
          {task.due ? (
            <Tag size="sm" colorScheme="orange" variant="subtle">
              Due {task.due}
            </Tag>
          ) : null}
        </Wrap>
      ) : null}
    </Box>
  );
}
