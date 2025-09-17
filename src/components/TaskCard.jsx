import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Flex, HStack, Stack, Tag, Text } from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import EffortSlider from "../EffortSlider.jsx";
import { getImportanceStatus, getUrgencyStatus } from "../utils/prioritization.js";

const MotionCircle = motion(Box);

export default function TaskCard({ item, onEdit, onToggleDone, onEffortChange, draggable = false }) {
  const { task, index } = item;
  const [isPopping, setPopping] = useState(false);
  const [isDragging, setDragging] = useState(false);

  const urgencyChip = useMemo(() => getUrgencyStatus(task), [task]);
  const importanceChip = useMemo(() => getImportanceStatus(task), [task]);

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
      p={3.5}
      bg={task.done ? "gray.50" : "white"}
      boxShadow={isDragging ? "xl" : "md"}
      transition="all 0.15s ease"
      _hover={{ boxShadow: "xl", transform: "translateY(-2px)", borderColor: "blue.200" }}
      display="flex"
      flexDirection="column"
      gap={3}
    >
      <Flex align="flex-start" gap={3}>
        <MotionCircle
          w={8}
          h={8}
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
        <Stack spacing={2} flex="1" minWidth={0} pt={0.5}>
          <Text fontSize="sm" fontWeight="semibold" noOfLines={2}>
            {task.title}
          </Text>
          <Text fontSize="xs" color="gray.500" noOfLines={2}>
            {task.notes ? task.notes : "Add more context to keep future you on track."}
          </Text>
          <HStack spacing={2} flexWrap="wrap">
            {urgencyChip ? (
              <Tag size="sm" variant="subtle" colorScheme={urgencyChip.colorScheme}>
                {urgencyChip.label}
              </Tag>
            ) : null}
            {importanceChip ? (
              <Tag size="sm" variant="subtle" colorScheme={importanceChip.colorScheme}>
                {importanceChip.label}
              </Tag>
            ) : null}
            {task.project ? (
              <Tag size="sm" variant="subtle" colorScheme="purple">
                {task.project}
              </Tag>
            ) : null}
            {task.due ? (
              <Tag size="sm" variant="subtle" colorScheme="orange">
                Due {task.due}
              </Tag>
            ) : null}
          </HStack>
        </Stack>
      </Flex>
      <Box
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <EffortSlider value={task.effort} onChange={handleEffortUpdate} size="sm" isCompact />
      </Box>
    </Box>
  );
}
