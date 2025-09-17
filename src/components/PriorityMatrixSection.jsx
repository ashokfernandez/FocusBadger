import { Box, Button, HStack, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import MatrixQuadrant from "./MatrixQuadrant.jsx";
import { MATRIX_GRID_COLUMNS } from "../layout.js";

export default function PriorityMatrixSection({
  matrix,
  sortMode,
  highlightedTaskIndexes,
  onEditTask,
  onRenameTask,
  onToggleTask,
  onDropTask,
  onEffortChange,
  onAddTask,
  onLoadDemo
}) {
  const isEmpty =
    !matrix.today.length &&
    !matrix.schedule.length &&
    !matrix.delegate.length &&
    !matrix.consider.length;

  if (isEmpty) {
    return (
      <Box
        borderWidth="1px"
        borderRadius="2xl"
        borderStyle="dashed"
        borderColor="gray.200"
        py={{ base: 10, md: 16 }}
        px={{ base: 6, md: 12 }}
        textAlign="center"
        bg="white"
      >
        <Stack spacing={4} align="center">
          <Heading size="md">Plan your first move</Heading>
          <Text maxW="lg" color="gray.500">
            Start by adding a task or load our sample workspace to see how priorities snap into place.
          </Text>
          <HStack spacing={3} flexWrap="wrap" justify="center">
            {onAddTask ? (
              <Button colorScheme="purple" onClick={onAddTask} size="sm">
                Add a task
              </Button>
            ) : null}
            {onLoadDemo ? (
              <Button onClick={onLoadDemo} size="sm" variant="ghost" colorScheme="purple">
                Load demo data
              </Button>
            ) : null}
          </HStack>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <SimpleGrid columns={MATRIX_GRID_COLUMNS} spacing={6}>
        <MatrixQuadrant
          title="Why aren't you doing this now?"
          subtitle="Urgent and important"
          colorScheme="red"
          items={matrix.today}
          highlightMode={sortMode}
          highlightedTaskIndexes={highlightedTaskIndexes}
          onEditTask={onEditTask}
          onRenameTask={onRenameTask}
          onToggleTask={onToggleTask}
          onDropTask={onDropTask}
          quadrantKey="today"
          onEffortChange={onEffortChange}
        />
        <MatrixQuadrant
          title="When can you do this later?"
          subtitle="Important, not urgent"
          colorScheme="purple"
          items={matrix.schedule}
          highlightMode={sortMode}
          highlightedTaskIndexes={highlightedTaskIndexes}
          onEditTask={onEditTask}
          onRenameTask={onRenameTask}
          onToggleTask={onToggleTask}
          emptyMessage="Plan time for these when you can."
          onDropTask={onDropTask}
          quadrantKey="schedule"
          onEffortChange={onEffortChange}
        />
        <MatrixQuadrant
          title="Who can help you with this?"
          subtitle="Urgent, not important"
          colorScheme="orange"
          items={matrix.delegate}
          highlightMode={sortMode}
          highlightedTaskIndexes={highlightedTaskIndexes}
          onEditTask={onEditTask}
          onRenameTask={onRenameTask}
          onToggleTask={onToggleTask}
          emptyMessage="Nothing to hand off right now."
          onDropTask={onDropTask}
          quadrantKey="delegate"
          onEffortChange={onEffortChange}
        />
        <MatrixQuadrant
          title="Why are you considering this?"
          subtitle="Not urgent, not important"
          colorScheme="gray"
          items={matrix.consider}
          highlightMode={sortMode}
          highlightedTaskIndexes={highlightedTaskIndexes}
          onEditTask={onEditTask}
          onRenameTask={onRenameTask}
          onToggleTask={onToggleTask}
          emptyMessage="😌 Nothing tempting here — great job."
          onDropTask={onDropTask}
          quadrantKey="consider"
          onEffortChange={onEffortChange}
        />
      </SimpleGrid>
    </Box>
  );
}
