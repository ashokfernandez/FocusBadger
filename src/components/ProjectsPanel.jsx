import { Box, Flex, Heading, IconButton, Stack, Text, Tooltip } from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import ProjectSection from "./ProjectSection.jsx";
import { PROJECT_PANEL_STACK_SPACING } from "./componentTokens.js";

export default function ProjectsPanel({
  projectGroups,
  onManageProjects,
  onEditTask,
  onToggleTask,
  onDropProject,
  onEffortChange
}) {
  return (
    <Box>
      <Stack spacing={3} mb={4}>
        <Flex align="center" justify="space-between">
          <Box>
            <Heading size="md">Projects</Heading>
            <Text fontSize="sm" color="gray.500">
              Organise tasks by project. Filters and sorting follow the workspace toolbar above so every section stays in sync.
            </Text>
          </Box>
          <Tooltip label="Manage projects" placement="top">
            <IconButton
              aria-label="Manage projects"
              icon={<EditIcon />}
              size="sm"
              variant="ghost"
              onClick={onManageProjects}
            />
          </Tooltip>
        </Flex>
      </Stack>
      <Stack spacing={PROJECT_PANEL_STACK_SPACING}>
        {projectGroups.map(({ name, projectKey, items }) => (
          <ProjectSection
            key={projectKey ?? "__unassigned"}
            name={name}
            projectKey={projectKey}
            items={items}
            onEditTask={onEditTask}
            onToggleTask={onToggleTask}
            onDropProject={onDropProject}
            onEffortChange={onEffortChange}
          />
        ))}
      </Stack>
    </Box>
  );
}
