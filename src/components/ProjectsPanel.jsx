import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import ProjectSection from "./ProjectSection.jsx";
import { PROJECT_PANEL_STACK_SPACING } from "./componentTokens.js";

export default function ProjectsPanel({
  projectGroups,
  onManageProjects,
  onAddTask,
  onRenameProject,
  onRenameTask,
  onEditTask,
  onToggleTask,
  onDropProject,
  onEffortChange,
  highlightMode,
  highlightedTaskIndexes
}) {
  return (
    <Box>
      <Flex justify={{ base: "flex-start", md: "flex-end" }} mb={4}>
        <Button
          leftIcon={<EditIcon />}
          size="sm"
          variant="outline"
          colorScheme="purple"
          onClick={onManageProjects}
        >
          Manage projects
        </Button>
      </Flex>
      {projectGroups.length ? (
        <Stack spacing={PROJECT_PANEL_STACK_SPACING}>
          {projectGroups.map(({ name, projectKey, items }) => (
            <ProjectSection
              key={projectKey ?? "__unassigned"}
              name={name}
              projectKey={projectKey}
              items={items}
              onRenameProject={onRenameProject}
              onRenameTask={onRenameTask}
              onEditTask={onEditTask}
              onToggleTask={onToggleTask}
              onDropProject={onDropProject}
              onEffortChange={onEffortChange}
              highlightMode={highlightMode}
              highlightedTaskIndexes={highlightedTaskIndexes}
            />
          ))}
        </Stack>
      ) : (
        <Box
          borderWidth="1px"
          borderRadius="2xl"
          borderStyle="dashed"
          borderColor="gray.200"
          py={{ base: 10, md: 14 }}
          px={{ base: 6, md: 10 }}
          textAlign="center"
          bg="white"
        >
          <Stack spacing={4} align="center">
            <Text fontSize="lg" fontWeight="semibold">
              No projects yet
            </Text>
            <Text maxW="md" color="gray.500">
              Add a task to start organising by project. We'll group everything automatically once tasks arrive.
            </Text>
            {onAddTask ? (
              <Button colorScheme="purple" size="sm" onClick={onAddTask}>
                Add a task
              </Button>
            ) : null}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
