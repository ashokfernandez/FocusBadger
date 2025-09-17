import { Box, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import MatrixQuadrant from "./MatrixQuadrant.jsx";
import MatrixSortControl from "./MatrixSortControl.jsx";
import { MATRIX_GRID_COLUMNS } from "../layout.js";
import { PRIORITY_MATRIX_STACK_SPACING } from "./componentTokens.js";

export default function PriorityMatrixSection({
  matrix,
  sortMode,
  onSortModeChange,
  onEditTask,
  onToggleTask,
  onDropTask,
  onEffortChange
}) {
  return (
    <Box>
      <Stack spacing={PRIORITY_MATRIX_STACK_SPACING} mb={4}>
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ base: "flex-start", md: "center" }}
          justify="space-between"
          gap={{ base: 3, md: 4 }}
        >
          <Box>
            <Heading size="md">Priority matrix</Heading>
            <Text fontSize="sm" color="gray.500">
              Use the workspace filters above to zero in on the projects that matter most, then sort to decide what to tackle
              right now.
            </Text>
          </Box>
          <Box mt={{ base: 1, md: 0 }}>
            <MatrixSortControl value={sortMode} onChange={onSortModeChange} />
          </Box>
        </Flex>
      </Stack>
      <SimpleGrid columns={MATRIX_GRID_COLUMNS} spacing={6}>
        <MatrixQuadrant
          title="Why aren't you doing this now?"
          subtitle="Urgent and important"
          colorScheme="red"
          items={matrix.today}
          onEditTask={onEditTask}
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
          onEditTask={onEditTask}
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
          onEditTask={onEditTask}
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
          onEditTask={onEditTask}
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
